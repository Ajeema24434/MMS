const db = require('../config/db');
const logger = require('../utils/logger');

// Helper to fetch student record
const getStudentByUserId = async (userId) => {
  const students = await db.query(`
    SELECT 
      s.id,
      s.user_id,
      s.urn,
      s.roll_no,
      s.department,
      s.year,
      s.division,
      s.semester,
      s.phone,
      s.batch_id,
      s.ml_risk_level,
      u.name,
      u.email,
      b.name as batch_name,
      b.academic_year,
      m.id as mentor_id,
      mu.id as mentor_user_id,
      mu.name as mentor_name,
      m.department as mentor_department,
      m.phone as mentor_phone,
      mu.email as mentor_email,
      m.mentor_code as mentor_college_id
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN batches b ON s.batch_id = b.id
    LEFT JOIN mentors m ON b.mentor_id = m.id
    LEFT JOIN users mu ON m.user_id = mu.id
    WHERE s.user_id = ? LIMIT 1
  `, [userId]);

  return students.length > 0 ? students[0] : null;
};

// Dynamic Subject Mark Generator based on Student Year and actual Academic Records
const getStudentSubjectMarks = (student, latestAcademic) => {
  const year = student.year || 1;
  const subjectsByYear = {
    1: ['Applied Mathematics-I', 'Engineering Physics', 'Basic Electrical & Electronics', 'Programming & Problem Solving', 'Engineering Graphics'],
    2: ['Discrete Mathematics', 'Data Structures & Algorithms', 'Database Management Systems', 'Digital Logic Design', 'Object Oriented Programming'],
    3: ['Machine Learning', 'Operating Systems', 'Computer Networks', 'Design & Analysis of Algorithms', 'Artificial Intelligence'],
    4: ['Deep Learning', 'Cloud Computing', 'Big Data Analytics', 'Natural Language Processing', 'Information & Cyber Security']
  };

  const subjects = subjectsByYear[year] || subjectsByYear[1];
  const ise = latestAcademic?.ise_marks || 18.0;
  const mse = latestAcademic?.mse_marks || 24.0;
  const ese = latestAcademic?.ese_marks || 58.0;

  return subjects.map((subj, idx) => {
    // slight deterministic variation per subject based on student id and subject index
    const delta = (((student.id * 7 + idx * 11) % 9) - 4);
    const internal = Math.min(30, Math.max(10, Math.round((ise / 20 * 15 + mse / 30 * 15) + delta * 0.4)));
    const exam = Math.min(70, Math.max(25, Math.round(ese + delta * 0.8)));
    const total = internal + exam;
    let grade = 'P';
    if (total >= 85) grade = 'O';
    else if (total >= 75) grade = 'A+';
    else if (total >= 65) grade = 'A';
    else if (total >= 55) grade = 'B+';
    else if (total >= 45) grade = 'B';
    else if (total >= 40) grade = 'C';
    else grade = 'F';

    return {
      subject: subj,
      internal,
      exam,
      total,
      grade
    };
  });
};

// GET /api/student/dashboard
const getStudentDashboard = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Academic records
    const academicRecords = await db.query(
      'SELECT * FROM academic_records WHERE student_id = ? ORDER BY semester DESC',
      [student.id]
    );

    const latestAcademic = academicRecords[0] || {
      attendance_percentage: 82.45,
      cgpa: 7.42,
      ise_marks: 19.5,
      mse_marks: 27.0,
      ese_marks: 62.0
    };

    // Dynamic Subject breakdown based on academic records
    const subjectMarks = getStudentSubjectMarks(student, latestAcademic);

    // Meetings
    const meetings = student.batch_id ? await db.query(
      'SELECT * FROM meetings WHERE batch_id = ? ORDER BY meeting_date DESC',
      [student.batch_id]
    ) : [];

    const upcomingMeeting = meetings.find(m => m.status === 'Scheduled') || meetings[0] || {
      meeting_number: 2,
      meeting_date: '2024-08-28 14:00:00',
      mode: 'Offline / Lab 4',
      agenda: 'Mid-Term Academic Review & Guidance'
    };

    const attendedRes = await db.query(
      "SELECT COUNT(*) as count FROM meeting_attendees WHERE student_id = ? AND status = 'Present'",
      [student.id]
    );
    const meetingsAttendedCount = attendedRes[0]?.count || 0;

    // Activities
    const activities = await db.query(
      'SELECT * FROM activities WHERE student_id = ? ORDER BY date_achieved DESC',
      [student.id]
    );
    const pendingActivitiesCount = activities.filter(a => a.status === 'Pending').length;

    // Complaints
    const complaints = await db.query(
      'SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC',
      [student.id]
    );
    const pendingComplaintsCount = complaints.filter(c => c.status !== 'Resolved').length;

    // Recent Notifications
    const notifications = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );

    // Recent Mentor Advice
    const mentorAdvice = "Focus on DBMS lab assignments and complete NPTEL credits before end-sem exams. Attendance threshold must be maintained above 75%.";

    return res.status(200).json({
      success: true,
      student,
      summary: {
        attendance: latestAcademic.attendance_percentage || 82.45,
        avgMarks: (latestAcademic.cgpa * 10).toFixed(2) || 74.20,
        academicProgress: latestAcademic.defaulter_flag ? 'Needs Improvement' : 'Good',
        meetingsAttended: `${meetingsAttendedCount}/${meetings.length || 1}`,
        pendingActivities: pendingActivitiesCount,
        complaints: `${pendingComplaintsCount} ${pendingComplaintsCount > 0 ? 'In Progress' : 'Resolved'}`
      },
      subjectMarks,
      upcomingMeeting,
      mentorAdvice,
      notifications,
      academicRecords,
      activities,
      complaints
    });
  } catch (err) {
    logger.error('Error fetching student dashboard:', err);
    return res.status(500).json({ success: false, message: 'Server error loading student dashboard' });
  }
};

// GET /api/student/profile
const getStudentProfile = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    return res.status(200).json({ success: true, student });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// PUT /api/student/profile (Edit permitted personal fields ONLY)
const updateStudentProfile = async (req, res) => {
  try {
    const { phone, email } = req.body;
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    if (phone) {
      await db.query('UPDATE students SET phone = ? WHERE id = ?', [phone.trim(), student.id]);
    }
    if (email) {
      await db.query('UPDATE users SET email = ? WHERE id = ?', [email.trim(), student.user_id]);
    }

    // Simultaneously notify assigned mentor
    if (student.mentor_user_id) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [student.mentor_user_id, `Mentee ${student.name} (${student.urn}) updated contact information (Phone: ${phone ? phone.trim() : student.phone}, Email: ${email ? email.trim() : student.email}).`]
      );
    }

    logger.info(`Student profile updated for URN ${student.urn}`);
    return res.status(200).json({ success: true, message: 'Personal profile details updated successfully.' });
  } catch (err) {
    logger.error('Error updating student profile:', err);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

// GET /api/student/academic
const getStudentAcademic = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const records = await db.query('SELECT * FROM academic_records WHERE student_id = ? ORDER BY semester DESC', [student.id]);

    const subjectMarks = getStudentSubjectMarks(student, records[0]);

    return res.status(200).json({
      success: true,
      records,
      subjectMarks,
      overallAttendance: records[0]?.attendance_percentage || 82.45,
      subjectsBelowAttendance: records[0]?.subjects_failed_count || 0,
      academicPerformance: records[0]?.defaulter_flag ? 'Needs Guidance' : 'Good Progress'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching academic records' });
  }
};

// POST /api/student/academic (Add or update semester academic details)
const addOrUpdateStudentAcademic = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    let { semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count } = req.body;

    const parsedSemester = parseInt(semester);
    if (isNaN(parsedSemester) || parsedSemester < 1 || parsedSemester > 8) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8.' });
    }

    const parsedCgpa = parseFloat(cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      return res.status(400).json({ success: false, message: 'CGPA must be a valid number between 0.00 and 10.00.' });
    }

    const parsedAttendance = parseFloat(attendance_percentage);
    if (isNaN(parsedAttendance) || parsedAttendance < 0 || parsedAttendance > 100) {
      return res.status(400).json({ success: false, message: 'Attendance percentage must be between 0 and 100.' });
    }

    const parsedIse = ise_marks !== undefined && ise_marks !== '' ? parseFloat(ise_marks) : 18.0;
    const parsedMse = mse_marks !== undefined && mse_marks !== '' ? parseFloat(mse_marks) : 22.0;
    const parsedEse = ese_marks !== undefined && ese_marks !== '' ? parseFloat(ese_marks) : 55.0;
    const parsedFailed = subjects_failed_count !== undefined && subjects_failed_count !== '' ? parseInt(subjects_failed_count) : 0;
    const defaulter_flag = (parsedAttendance < 75 || parsedFailed > 0) ? 1 : 0;

    // Check if record for this student and semester already exists
    const existing = await db.query(
      'SELECT id FROM academic_records WHERE student_id = ? AND semester = ? LIMIT 1',
      [student.id, parsedSemester]
    );

    let recordId;
    if (existing.length > 0) {
      recordId = existing[0].id;
      await db.query(`
        UPDATE academic_records
        SET cgpa = ?, attendance_percentage = ?, ise_marks = ?, mse_marks = ?, ese_marks = ?, subjects_failed_count = ?, defaulter_flag = ?
        WHERE id = ?
      `, [parsedCgpa, parsedAttendance, parsedIse, parsedMse, parsedEse, parsedFailed, defaulter_flag, recordId]);
      logger.info(`Updated academic record #${recordId} for Student URN ${student.urn} (Semester ${parsedSemester})`);
    } else {
      const insRes = await db.query(`
        INSERT INTO academic_records (student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [student.id, parsedSemester, parsedCgpa, parsedAttendance, parsedIse, parsedMse, parsedEse, parsedFailed, defaulter_flag]);
      recordId = insRes.insertId;
      logger.info(`Created new academic record #${recordId} for Student URN ${student.urn} (Semester ${parsedSemester})`);
    }

    // Update current student semester if this semester is greater
    if (parsedSemester > (student.semester || 1)) {
      await db.query('UPDATE students SET semester = ? WHERE id = ?', [parsedSemester, student.id]);
    }

    // Simultaneously notify assigned mentor
    if (student.mentor_user_id) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [student.mentor_user_id, `Mentee ${student.name} (${student.urn}) updated academic details for Semester ${parsedSemester} (Attendance: ${parsedAttendance}%, CGPA: ${parsedCgpa}).`]
      );
    }

    const updatedRecords = await db.query(
      'SELECT * FROM academic_records WHERE student_id = ? ORDER BY semester DESC',
      [student.id]
    );

    return res.status(200).json({
      success: true,
      message: `Academic details for Semester ${parsedSemester} successfully saved.`,
      recordId,
      records: updatedRecords
    });
  } catch (err) {
    logger.error('Error saving student academic record:', err);
    return res.status(500).json({ success: false, message: 'Server error saving academic details.' });
  }
};

// GET /api/student/activities
const getStudentActivities = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const activities = await db.query('SELECT * FROM activities WHERE student_id = ? ORDER BY date_achieved DESC', [student.id]);
    return res.status(200).json({ success: true, activities });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching activities' });
  }
};

// POST /api/student/activities
const addStudentActivity = async (req, res) => {
  try {
    const { title, category, description, date_achieved, evidence_url } = req.body;
    if (!title || !category || !date_achieved) {
      return res.status(400).json({ success: false, message: 'Activity name, category, and date are required.' });
    }

    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const actRes = await db.query(
      `INSERT INTO activities (student_id, title, category, description, date_achieved, evidence_url, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [student.id, title, category, description || '', date_achieved, evidence_url || 'certificate.pdf']
    );

    // Simultaneously notify assigned mentor
    if (student.mentor_user_id) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [student.mentor_user_id, `Mentee ${student.name} (${student.urn}) submitted a new certificate for verification: "${title}" (${category}).`]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Activity submitted successfully for mentor verification.',
      activityId: actRes.insertId
    });
  } catch (err) {
    logger.error('Error submitting activity:', err);
    return res.status(500).json({ success: false, message: 'Server error submitting activity' });
  }
};

// GET /api/student/meetings
const getStudentMeetings = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student || !student.batch_id) return res.status(200).json({ success: true, upcoming: [], past: [] });

    const meetings = await db.query(`
      SELECT m.*, 
             COALESCE(ma.status, 'Pending') as attendance_status,
             ma.remarks as attendance_remarks
      FROM meetings m
      LEFT JOIN meeting_attendees ma ON ma.meeting_id = m.id AND ma.student_id = ?
      WHERE m.batch_id = ?
      ORDER BY m.meeting_date DESC
    `, [student.id, student.batch_id]);

    const upcoming = meetings.filter(m => m.status === 'Scheduled');
    const past = meetings.filter(m => m.status !== 'Scheduled');

    return res.status(200).json({ success: true, upcoming, past, all: meetings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching meetings' });
  }
};

// GET /api/student/complaints
const getStudentComplaints = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const complaints = await db.query('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    return res.status(200).json({ success: true, complaints });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching complaints' });
  }
};

// POST /api/student/complaints
const submitComplaint = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const complaintRes = await db.query(
      `INSERT INTO complaints (student_id, title, description, category, status) VALUES (?, ?, ?, ?, 'Pending')`,
      [student.id, title, description, category || 'Academic']
    );

    // Simultaneously notify assigned mentor
    if (student.mentor_user_id) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [student.mentor_user_id, `Mentee ${student.name} (${student.urn}) filed a new complaint: "${title}" (${category || 'Academic'}).`]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaintId: complaintRes.insertId
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error submitting complaint' });
  }
};

// GET /api/student/notifications
const getStudentNotifications = async (req, res) => {
  try {
    const notifications = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    return res.status(200).json({ success: true, notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

// GET /api/student/report (MY COMPLETE REPORT GENERATOR)
const getStudentCompleteReport = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const academicRecords = await db.query('SELECT * FROM academic_records WHERE student_id = ? ORDER BY semester DESC', [student.id]);
    const activities = await db.query('SELECT * FROM activities WHERE student_id = ? ORDER BY date_achieved DESC', [student.id]);
    const meetings = student.batch_id ? await db.query('SELECT * FROM meetings WHERE batch_id = ? ORDER BY meeting_date DESC', [student.batch_id]) : [];
    const complaints = await db.query('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [student.id]);

    const report = {
      generatedAt: new Date().toISOString(),
      studentInfo: {
        name: student.name,
        rollNo: student.roll_no,
        urn: student.urn,
        email: student.email,
        phone: student.phone,
        department: student.department,
        division: student.division,
        semester: student.semester,
        batch: student.batch_name || 'Unassigned',
        academicYear: student.academic_year || '2024-2025'
      },
      mentorInfo: {
        name: student.mentor_name || 'Unassigned',
        department: student.mentor_department || 'Computer Engineering',
        email: student.mentor_email || 'N/A',
        phone: student.mentor_phone || 'N/A',
        collegeId: student.mentor_college_id || 'N/A'
      },
      academicPerformance: {
        records: academicRecords,
        overallAttendance: academicRecords[0]?.attendance_percentage || 82.45,
        overallCgpa: academicRecords[0]?.cgpa || 7.50,
        subjectMarks: getStudentSubjectMarks(student, academicRecords[0])
      },
      meetings,
      activities,
      mentorObservations: [
        "Student demonstrates good attendance and consistent mid-term exam performance.",
        "Advised to complete NPTEL credits before 6th semester."
      ],
      complaints,
      overallProgress: academicRecords[0]?.defaulter_flag ? 'Needs Guidance' : 'Good Performance'
    };

    return res.status(200).json({ success: true, report });
  } catch (err) {
    logger.error('Error generating student complete report:', err);
    return res.status(500).json({ success: false, message: 'Server error generating complete report' });
  }
};

// GET /api/student/credentials
// Returns student credentials for their class, division, and batches
const getClassCredentials = async (req, res) => {
  try {
    const currentStudent = await getStudentByUserId(req.user.id);
    if (!currentStudent) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { scope = 'all', batch_id } = req.query; // 'all' (all batches in class/div) or 'batch' (only student's batch)

    let sql = `
      SELECT 
        s.id,
        s.roll_no,
        s.urn,
        s.department,
        s.year,
        s.division,
        s.batch_id,
        u.name,
        u.email,
        u.initial_password,
        b.name as batch_name,
        b.year as batch_year,
        m.id as mentor_id,
        mu.name as mentor_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN mentors m ON b.mentor_id = m.id
      LEFT JOIN users mu ON m.user_id = mu.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by student's year if present
    if (currentStudent.year) {
      sql += ' AND s.year = ?';
      params.push(currentStudent.year);
    }

    // Filter by student's division if present
    if (currentStudent.division) {
      sql += ' AND s.division = ?';
      params.push(currentStudent.division);
    }

    // If batch_id explicitly specified or scope === 'batch'
    if (batch_id && batch_id !== 'ALL') {
      sql += ' AND s.batch_id = ?';
      params.push(parseInt(batch_id));
    } else if (scope === 'batch' && currentStudent.batch_id) {
      sql += ' AND s.batch_id = ?';
      params.push(currentStudent.batch_id);
    }

    sql += ' ORDER BY b.name ASC, s.roll_no ASC';

    const rows = await db.query(sql, params);
    const yearPrefixMap = { 1: 'FY', 2: 'SY', 3: 'TY', 4: 'BTECH' };

    const students = rows.map((r, index) => ({
      sr_no: index + 1,
      id: r.id,
      roll_no: r.roll_no,
      name: r.name,
      urn: r.urn,
      username: r.urn,
      password: r.initial_password || `Pass@${r.urn}`,
      email: r.email,
      department: r.department || 'AI & DS',
      year: r.year,
      year_name: yearPrefixMap[r.year] || 'FY',
      division: r.division,
      batch_id: r.batch_id,
      batch_name: r.batch_name || 'Unassigned',
      mentor_name: r.mentor_name || 'Faculty Mentor'
    }));

    return res.status(200).json({
      success: true,
      department: 'AI & DS',
      current_student: {
        id: currentStudent.id,
        urn: currentStudent.urn,
        year: currentStudent.year,
        year_name: yearPrefixMap[currentStudent.year] || 'FY',
        division: currentStudent.division,
        batch_id: currentStudent.batch_id,
        batch_name: currentStudent.batch_name
      },
      count: students.length,
      students
    });
  } catch (err) {
    logger.error('Error fetching student class credentials:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching class credentials' });
  }
};

module.exports = {
  getStudentDashboard,
  getStudentProfile,
  updateStudentProfile,
  getStudentAcademic,
  addOrUpdateStudentAcademic,
  getStudentActivities,
  addStudentActivity,
  getStudentMeetings,
  getStudentComplaints,
  submitComplaint,
  getStudentNotifications,
  getStudentCompleteReport,
  getClassCredentials
};
