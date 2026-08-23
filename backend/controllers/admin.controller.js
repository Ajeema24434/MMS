const bcrypt = require('bcryptjs');
const db = require('../config/db');
const logger = require('../utils/logger');

// GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const totalStudentsRes = await db.query('SELECT COUNT(*) as count FROM students');
    const totalMentorsRes = await db.query('SELECT COUNT(*) as count FROM mentors');
    const totalBatchesRes = await db.query('SELECT COUNT(*) as count FROM batches');

    const batchesOverview = await db.query(`
      SELECT 
        b.id,
        b.name,
        b.department,
        b.academic_year,
        b.mentor_id,
        u.name as mentor_name,
        COUNT(s.id) as student_count
      FROM batches b
      LEFT JOIN mentors m ON b.mentor_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN students s ON s.batch_id = b.id
      GROUP BY b.id, b.name, b.department, b.academic_year, b.mentor_id, u.name
      ORDER BY b.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents: totalStudentsRes[0]?.count || 0,
        totalMentors: totalMentorsRes[0]?.count || 0,
        totalBatches: totalBatchesRes[0]?.count || 0
      },
      batches: batchesOverview
    });
  } catch (err) {
    logger.error('Error fetching admin dashboard stats:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching dashboard stats' });
  }
};

// GET /api/admin/mentors
const getMentors = async (req, res) => {
  try {
    const mentors = await db.query(`
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
      ORDER BY m.id DESC
    `);
    return res.status(200).json({ success: true, mentors });
  } catch (err) {
    logger.error('Error fetching mentors:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching mentors' });
  }
};

// POST /api/admin/mentors
const createMentor = async (req, res) => {
  try {
    const { name, email, mentor_code, department, designation, phone, password } = req.body;

    if (!name || !email || !mentor_code || !department) {
      return res.status(400).json({ success: false, message: 'Missing required mentor fields.' });
    }

    const rawPassword = password || 'password123';
    const password_hash = await bcrypt.hash(rawPassword, 10);

    // 1. Create User
    const userRes = await db.query(
      `INSERT INTO users (role, identifier, password_hash, name, email, is_active) VALUES ('MENTOR', ?, ?, ?, ?, 1)`,
      [mentor_code, password_hash, name, email]
    );

    const userId = userRes.insertId;

    // 2. Create Mentor Record
    const mentorRes = await db.query(
      `INSERT INTO mentors (user_id, mentor_code, department, designation, phone) VALUES (?, ?, ?, ?, ?)`,
      [userId, mentor_code, department, designation || 'Assistant Professor', phone || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Mentor created successfully',
      mentorId: mentorRes.insertId
    });
  } catch (err) {
    logger.error('Error creating mentor:', err);
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Mentor code or email already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Server error creating mentor' });
  }
};

// GET /api/admin/mentors/:id
const getMentorById = async (req, res) => {
  try {
    const mentors = await db.query(`
      SELECT m.*, u.name, u.email, u.is_active
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ? LIMIT 1
    `, [req.params.id]);

    if (mentors.length === 0) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    return res.status(200).json({ success: true, mentor: mentors[0] });
  } catch (err) {
    logger.error('Error fetching mentor by id:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching mentor' });
  }
};

// PUT /api/admin/mentors/:id
const updateMentor = async (req, res) => {
  try {
    const { name, email, department, designation, phone } = req.body;
    const mentorId = req.params.id;

    const mentors = await db.query('SELECT user_id FROM mentors WHERE id = ?', [mentorId]);
    if (mentors.length === 0) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    const userId = mentors[0].user_id;

    if (name || email) {
      await db.query('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?', [name, email, userId]);
    }

    await db.query('UPDATE mentors SET department = COALESCE(?, department), designation = COALESCE(?, designation), phone = COALESCE(?, phone) WHERE id = ?', [department, designation, phone, mentorId]);

    return res.status(200).json({ success: true, message: 'Mentor updated successfully' });
  } catch (err) {
    logger.error('Error updating mentor:', err);
    return res.status(500).json({ success: false, message: 'Server error updating mentor' });
  }
};

// GET /api/admin/students
const getStudents = async (req, res) => {
  try {
    const students = await db.query(`
      SELECT 
        s.id,
        s.user_id,
        s.urn,
        s.roll_no,
        s.department,
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
      LEFT JOIN academic_records ar ON ar.student_id = s.id
      ORDER BY s.id DESC
    `);
    return res.status(200).json({ success: true, students });
  } catch (err) {
    logger.error('Error fetching students:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching students' });
  }
};

// POST /api/admin/students
const createStudent = async (req, res) => {
  try {
    const { name, email, urn, roll_no, department, division, batch_id, password } = req.body;

    if (!name || !email || !urn || !roll_no || !department || !division) {
      return res.status(400).json({ success: false, message: 'Missing required student fields.' });
    }

    const rawPassword = password || 'password123';
    const password_hash = await bcrypt.hash(rawPassword, 10);

    // 1. Create User
    const userRes = await db.query(
      `INSERT INTO users (role, identifier, password_hash, name, email, is_active) VALUES ('STUDENT', ?, ?, ?, ?, 1)`,
      [urn, password_hash, name, email]
    );

    const userId = userRes.insertId;

    // 2. Create Student Record
    const studentRes = await db.query(
      `INSERT INTO students (user_id, urn, roll_no, department, division, batch_id, ml_risk_level) VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [userId, urn, roll_no, department, division, batch_id || null]
    );

    const studentId = studentRes.insertId;

    // 3. Create default initial Academic Record
    await db.query(
      `INSERT INTO academic_records (student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag) VALUES (?, 5, 7.00, 80.00, 15.0, 20.0, 50.0, 0, 0)`,
      [studentId]
    );

    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      studentId
    });
  } catch (err) {
    logger.error('Error creating student:', err);
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Student URN or email already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Server error creating student' });
  }
};

// GET /api/admin/students/:id
const getStudentById = async (req, res) => {
  try {
    const students = await db.query(`
      SELECT s.*, u.name, u.email, u.is_active, b.name as batch_name, ar.cgpa, ar.attendance_percentage
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN academic_records ar ON ar.student_id = s.id
      WHERE s.id = ? LIMIT 1
    `, [req.params.id]);

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.status(200).json({ success: true, student: students[0] });
  } catch (err) {
    logger.error('Error fetching student by id:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching student' });
  }
};

// PUT /api/admin/students/:id
const updateStudent = async (req, res) => {
  try {
    const { name, email, roll_no, department, division, batch_id } = req.body;
    const studentId = req.params.id;

    const students = await db.query('SELECT user_id FROM students WHERE id = ?', [studentId]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const userId = students[0].user_id;

    if (name || email) {
      await db.query('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?', [name, email, userId]);
    }

    await db.query('UPDATE students SET roll_no = COALESCE(?, roll_no), department = COALESCE(?, department), division = COALESCE(?, division), batch_id = COALESCE(?, batch_id) WHERE id = ?', [roll_no, department, division, batch_id, studentId]);

    return res.status(200).json({ success: true, message: 'Student updated successfully' });
  } catch (err) {
    logger.error('Error updating student:', err);
    return res.status(500).json({ success: false, message: 'Server error updating student' });
  }
};

// PATCH /api/admin/students/:id/batch
const assignStudentToBatch = async (req, res) => {
  try {
    const { batch_id } = req.body;
    const studentId = req.params.id;

    await db.query('UPDATE students SET batch_id = ? WHERE id = ?', [batch_id || null, studentId]);
    return res.status(200).json({ success: true, message: 'Student assigned to batch successfully' });
  } catch (err) {
    logger.error('Error assigning student to batch:', err);
    return res.status(500).json({ success: false, message: 'Server error assigning batch' });
  }
};

// GET /api/admin/batches
const getBatches = async (req, res) => {
  try {
    const batches = await db.query(`
      SELECT 
        b.id,
        b.name,
        b.department,
        b.academic_year,
        b.mentor_id,
        u.name as mentor_name,
        COUNT(s.id) as student_count
      FROM batches b
      LEFT JOIN mentors m ON b.mentor_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN students s ON s.batch_id = b.id
      GROUP BY b.id, b.name, b.department, b.academic_year, b.mentor_id, u.name
      ORDER BY b.id DESC
    `);
    return res.status(200).json({ success: true, batches });
  } catch (err) {
    logger.error('Error fetching batches:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching batches' });
  }
};

// POST /api/admin/batches
const createBatch = async (req, res) => {
  try {
    const { name, department, academic_year, mentor_id } = req.body;

    if (!name || !department || !academic_year) {
      return res.status(400).json({ success: false, message: 'Missing required batch fields.' });
    }

    const batchRes = await db.query(
      `INSERT INTO batches (name, department, academic_year, mentor_id) VALUES (?, ?, ?, ?)`,
      [name, department, academic_year, mentor_id || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      batchId: batchRes.insertId
    });
  } catch (err) {
    logger.error('Error creating batch:', err);
    return res.status(500).json({ success: false, message: 'Server error creating batch' });
  }
};

// PUT /api/admin/batches/:id
const updateBatch = async (req, res) => {
  try {
    const { name, department, academic_year, mentor_id } = req.body;
    const batchId = req.params.id;

    await db.query(
      `UPDATE batches SET name = COALESCE(?, name), department = COALESCE(?, department), academic_year = COALESCE(?, academic_year), mentor_id = COALESCE(?, mentor_id) WHERE id = ?`,
      [name, department, academic_year, mentor_id, batchId]
    );

    return res.status(200).json({ success: true, message: 'Batch updated successfully' });
  } catch (err) {
    logger.error('Error updating batch:', err);
    return res.status(500).json({ success: false, message: 'Server error updating batch' });
  }
};

// POST /api/admin/batches/:id/assign-mentor
const assignMentorToBatch = async (req, res) => {
  try {
    const { mentor_id } = req.body;
    const batchId = req.params.id;

    await db.query('UPDATE batches SET mentor_id = ? WHERE id = ?', [mentor_id || null, batchId]);
    return res.status(200).json({ success: true, message: 'Mentor assigned to batch successfully' });
  } catch (err) {
    logger.error('Error assigning mentor to batch:', err);
    return res.status(500).json({ success: false, message: 'Server error assigning mentor to batch' });
  }
};

module.exports = {
  getDashboardStats,
  getMentors,
  createMentor,
  getMentorById,
  updateMentor,
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  assignStudentToBatch,
  getBatches,
  createBatch,
  updateBatch,
  assignMentorToBatch
};
