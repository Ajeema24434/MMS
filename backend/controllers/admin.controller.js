const bcrypt = require('bcryptjs');
const db = require('../config/db');
const logger = require('../utils/logger');

const DEPARTMENT = 'AI & DS';

// Helper: Get URN prefix according to Year (FY: 10260910, SY: 10250910, TY: 10240910, BTECH: 10230910)
function getYearUrnPrefix(year) {
  switch (parseInt(year)) {
    case 1: return '10260910'; // FY
    case 2: return '10250910'; // SY
    case 3: return '10240910'; // TY
    case 4: return '10230910'; // BTECH
    default: return '10260910';
  }
}

// Helper: Generate a unique student URN / User ID (10260910nn, 10250910nn, etc. where nn is 00-99)
async function generateStudentUrn(year, rollNo) {
  const prefix = getYearUrnPrefix(year);

  // If rollNo contains a number between 0 and 99, try using that first
  if (rollNo) {
    const match = rollNo.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num >= 0 && num <= 99) {
        const candidate = `${prefix}${String(num).padStart(2, '0')}`;
        const existing = await db.query('SELECT id FROM users WHERE identifier = ? LIMIT 1', [candidate]);
        if (existing.length === 0) {
          return candidate;
        }
      }
    }
  }

  // Find lowest unused nn (01 to 99, then 00) for this year's prefix
  const existing = await db.query('SELECT identifier FROM users WHERE identifier LIKE ?', [`${prefix}%`]);
  const usedNn = new Set(
    existing
      .map(u => u.identifier.slice(prefix.length))
      .filter(nn => /^\d{2}$/.test(nn))
      .map(nn => parseInt(nn, 10))
  );

  for (let i = 1; i <= 99; i++) {
    if (!usedNn.has(i)) {
      return `${prefix}${String(i).padStart(2, '0')}`;
    }
  }
  if (!usedNn.has(0)) {
    return `${prefix}00`;
  }

  return `${prefix}${Date.now().toString().slice(-2)}`;
}

// Helper: Generate an 8-character password
function generate8CharPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// Year prefix mapper: FY, SY, TY, BTECH
function getYearPrefix(year) {
  switch (parseInt(year)) {
    case 1: return 'FY';
    case 2: return 'SY';
    case 3: return 'TY';
    case 4: return 'BTECH';
    default: return 'FY';
  }
}

// ==========================================
// 1. ADMIN DASHBOARD STATS (AI & DS)
// ==========================================
const getDashboardStats = async (req, res) => {
  try {
    const totalStudentsRes = await db.query('SELECT COUNT(*) as count FROM students WHERE department = ?', [DEPARTMENT]);
    const totalMentorsRes = await db.query('SELECT COUNT(*) as count FROM mentors WHERE department = ?', [DEPARTMENT]);
    const totalBatchesRes = await db.query('SELECT COUNT(*) as count FROM batches WHERE department = ?', [DEPARTMENT]);
    const totalDivisionsRes = await db.query('SELECT COUNT(*) as count FROM divisions WHERE department = ?', [DEPARTMENT]);

    const batchesOverview = await db.query(`
      SELECT 
        b.id,
        b.name,
        b.department,
        b.academic_year,
        b.year,
        b.division,
        b.mentor_id,
        u.name as mentor_name,
        COUNT(s.id) as student_count
      FROM batches b
      LEFT JOIN mentors m ON b.mentor_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN students s ON s.batch_id = b.id
      WHERE b.department = ?
      GROUP BY b.id, b.name, b.department, b.academic_year, b.year, b.division, b.mentor_id, u.name
      ORDER BY b.year ASC, b.division ASC, b.name ASC
    `, [DEPARTMENT]);

    const divisionsOverview = await db.query(`
      SELECT 
        d.id,
        d.year,
        d.name as division,
        COUNT(DISTINCT b.id) as batch_count,
        COUNT(DISTINCT s.id) as student_count
      FROM divisions d
      LEFT JOIN batches b ON b.year = d.year AND b.division = d.name AND b.department = d.department
      LEFT JOIN students s ON s.year = d.year AND s.division = d.name AND s.department = d.department
      WHERE d.department = ?
      GROUP BY d.id, d.year, d.name
      ORDER BY d.year ASC, d.name ASC
    `, [DEPARTMENT]);

    return res.status(200).json({
      success: true,
      department: DEPARTMENT,
      stats: {
        totalStudents: totalStudentsRes[0]?.count || 0,
        totalMentors: totalMentorsRes[0]?.count || 0,
        totalBatches: totalBatchesRes[0]?.count || 0,
        totalDivisions: totalDivisionsRes[0]?.count || 0,
        totalYears: 4
      },
      batches: batchesOverview,
      divisions: divisionsOverview
    });
  } catch (err) {
    logger.error('Error fetching admin dashboard stats:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching dashboard stats' });
  }
};

// ==========================================
// 2. DIVISIONS MANAGEMENT (AI & DS - 4 YEARS)
// ==========================================
const getDivisions = async (req, res) => {
  try {
    const { year } = req.query;
    let sql = `
      SELECT 
        d.id,
        d.department,
        d.year,
        d.name,
        d.created_at,
        COUNT(DISTINCT b.id) as batch_count,
        COUNT(DISTINCT s.id) as student_count
      FROM divisions d
      LEFT JOIN batches b ON b.year = d.year AND b.division = d.name AND b.department = d.department
      LEFT JOIN students s ON s.year = d.year AND s.division = d.name AND s.department = d.department
      WHERE d.department = ?
    `;
    const params = [DEPARTMENT];
    if (year) {
      sql += ' AND d.year = ?';
      params.push(parseInt(year));
    }
    sql += `
      GROUP BY d.id, d.department, d.year, d.name, d.created_at
      ORDER BY d.year ASC, d.name ASC
    `;
    const divisions = await db.query(sql, params);
    return res.status(200).json({ success: true, divisions });
  } catch (err) {
    logger.error('Error fetching divisions:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching divisions' });
  }
};

const createDivision = async (req, res) => {
  try {
    const { year, name, auto_create_batches } = req.body;

    if (!year || !name) {
      return res.status(400).json({ success: false, message: 'Year (1-4) and division name are required.' });
    }

    const yearNum = parseInt(year);
    if (yearNum < 1 || yearNum > 4) {
      return res.status(400).json({ success: false, message: 'Year must be between 1 and 4.' });
    }

    const cleanName = name.trim().toUpperCase();

    // Check duplicate division for this year in AI & DS
    const existing = await db.query(
      'SELECT id FROM divisions WHERE department = ? AND year = ? AND name = ? LIMIT 1',
      [DEPARTMENT, yearNum, cleanName]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Division '${cleanName}' already exists for Year ${yearNum} in ${DEPARTMENT}.`
      });
    }

    const divRes = await db.query(
      'INSERT INTO divisions (department, year, name) VALUES (?, ?, ?)',
      [DEPARTMENT, yearNum, cleanName]
    );

    const divisionId = divRes.insertId;
    let createdBatches = [];

    // Auto-create 4 class batches for this division (e.g. FE-AIDS-C-B1, B2, B3, B4)
    if (auto_create_batches !== false) {
      const yrPrefix = getYearPrefix(yearNum);
      for (let b = 1; b <= 4; b++) {
        const batchName = `${yrPrefix}-AIDS-${cleanName}-B${b}`;
        try {
          const bRes = await db.query(
            'INSERT INTO batches (name, department, academic_year, year, division, mentor_id) VALUES (?, ?, ?, ?, ?, NULL)',
            [batchName, DEPARTMENT, '2024-2025', yearNum, cleanName]
          );
          createdBatches.push({ id: bRes.insertId, name: batchName });
        } catch (batchErr) {
          // If already exists, ignore duplicate
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: `Division '${cleanName}' for Year ${yearNum} created successfully${createdBatches.length > 0 ? ` with 4 class batches.` : '.'}`,
      divisionId,
      createdBatches
    });
  } catch (err) {
    logger.error('Error creating division:', err);
    return res.status(500).json({ success: false, message: 'Server error creating division' });
  }
};

const deleteDivision = async (req, res) => {
  try {
    const divId = req.params.id;
    const existing = await db.query('SELECT * FROM divisions WHERE id = ?', [divId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Division not found' });
    }

    await db.query('DELETE FROM divisions WHERE id = ?', [divId]);
    return res.status(200).json({ success: true, message: 'Division deleted successfully' });
  } catch (err) {
    logger.error('Error deleting division:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting division' });
  }
};

// ==========================================
// 3. MENTOR MANAGEMENT (AI & DS)
// ==========================================
const getMentors = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT 
        m.id,
        m.user_id,
        m.mentor_code,
        m.department,
        m.designation,
        m.phone,
        u.name,
        u.email,
        u.is_active,
        b.id as batch_id,
        b.name as batch_name
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN batches b ON b.mentor_id = m.id
      WHERE m.department = ?
      ORDER BY m.id DESC, b.name ASC
    `, [DEPARTMENT]);

    const mentorMap = new Map();
    for (const r of rows) {
      if (!mentorMap.has(r.id)) {
        mentorMap.set(r.id, {
          id: r.id,
          user_id: r.user_id,
          mentor_code: r.mentor_code,
          department: r.department,
          designation: r.designation,
          phone: r.phone,
          name: r.name,
          email: r.email,
          is_active: r.is_active,
          batches: []
        });
      }
      if (r.batch_id && r.batch_name) {
        mentorMap.get(r.id).batches.push({
          id: r.batch_id,
          name: r.batch_name
        });
      }
    }

    const mentors = Array.from(mentorMap.values()).map(m => {
      const batchNames = m.batches.map(b => b.name);
      return {
        ...m,
        batch_name: batchNames.length > 0 ? batchNames.join(', ') : null,
        batch_names: batchNames,
        batches_count: m.batches.length
      };
    });

    return res.status(200).json({ success: true, mentors });
  } catch (err) {
    logger.error('Error fetching mentors:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching mentors' });
  }
};

const createMentor = async (req, res) => {
  try {
    let { name, email, mentor_code, department, designation, phone, password } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Mentor name is required.' });
    }

    const cleanName = name.trim();
    const cleanDept = DEPARTMENT; // Strictly AI & DS

    // If mentor_code (Mentor ID/Username) is not provided, automatically generate one
    let cleanCode = mentor_code ? mentor_code.trim() : '';
    if (!cleanCode) {
      const countRes = await db.query('SELECT COUNT(*) as cnt FROM mentors');
      const nextNum = (countRes[0]?.cnt || 0) + 105;
      cleanCode = `MNT_AIDS_${nextNum}`;
    }

    // Email generation if not provided
    let cleanEmail = email ? email.trim().toLowerCase() : '';
    if (!cleanEmail) {
      const sanitizedName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.');
      cleanEmail = `${sanitizedName}@aids.mms.edu`;
    }

    // Check duplicate mentor_code or email
    const existingUser = await db.query(
      'SELECT id, identifier, email FROM users WHERE identifier = ? OR email = ? LIMIT 1',
      [cleanCode, cleanEmail]
    );
    if (existingUser.length > 0) {
      const isDupCode = existingUser[0].identifier.toLowerCase() === cleanCode.toLowerCase();
      return res.status(409).json({
        success: false,
        message: isDupCode ? `Mentor code / Username '${cleanCode}' already exists.` : `Email '${cleanEmail}' is already registered.`
      });
    }

    // Generate password using bcrypt
    const rawPassword = password ? password.trim() : `Pass@${cleanCode}`;
    const password_hash = await bcrypt.hash(rawPassword, 10);

    // 1. Create User
    const userRes = await db.query(
      `INSERT INTO users (role, identifier, password_hash, initial_password, name, email, is_active) VALUES ('MENTOR', ?, ?, ?, ?, ?, 1)`,
      [cleanCode, password_hash, rawPassword, cleanName, cleanEmail]
    );

    const userId = userRes.insertId;

    // 2. Create Mentor Record
    const mentorRes = await db.query(
      `INSERT INTO mentors (user_id, mentor_code, department, designation, phone) VALUES (?, ?, ?, ?, ?)`,
      [userId, cleanCode, cleanDept, designation?.trim() || 'Assistant Professor', phone?.trim() || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Faculty mentor registered successfully',
      mentorId: mentorRes.insertId,
      credentials: {
        username: cleanCode, // Mentor ID as username
        password: rawPassword,
        name: cleanName,
        department: cleanDept,
        email: cleanEmail
      }
    });
  } catch (err) {
    logger.error('Error creating mentor:', err);
    if (err.message && (err.message.includes('UNIQUE') || err.message.includes('Duplicate') || err.code === 'ER_DUP_ENTRY')) {
      return res.status(409).json({ success: false, message: 'Mentor code or email already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Server error creating mentor' });
  }
};

const getMentorById = async (req, res) => {
  try {
    const mentors = await db.query(`
      SELECT m.*, u.name, u.email, u.is_active, b.id as batch_id, b.name as batch_name
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN batches b ON b.mentor_id = m.id
      WHERE m.id = ? AND m.department = ? LIMIT 1
    `, [req.params.id, DEPARTMENT]);

    if (mentors.length === 0) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    return res.status(200).json({ success: true, mentor: mentors[0] });
  } catch (err) {
    logger.error('Error fetching mentor by id:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching mentor' });
  }
};

const updateMentor = async (req, res) => {
  try {
    const { name, email, designation, phone } = req.body;
    const mentorId = req.params.id;

    const mentors = await db.query('SELECT user_id FROM mentors WHERE id = ?', [mentorId]);
    if (mentors.length === 0) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    const userId = mentors[0].user_id;

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const dup = await db.query('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1', [cleanEmail, userId]);
      if (dup.length > 0) {
        return res.status(409).json({ success: false, message: `Email '${email}' is already in use by another account.` });
      }
    }

    if (name || email) {
      await db.query(
        'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?',
        [name ? name.trim() : null, email ? email.trim().toLowerCase() : null, userId]
      );
    }

    await db.query(
      'UPDATE mentors SET designation = COALESCE(?, designation), phone = COALESCE(?, phone) WHERE id = ?',
      [designation ? designation.trim() : null, phone ? phone.trim() : null, mentorId]
    );

    return res.status(200).json({ success: true, message: 'Mentor updated successfully' });
  } catch (err) {
    logger.error('Error updating mentor:', err);
    return res.status(500).json({ success: false, message: 'Server error updating mentor' });
  }
};

const deleteMentor = async (req, res) => {
  try {
    const mentorId = req.params.id;
    const mentors = await db.query('SELECT user_id FROM mentors WHERE id = ?', [mentorId]);
    if (mentors.length === 0) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    const userId = mentors[0].user_id;

    // Reset assigned batches for this mentor
    await db.query('UPDATE batches SET mentor_id = NULL WHERE mentor_id = ?', [mentorId]);

    // Delete mentor and user
    await db.query('DELETE FROM mentors WHERE id = ?', [mentorId]);
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    return res.status(200).json({ success: true, message: 'Mentor deleted successfully' });
  } catch (err) {
    logger.error('Error deleting mentor:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting mentor' });
  }
};

// ==========================================
// 4. STUDENT MANAGEMENT (8-CHAR USER ID, AI & DS)
// ==========================================
const getStudents = async (req, res) => {
  try {
    const { year, division, batch_id } = req.query;
    let sql = `
      SELECT 
        s.id,
        s.user_id,
        s.urn,
        s.roll_no,
        s.department,
        s.year,
        s.division,
        s.batch_id,
        s.ml_risk_level,
        u.name,
        u.email,
        b.name as batch_name,
        ar.cgpa,
        ar.attendance_percentage,
        ar.defaulter_flag
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN academic_records ar ON ar.student_id = s.id AND ar.semester = s.semester
      WHERE s.department = ?
    `;
    const params = [DEPARTMENT];
    if (year) {
      sql += ' AND s.year = ?';
      params.push(parseInt(year));
    }
    if (division) {
      sql += ' AND s.division = ?';
      params.push(division.trim().toUpperCase());
    }
    if (batch_id) {
      sql += ' AND s.batch_id = ?';
      params.push(parseInt(batch_id));
    }
    sql += `
      ORDER BY s.year ASC, s.division ASC, s.id DESC
    `;
    const students = await db.query(sql, params);
    return res.status(200).json({ success: true, students });
  } catch (err) {
    logger.error('Error fetching students:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching students' });
  }
};

const createStudent = async (req, res) => {
  try {
    let { name, email, urn, roll_no, year, division, batch_id, password } = req.body;

    if (!name || !roll_no) {
      return res.status(400).json({ success: false, message: 'Student name and roll number are required.' });
    }

    const cleanName = name.trim();
    const cleanRoll = roll_no.trim();
    const cleanDept = DEPARTMENT;
    const cleanYear = year ? parseInt(year) : 1;
    const cleanDiv = division ? division.trim().toUpperCase() : 'A';

    // Student URN (User ID) generation (FY: 10260910nn, SY: 10250910nn, TY: 10240910nn, BTECH: 10230910nn)
    let cleanUrn = urn ? urn.trim() : '';
    if (!cleanUrn) {
      cleanUrn = await generateStudentUrn(cleanYear, cleanRoll);
    }

    // Auto-generate email if not provided
    let cleanEmail = email ? email.trim().toLowerCase() : '';
    if (!cleanEmail) {
      cleanEmail = `${cleanUrn}@student.mms.edu`;
    }

    // Check duplicate URN/identifier or email
    const existingUser = await db.query(
      'SELECT id, identifier, email FROM users WHERE identifier = ? OR email = ? LIMIT 1',
      [cleanUrn, cleanEmail]
    );
    if (existingUser.length > 0) {
      const isDupUrn = existingUser[0].identifier.toLowerCase() === cleanUrn.toLowerCase();
      return res.status(409).json({
        success: false,
        message: isDupUrn ? `Student User ID '${cleanUrn}' already exists.` : `Email '${cleanEmail}' is already registered.`
      });
    }

    // Check duplicate roll_no within same year & division in AI & DS
    const existingRoll = await db.query(
      'SELECT id FROM students WHERE roll_no = ? AND department = ? AND year = ? AND division = ? LIMIT 1',
      [cleanRoll, cleanDept, cleanYear, cleanDiv]
    );
    if (existingRoll.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Roll number '${cleanRoll}' already exists in Year ${cleanYear} Div ${cleanDiv}.`
      });
    }

    // Verify batch exists if provided
    if (batch_id) {
      const batchCheck = await db.query('SELECT id FROM batches WHERE id = ? LIMIT 1', [batch_id]);
      if (batchCheck.length === 0) {
        return res.status(404).json({ success: false, message: 'Selected batch does not exist.' });
      }
    }

    // Generate password using bcrypt
    const rawPassword = password ? password.trim() : `Pass@${cleanUrn}`;
    const password_hash = await bcrypt.hash(rawPassword, 10);

    // 1. Create User (Identifier is student URN / User ID)
    const userRes = await db.query(
      `INSERT INTO users (role, identifier, password_hash, initial_password, name, email, is_active) VALUES ('STUDENT', ?, ?, ?, ?, ?, 1)`,
      [cleanUrn, password_hash, rawPassword, cleanName, cleanEmail]
    );

    const userId = userRes.insertId;

    // 2. Create Student Record
    const studentRes = await db.query(
      `INSERT INTO students (user_id, urn, roll_no, department, year, division, batch_id, ml_risk_level) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [userId, cleanUrn, cleanRoll, cleanDept, cleanYear, cleanDiv, batch_id || null]
    );

    const studentId = studentRes.insertId;

    // 3. Create default initial Academic Record
    const defaultSem = cleanYear === 1 ? 1 : (cleanYear === 2 ? 3 : (cleanYear === 3 ? 5 : 7));
    await db.query(
      `INSERT INTO academic_records (student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag) VALUES (?, ?, 7.50, 80.00, 18.0, 22.0, 50.0, 0, 0)`,
      [studentId, defaultSem]
    );

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      studentId,
      credentials: {
        username: cleanUrn, // Student URN as User ID
        urn: cleanUrn,
        password: rawPassword,
        name: cleanName,
        roll_no: cleanRoll,
        year: cleanYear,
        division: cleanDiv,
        department: cleanDept
      }
    });
  } catch (err) {
    logger.error('Error creating student:', err);
    if (err.message && (err.message.includes('UNIQUE') || err.message.includes('Duplicate') || err.code === 'ER_DUP_ENTRY')) {
      return res.status(409).json({ success: false, message: 'Student User ID or email already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Server error creating student' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const students = await db.query(`
      SELECT s.*, u.name, u.email, u.is_active, b.name as batch_name, ar.cgpa, ar.attendance_percentage
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN academic_records ar ON ar.student_id = s.id AND ar.semester = s.semester
      WHERE s.id = ? AND s.department = ? LIMIT 1
    `, [req.params.id, DEPARTMENT]);

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.status(200).json({ success: true, student: students[0] });
  } catch (err) {
    logger.error('Error fetching student by id:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching student' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { name, email, roll_no, year, division, batch_id } = req.body;
    const studentId = req.params.id;

    const students = await db.query('SELECT user_id, department, year, division FROM students WHERE id = ?', [studentId]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const userId = students[0].user_id;
    const currentYear = year !== undefined ? parseInt(year) : students[0].year;
    const currentDiv = division ? division.trim().toUpperCase() : students[0].division;

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const dup = await db.query('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1', [cleanEmail, userId]);
      if (dup.length > 0) {
        return res.status(409).json({ success: false, message: `Email '${email}' is already in use by another account.` });
      }
    }

    if (roll_no) {
      const cleanRoll = roll_no.trim();
      const dupRoll = await db.query(
        'SELECT id FROM students WHERE roll_no = ? AND department = ? AND year = ? AND division = ? AND id != ? LIMIT 1',
        [cleanRoll, DEPARTMENT, currentYear, currentDiv, studentId]
      );
      if (dupRoll.length > 0) {
        return res.status(409).json({ success: false, message: `Roll number '${cleanRoll}' already exists in Year ${currentYear} Div ${currentDiv}.` });
      }
    }

    if (batch_id) {
      const batchCheck = await db.query('SELECT id FROM batches WHERE id = ? LIMIT 1', [batch_id]);
      if (batchCheck.length === 0) {
        return res.status(404).json({ success: false, message: 'Selected batch does not exist.' });
      }
    }

    if (name || email) {
      await db.query(
        'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?',
        [name ? name.trim() : null, email ? email.trim().toLowerCase() : null, userId]
      );
    }

    await db.query(
      'UPDATE students SET roll_no = COALESCE(?, roll_no), year = COALESCE(?, year), division = COALESCE(?, division), batch_id = COALESCE(?, batch_id) WHERE id = ?',
      [
        roll_no ? roll_no.trim() : null,
        year !== undefined ? parseInt(year) : null,
        division ? division.trim().toUpperCase() : null,
        batch_id !== undefined ? (batch_id || null) : null,
        studentId
      ]
    );

    return res.status(200).json({ success: true, message: 'Student updated successfully' });
  } catch (err) {
    logger.error('Error updating student:', err);
    return res.status(500).json({ success: false, message: 'Server error updating student' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const students = await db.query('SELECT user_id FROM students WHERE id = ?', [studentId]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const userId = students[0].user_id;

    await db.query('DELETE FROM academic_records WHERE student_id = ?', [studentId]);
    await db.query('DELETE FROM students WHERE id = ?', [studentId]);
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    return res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    logger.error('Error deleting student:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting student' });
  }
};

const assignStudentToBatch = async (req, res) => {
  try {
    const { batch_id } = req.body;
    const studentId = req.params.id;

    const student = await db.query('SELECT id FROM students WHERE id = ?', [studentId]);
    if (student.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (batch_id) {
      const batch = await db.query('SELECT id, name FROM batches WHERE id = ?', [batch_id]);
      if (batch.length === 0) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }
    }

    await db.query('UPDATE students SET batch_id = ? WHERE id = ?', [batch_id || null, studentId]);
    return res.status(200).json({ success: true, message: 'Student batch allocation updated successfully' });
  } catch (err) {
    logger.error('Error assigning student to batch:', err);
    return res.status(500).json({ success: false, message: 'Server error assigning batch' });
  }
};

// ==========================================
// 5. BATCH MANAGEMENT (AI & DS - 4 PER CLASS)
// ==========================================
const getBatches = async (req, res) => {
  try {
    const { year, division } = req.query;
    let sql = `
      SELECT 
        b.id,
        b.name,
        b.department,
        b.academic_year,
        b.year,
        b.division,
        b.mentor_id,
        u.name as mentor_name,
        m.mentor_code,
        COUNT(s.id) as student_count
      FROM batches b
      LEFT JOIN mentors m ON b.mentor_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN students s ON s.batch_id = b.id
      WHERE b.department = ?
    `;
    const params = [DEPARTMENT];
    if (year) {
      sql += ' AND b.year = ?';
      params.push(parseInt(year));
    }
    if (division) {
      sql += ' AND b.division = ?';
      params.push(division.trim().toUpperCase());
    }
    sql += `
      GROUP BY b.id, b.name, b.department, b.academic_year, b.year, b.division, b.mentor_id, u.name, m.mentor_code
      ORDER BY b.year ASC, b.division ASC, b.name ASC
    `;
    const batches = await db.query(sql, params);
    return res.status(200).json({ success: true, batches });
  } catch (err) {
    logger.error('Error fetching batches:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching batches' });
  }
};

const createBatch = async (req, res) => {
  try {
    const { name, year, division, academic_year, mentor_id } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Batch name is required.' });
    }

    const cleanName = name.trim();
    const cleanDept = DEPARTMENT;
    const cleanYear = year ? parseInt(year) : null;
    const cleanDiv = division ? division.trim().toUpperCase() : null;
    const cleanAcdYear = academic_year ? academic_year.trim() : '2024-2025';

    // Check duplicate batch name
    const existing = await db.query('SELECT id FROM batches WHERE name = ? LIMIT 1', [cleanName]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Batch name '${cleanName}' already exists.` });
    }

    // Verify mentor exists if provided
    if (mentor_id) {
      const mentorCheck = await db.query('SELECT id FROM mentors WHERE id = ?', [mentor_id]);
      if (mentorCheck.length === 0) {
        return res.status(404).json({ success: false, message: 'Selected mentor not found.' });
      }
    }

    const batchRes = await db.query(
      `INSERT INTO batches (name, department, academic_year, year, division, mentor_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [cleanName, cleanDept, cleanAcdYear, cleanYear, cleanDiv, mentor_id || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      batchId: batchRes.insertId
    });
  } catch (err) {
    logger.error('Error creating batch:', err);
    if (err.message && (err.message.includes('UNIQUE') || err.message.includes('Duplicate') || err.code === 'ER_DUP_ENTRY')) {
      return res.status(409).json({ success: false, message: `Batch name '${req.body.name}' already exists.` });
    }
    return res.status(500).json({ success: false, message: 'Server error creating batch' });
  }
};

const updateBatch = async (req, res) => {
  try {
    const { name, year, division, academic_year, mentor_id } = req.body;
    const batchId = req.params.id;

    const existing = await db.query('SELECT id FROM batches WHERE id = ?', [batchId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    if (name) {
      const cleanName = name.trim();
      const dup = await db.query('SELECT id FROM batches WHERE name = ? AND id != ? LIMIT 1', [cleanName, batchId]);
      if (dup.length > 0) {
        return res.status(409).json({ success: false, message: `Batch name '${cleanName}' already exists.` });
      }
    }

    if (mentor_id) {
      const mentorCheck = await db.query('SELECT id FROM mentors WHERE id = ?', [mentor_id]);
      if (mentorCheck.length === 0) {
        return res.status(404).json({ success: false, message: 'Selected mentor not found.' });
      }
    }

    await db.query(
      `UPDATE batches SET name = COALESCE(?, name), year = COALESCE(?, year), division = COALESCE(?, division), academic_year = COALESCE(?, academic_year), mentor_id = COALESCE(?, mentor_id) WHERE id = ?`,
      [
        name ? name.trim() : null,
        year !== undefined ? parseInt(year) : null,
        division ? division.trim().toUpperCase() : null,
        academic_year ? academic_year.trim() : null,
        mentor_id !== undefined ? (mentor_id || null) : null,
        batchId
      ]
    );

    return res.status(200).json({ success: true, message: 'Batch updated successfully' });
  } catch (err) {
    logger.error('Error updating batch:', err);
    return res.status(500).json({ success: false, message: 'Server error updating batch' });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const batchId = req.params.id;
    const existing = await db.query('SELECT id FROM batches WHERE id = ?', [batchId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Unassign students from this batch
    await db.query('UPDATE students SET batch_id = NULL WHERE batch_id = ?', [batchId]);

    // Delete batch
    await db.query('DELETE FROM batches WHERE id = ?', [batchId]);

    return res.status(200).json({ success: true, message: 'Batch deleted successfully' });
  } catch (err) {
    logger.error('Error deleting batch:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting batch' });
  }
};

const assignMentorToBatch = async (req, res) => {
  try {
    const { mentor_id } = req.body;
    const batchId = req.params.id;

    const batch = await db.query('SELECT id, name FROM batches WHERE id = ?', [batchId]);
    if (batch.length === 0) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    let mentorName = null;
    if (mentor_id) {
      const mentor = await db.query(
        'SELECT m.id, u.name FROM mentors m JOIN users u ON m.user_id = u.id WHERE m.id = ?',
        [mentor_id]
      );
      if (mentor.length === 0) {
        return res.status(404).json({ success: false, message: 'Selected mentor not found.' });
      }
      mentorName = mentor[0].name;
    }

    await db.query('UPDATE batches SET mentor_id = ? WHERE id = ?', [mentor_id || null, batchId]);

    return res.status(200).json({
      success: true,
      message: mentor_id 
        ? `Mentor ${mentorName} assigned to batch '${batch[0].name}' successfully.`
        : `Mentor unassigned from batch '${batch[0].name}'.`
    });
  } catch (err) {
    logger.error('Error assigning mentor to batch:', err);
    return res.status(500).json({ success: false, message: 'Server error assigning mentor to batch' });
  }
};

// ==========================================
// 6. CREDENTIALS & PDF EXPORT DATA
// ==========================================
const getStudentCredentials = async (req, res) => {
  try {
    const { year, division, batch_id } = req.query;
    let sql = `
      SELECT 
        s.id,
        s.roll_no,
        s.urn,
        s.year,
        s.division,
        s.department,
        s.batch_id,
        u.name,
        u.email,
        u.identifier,
        u.initial_password,
        b.name as batch_name,
        mu.name as mentor_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN mentors m ON b.mentor_id = m.id
      LEFT JOIN users mu ON m.user_id = mu.id
      WHERE s.department = ?
    `;
    const params = [DEPARTMENT];
    if (year && year !== 'ALL') {
      sql += ' AND s.year = ?';
      params.push(parseInt(year));
    }
    if (division && division !== 'ALL') {
      sql += ' AND s.division = ?';
      params.push(division.trim().toUpperCase());
    }
    if (batch_id && batch_id !== 'ALL') {
      sql += ' AND s.batch_id = ?';
      params.push(parseInt(batch_id));
    }
    sql += ' ORDER BY s.year ASC, s.division ASC, b.name ASC, s.roll_no ASC';

    const rows = await db.query(sql, params);
    const students = rows.map((r, index) => ({
      sr_no: index + 1,
      id: r.id,
      roll_no: r.roll_no,
      name: r.name,
      urn: r.urn,
      user_id: r.urn,
      username: r.urn,
      password: r.initial_password || `Pass@${r.urn}`,
      email: r.email,
      department: r.department,
      year: r.year,
      year_name: getYearPrefix(r.year),
      division: r.division,
      batch_id: r.batch_id,
      batch_name: r.batch_name || 'Unassigned',
      mentor_name: r.mentor_name || 'Unassigned'
    }));

    return res.status(200).json({
      success: true,
      department: DEPARTMENT,
      count: students.length,
      students
    });
  } catch (err) {
    logger.error('Error fetching student credentials:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching student credentials' });
  }
};

const getMentorCredentials = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT 
        m.id,
        m.mentor_code,
        m.department,
        m.designation,
        m.phone,
        u.name,
        u.email,
        u.identifier,
        u.initial_password,
        b.name as batch_name
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN batches b ON b.mentor_id = m.id
      WHERE m.department = ?
      ORDER BY m.id ASC, b.name ASC
    `, [DEPARTMENT]);

    const mentorMap = new Map();
    for (const r of rows) {
      if (!mentorMap.has(r.id)) {
        mentorMap.set(r.id, {
          id: r.id,
          name: r.name,
          mentor_code: r.mentor_code,
          username: r.mentor_code,
          password: r.initial_password || `Pass@${r.mentor_code}`,
          email: r.email,
          department: r.department,
          designation: r.designation,
          phone: r.phone,
          batches: []
        });
      }
      if (r.batch_name) {
        mentorMap.get(r.id).batches.push(r.batch_name);
      }
    }

    const mentors = Array.from(mentorMap.values()).map((m, index) => ({
      sr_no: index + 1,
      ...m,
      assigned_batches: m.batches.length > 0 ? m.batches.join(', ') : 'None'
    }));

    return res.status(200).json({
      success: true,
      department: DEPARTMENT,
      count: mentors.length,
      mentors
    });
  } catch (err) {
    logger.error('Error fetching mentor credentials:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching mentor credentials' });
  }
};

module.exports = {
  getDashboardStats,
  getDivisions,
  createDivision,
  deleteDivision,
  getMentors,
  createMentor,
  getMentorById,
  updateMentor,
  deleteMentor,
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  assignStudentToBatch,
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  assignMentorToBatch,
  getStudentCredentials,
  getMentorCredentials
};
