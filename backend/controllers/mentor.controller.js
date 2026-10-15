const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const logger = require('../utils/logger');
const excelReportService = require('../services/excelReport.service');

// Cache for real ML predictions from best_model pipeline
let mlPredictionsCache = null;
const getStudentMlPrediction = (studentId) => {
  try {
    if (!mlPredictionsCache) {
      const predFile = path.join(__dirname, '../../ml_outputs/student_risk_predictions.json');
      if (fs.existsSync(predFile)) {
        const raw = JSON.parse(fs.readFileSync(predFile, 'utf8'));
        mlPredictionsCache = raw.predictions_by_id || raw.predictions || {};
      }
    }
    return mlPredictionsCache ? mlPredictionsCache[String(studentId)] : null;
  } catch (err) {
    logger.error('Error reading ML predictions file:', err);
    return null;
  }
};

// Helper to fetch mentor record
const getMentorByUserId = async (userId) => {
  const mentors = await db.query(`
    SELECT m.id, m.user_id, m.mentor_code, m.department, m.designation, m.phone, u.name, u.email
    FROM mentors m
    JOIN users u ON m.user_id = u.id
    WHERE m.user_id = ? LIMIT 1
  `, [userId]);
  return mentors.length > 0 ? mentors[0] : null;
};

// Helper to fetch all mentor's assigned batches
const getMentorBatches = async (mentorId) => {
  return await db.query('SELECT * FROM batches WHERE mentor_id = ? ORDER BY year ASC, division ASC, name ASC', [mentorId]);
};

// Helper to fetch mentor's primary assigned batch
const getMentorBatch = async (mentorId) => {
  const batches = await getMentorBatches(mentorId);
  return batches.length > 0 ? batches[0] : null;
};

// GET /api/mentor/dashboard
const getMentorDashboard = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor profile not found.' });
    }

    const assignedBatches = await getMentorBatches(mentor.id);
    if (!assignedBatches || assignedBatches.length === 0) {
      return res.status(200).json({
        success: true,
        mentor,
        assignedBatch: null,
        assignedBatches: [],
        totalStudents: 0,
        pendingComplaints: 0,
        resolvedComplaints: 0,
        students: [],
        recentMeetings: [],
        mlRiskSummary: { Bright: 0, Average: 0, Weak: 0, Pending: 0 }
      });
    }

    // Support optional filtering by batch_id
    const filterBatchId = req.query.batch_id ? parseInt(req.query.batch_id) : null;
    const targetBatches = filterBatchId 
      ? assignedBatches.filter(b => b.id === filterBatchId)
      : assignedBatches;

    const batchIds = targetBatches.map(b => b.id);
    const placeholders = batchIds.map(() => '?').join(',');

    const students = await db.query(`
      SELECT s.id, s.urn, s.roll_no, s.department, s.year, s.division, s.batch_id, s.ml_risk_level, u.name, u.email, b.name as batch_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN batches b ON s.batch_id = b.id
      WHERE s.batch_id IN (${placeholders})
      ORDER BY s.year ASC, s.division ASC, s.roll_no ASC
    `, batchIds);

    const complaints = await db.query(`
      SELECT c.*, u.name as student_name, s.roll_no
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE s.batch_id IN (${placeholders})
    `, batchIds);

    const pendingComplaints = complaints.filter(c => c.status !== 'Resolved').length;
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;

    const meetings = await db.query(
      `SELECT * FROM meetings WHERE batch_id IN (${placeholders}) ORDER BY meeting_date DESC`,
      batchIds
    );

    const mlRiskSummary = {
      Bright: students.filter(s => s.ml_risk_level === 'Bright').length,
      Average: students.filter(s => s.ml_risk_level === 'Average').length,
      Weak: students.filter(s => s.ml_risk_level === 'Weak').length,
      Pending: students.filter(s => !s.ml_risk_level || s.ml_risk_level === 'Pending').length
    };

    const combinedBatchName = assignedBatches.map(b => b.name).join(', ');
    const assignedBatch = targetBatches.length === 1 
      ? targetBatches[0] 
      : { id: 'ALL', name: combinedBatchName };

    return res.status(200).json({
      success: true,
      mentor,
      assignedBatch,
      assignedBatches,
      totalStudents: students.length,
      pendingComplaints,
      resolvedComplaints,
      students,
      recentMeetings: meetings,
      mlRiskSummary
    });
  } catch (err) {
    logger.error('Error in getMentorDashboard:', err);
    return res.status(500).json({ success: false, message: 'Server error loading mentor dashboard.' });
  }
};

// GET /api/mentor/students
const getAssignedStudents = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor profile not found.' });

    const assignedBatches = await getMentorBatches(mentor.id);
    if (!assignedBatches || assignedBatches.length === 0) return res.status(200).json({ success: true, students: [] });

    const filterBatchId = req.query.batch_id ? parseInt(req.query.batch_id) : null;
    const targetBatches = filterBatchId 
      ? assignedBatches.filter(b => b.id === filterBatchId)
      : assignedBatches;

    const batchIds = targetBatches.map(b => b.id);
    const placeholders = batchIds.map(() => '?').join(',');

    const students = await db.query(`
      SELECT s.id, s.urn, s.roll_no, s.department, s.year, s.division, s.semester, s.phone, s.batch_id, s.ml_risk_level, u.name, u.email, b.name as batch_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN batches b ON s.batch_id = b.id
      WHERE s.batch_id IN (${placeholders})
      ORDER BY s.year ASC, s.division ASC, s.roll_no ASC
    `, batchIds);

    return res.status(200).json({ success: true, students });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching assigned students.' });
  }
};

const { getSemesterSubjectEvaluation } = require('../services/academicEvaluation.service');

// GET /api/mentor/students/:id (Strict Batch Isolation Verification across assigned batches)
const getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const assignedBatches = await getMentorBatches(mentor.id);
    const mentorBatchIds = assignedBatches.map(b => b.id);
    if (mentorBatchIds.length === 0) return res.status(403).json({ success: false, message: 'Forbidden: You have no assigned batches.' });

    const students = await db.query(`
      SELECT s.*, u.name, u.email, b.name as batch_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      WHERE s.id = ? LIMIT 1
    `, [id]);

    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    const student = students[0];

    // Batch Isolation Enforcement: student must belong to one of mentor's assigned batches
    if (!mentorBatchIds.includes(student.batch_id)) {
      logger.warn(`Mentor ID ${mentor.id} tried to access student ${student.id} belonging to Batch ${student.batch_id}`);
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are only authorized to view students in your assigned batches.'
      });
    }

    const academicRecords = await db.query('SELECT * FROM academic_records WHERE student_id = ? ORDER BY semester DESC', [student.id]);
    const activities = await db.query('SELECT * FROM activities WHERE student_id = ? ORDER BY date_achieved DESC', [student.id]);
    const complaints = await db.query('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [student.id]);

    // Build Semester-Wise Analysis & Subject Breakdown for all semesters
    const currentSem = student.semester || (academicRecords[0] ? academicRecords[0].semester : 5);
    const semesterAnalysis = {};
    
    // For each record, generate subject-level marks and attendance breakdown
    for (const ar of academicRecords) {
      semesterAnalysis[ar.semester] = {
        semester: ar.semester,
        cgpa: ar.cgpa,
        attendance_percentage: ar.attendance_percentage,
        subjects_failed_count: ar.subjects_failed_count,
        defaulter_flag: ar.defaulter_flag,
        subjects: getSemesterSubjectEvaluation(student, ar, ar.semester)
      };
    }

    if (!semesterAnalysis[currentSem]) {
      const fallbackRecord = academicRecords[0] || { attendance_percentage: 85.0, cgpa: 8.5 };
      semesterAnalysis[currentSem] = {
        semester: currentSem,
        cgpa: fallbackRecord.cgpa || 8.0,
        attendance_percentage: fallbackRecord.attendance_percentage || 85.0,
        subjects_failed_count: 0,
        defaulter_flag: 0,
        subjects: getSemesterSubjectEvaluation(student, fallbackRecord, currentSem)
      };
    }

    // Pull real ML prediction from pipeline output
    const mlPred = getStudentMlPrediction(student.id);
    const mlDemoResult = mlPred ? {
      risk_level: mlPred.predicted_risk_level,
      support_priority: mlPred.predicted_risk_level === 'Weak' ? 'High' : (mlPred.predicted_risk_level === 'Average' ? 'Medium' : 'Low'),
      confidence: mlPred.confidence,
      probabilities: mlPred.probabilities,
      features: mlPred.features
    } : {
      risk_level: student.ml_risk_level || 'Average',
      support_priority: student.ml_risk_level === 'Weak' ? 'High' : (student.ml_risk_level === 'Average' ? 'Medium' : 'Low'),
      confidence: 0.85
    };

    return res.status(200).json({
      success: true,
      student,
      currentSemester: currentSem,
      academicRecords,
      semesterAnalysis,
      activities,
      complaints,
      mlDemoResult
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching student details.' });
  }
};

// POST /api/mentor/students/:id/academic (Mentor Adds / Updates Student Attendance & Marks)
const updateStudentAcademicRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const assignedBatches = await getMentorBatches(mentor.id);
    const mentorBatchIds = assignedBatches.map(b => b.id);

    const students = await db.query('SELECT * FROM students WHERE id = ? LIMIT 1', [id]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    const student = students[0];

    if (!mentorBatchIds.includes(student.batch_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify records for students outside your assigned batch.' });
    }

    let { semester, attendance_percentage, cgpa, ise_marks, mse_marks, ese_marks, subjects_failed_count, remarks } = req.body;

    const parsedSem = parseInt(semester);
    if (isNaN(parsedSem) || parsedSem < 1 || parsedSem > 8) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8.' });
    }

    const parsedAtt = parseFloat(attendance_percentage);
    if (isNaN(parsedAtt) || parsedAtt < 0 || parsedAtt > 100) {
      return res.status(400).json({ success: false, message: 'Attendance percentage must be between 0 and 100.' });
    }

    const parsedCgpa = parseFloat(cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      return res.status(400).json({ success: false, message: 'CGPA must be between 0.00 and 10.00.' });
    }

    const parsedIse = ise_marks !== undefined && ise_marks !== '' ? parseFloat(ise_marks) : 20.0;
    const parsedMse = mse_marks !== undefined && mse_marks !== '' ? parseFloat(mse_marks) : 25.0;
    const parsedEse = ese_marks !== undefined && ese_marks !== '' ? parseFloat(ese_marks) : 60.0;
    const parsedFailed = subjects_failed_count !== undefined && subjects_failed_count !== '' ? parseInt(subjects_failed_count) : 0;
    const defaulter_flag = (parsedAtt < 75 || parsedFailed > 0) ? 1 : 0;

    // Check if record exists
    const existing = await db.query(
      'SELECT id FROM academic_records WHERE student_id = ? AND semester = ? LIMIT 1',
      [student.id, parsedSem]
    );

    if (existing.length > 0) {
      await db.query(`
        UPDATE academic_records
        SET attendance_percentage = ?, cgpa = ?, ise_marks = ?, mse_marks = ?, ese_marks = ?, subjects_failed_count = ?, defaulter_flag = ?
        WHERE id = ?
      `, [parsedAtt, parsedCgpa, parsedIse, parsedMse, parsedEse, parsedFailed, defaulter_flag, existing[0].id]);
    } else {
      await db.query(`
        INSERT INTO academic_records (student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [student.id, parsedSem, parsedCgpa, parsedAtt, parsedIse, parsedMse, parsedEse, parsedFailed, defaulter_flag]);
    }

    // Update student ml_risk_level dynamically if this is the current semester
    if (parsedSem >= (student.semester || 1)) {
      let newRisk = student.ml_risk_level;
      if (parsedAtt < 75 || defaulter_flag === 1) {
        newRisk = 'Weak';
      } else if (parsedAtt >= 90 && parsedCgpa >= 8.5) {
        newRisk = 'Bright';
      } else {
        newRisk = 'Average';
      }
      await db.query('UPDATE students SET ml_risk_level = ? WHERE id = ?', [newRisk, student.id]);
    }

    // Notify mentee
    const stUser = await db.query('SELECT user_id FROM students WHERE id = ? LIMIT 1', [student.id]);
    if (stUser.length > 0) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [stUser[0].user_id, `Faculty Mentor ${mentor.name} updated your academic & attendance record for Semester ${parsedSem} (Attendance: ${parsedAtt}%, CGPA: ${parsedCgpa}).${remarks ? ' Remarks: ' + remarks : ''}`]
      );
    }

    logger.info(`Mentor ${mentor.name} updated academic details for Student ID ${student.id} (Semester ${parsedSem})`);
    return res.status(200).json({
      success: true,
      message: `Academic & attendance details for Semester ${parsedSem} saved successfully.`
    });
  } catch (err) {
    logger.error('Error updating student academic record by mentor:', err);
    return res.status(500).json({ success: false, message: 'Server error updating student academic record.' });
  }
};

// POST /api/mentor/meetings (AUTOMATED COMMON MEETING AGENDA FOR ENTIRE BATCH)
// POST /api/mentor/meetings (AUTOMATED COMMON MEETING AGENDA FOR ENTIRE BATCH)
const createMeeting = async (req, res) => {
  try {
    const { batch_id, meeting_date, mode, agenda, discussion, findings, assignment, remarks } = req.body;
    if (!meeting_date || !agenda) {
      return res.status(400).json({ success: false, message: 'Meeting date and agenda are required.' });
    }

    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor profile not found.' });

    const assignedBatches = await getMentorBatches(mentor.id);
    if (!assignedBatches || assignedBatches.length === 0) {
      return res.status(400).json({ success: false, message: 'No batch assigned to this mentor.' });
    }

    const targetBatchId = batch_id ? parseInt(batch_id) : assignedBatches[0].id;
    const targetBatch = assignedBatches.find(b => b.id === targetBatchId) || assignedBatches[0];

    // Fetch highest meeting number for this batch
    const existing = await db.query('SELECT MAX(meeting_number) as max_num FROM meetings WHERE batch_id = ?', [targetBatch.id]);
    const meeting_number = (existing[0]?.max_num || 0) + 1;

    const result = await db.query(`
      INSERT INTO meetings (batch_id, mentor_id, meeting_number, meeting_date, mode, agenda, discussion, findings, assignment, remarks, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled')
    `, [targetBatch.id, mentor.id, meeting_number, meeting_date, mode || 'Offline / Seminar Hall', agenda, discussion || '', findings || '', assignment || '', remarks || '']);

    const meetingId = result.insertId;
    logger.info(`Common meeting agenda #${meeting_number} created for Batch ${targetBatch.name}`);

    // Simultaneously notify all mentees in the batch & seed initial meeting attendees
    const mentees = await db.query(
      'SELECT s.id, s.user_id, s.urn, u.name FROM students s JOIN users u ON s.user_id = u.id WHERE s.batch_id = ?',
      [targetBatch.id]
    );

    const formattedDate = new Date(meeting_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    for (const mentee of mentees) {
      // Seed default attendee
      await db.query(
        'INSERT OR IGNORE INTO meeting_attendees (meeting_id, student_id, status, remarks) VALUES (?, ?, ?, ?)',
        [meetingId, mentee.id, 'Present', 'Scheduled meeting']
      );
      // Create student notification
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [mentee.user_id, `New Mentoring Meeting #${meeting_number} scheduled on ${formattedDate} (${mode || 'Offline'}): "${agenda}"`]
      );
    }

    // Notify admins
    const admins = await db.query("SELECT id FROM users WHERE role = 'ADMIN'");
    for (const adm of admins) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [adm.id, `Mentor ${mentor.name} scheduled Meeting #${meeting_number} for Batch ${targetBatch.name}. Agenda: "${agenda}"`]
      );
    }

    return res.status(201).json({
      success: true,
      message: `Meeting agenda successfully added for Batch ${targetBatch.name} (${targetBatch.id}). Notified ${mentees.length} mentees.`,
      meetingId
    });
  } catch (err) {
    logger.error('Error creating meeting:', err);
    return res.status(500).json({ success: false, message: 'Server error creating meeting agenda.' });
  }
};

// GET /api/mentor/meetings
const getMeetings = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const assignedBatches = await getMentorBatches(mentor.id);
    if (!assignedBatches || assignedBatches.length === 0) return res.status(200).json({ success: true, meetings: [] });

    const filterBatchId = req.query.batch_id ? parseInt(req.query.batch_id) : null;
    const targetBatches = filterBatchId 
      ? assignedBatches.filter(b => b.id === filterBatchId)
      : assignedBatches;

    const batchIds = targetBatches.map(b => b.id);
    const placeholders = batchIds.map(() => '?').join(',');

    const meetings = await db.query(`
      SELECT m.*, b.name as batch_name,
        (SELECT COUNT(*) FROM meeting_attendees WHERE meeting_id = m.id AND status = 'Present') as present_count,
        (SELECT COUNT(*) FROM meeting_attendees WHERE meeting_id = m.id AND status = 'Absent') as absent_count,
        (SELECT COUNT(*) FROM students WHERE batch_id = m.batch_id) as total_batch_students
      FROM meetings m
      JOIN batches b ON m.batch_id = b.id
      WHERE m.batch_id IN (${placeholders})
      ORDER BY m.meeting_date DESC
    `, batchIds);

    return res.status(200).json({ success: true, meetings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching meetings.' });
  }
};

// GET /api/mentor/meetings/:id/attendance
const getMeetingAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const assignedBatches = await getMentorBatches(mentor.id);
    const mentorBatchIds = assignedBatches.map(b => b.id);

    const meetings = await db.query('SELECT * FROM meetings WHERE id = ? LIMIT 1', [id]);
    if (meetings.length === 0) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    const meeting = meetings[0];

    if (!mentorBatchIds.includes(meeting.batch_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Meeting belongs to another batch.' });
    }

    const attendees = await db.query(`
      SELECT s.id as student_id, s.roll_no, s.urn, u.name as student_name,
             COALESCE(ma.status, 'Present') as status,
             COALESCE(ma.remarks, '') as remarks
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN meeting_attendees ma ON ma.meeting_id = ? AND ma.student_id = s.id
      WHERE s.batch_id = ?
      ORDER BY s.roll_no ASC
    `, [meeting.id, meeting.batch_id]);

    return res.status(200).json({ success: true, meeting, attendees });
  } catch (err) {
    logger.error('Error fetching meeting attendance:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching meeting attendance.' });
  }
};

// POST /api/mentor/meetings/:id/attendance
const saveMeetingAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendees, remarks, meeting_status } = req.body;

    if (!Array.isArray(attendees)) {
      return res.status(400).json({ success: false, message: 'Attendees array is required.' });
    }

    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const assignedBatches = await getMentorBatches(mentor.id);
    const mentorBatchIds = assignedBatches.map(b => b.id);

    const meetings = await db.query('SELECT * FROM meetings WHERE id = ? LIMIT 1', [id]);
    if (meetings.length === 0) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    const meeting = meetings[0];

    if (!mentorBatchIds.includes(meeting.batch_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Meeting belongs to another batch.' });
    }

    // Upsert attendees
    for (const att of attendees) {
      const status = att.status === 'Absent' ? 'Absent' : 'Present';
      const attRemarks = att.remarks || '';

      const existing = await db.query(
        'SELECT id FROM meeting_attendees WHERE meeting_id = ? AND student_id = ? LIMIT 1',
        [meeting.id, att.student_id]
      );

      if (existing.length > 0) {
        await db.query(
          'UPDATE meeting_attendees SET status = ?, remarks = ? WHERE id = ?',
          [status, attRemarks, existing[0].id]
        );
      } else {
        await db.query(
          'INSERT INTO meeting_attendees (meeting_id, student_id, status, remarks) VALUES (?, ?, ?, ?)',
          [meeting.id, att.student_id, status, attRemarks]
        );
      }

      // Notify each student
      const stUser = await db.query('SELECT user_id FROM students WHERE id = ? LIMIT 1', [att.student_id]);
      if (stUser.length > 0) {
        await db.query(
          'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
          [stUser[0].user_id, `Attendance marked for Meeting #${meeting.meeting_number} ("${meeting.agenda}"): You were marked as ${status}.${attRemarks ? ' Remarks: ' + attRemarks : ''}`]
        );
      }
    }

    // Update meeting status
    await db.query(
      'UPDATE meetings SET status = ?, remarks = COALESCE(?, remarks) WHERE id = ?',
      [meeting_status || 'Completed', remarks || null, meeting.id]
    );

    logger.info(`Attendance saved for Meeting #${meeting.id} by Mentor ${mentor.name}`);
    return res.status(200).json({ success: true, message: 'Meeting attendance saved successfully and students notified.' });
  } catch (err) {
    logger.error('Error saving meeting attendance:', err);
    return res.status(500).json({ success: false, message: 'Server error saving meeting attendance.' });
  }
};

// GET /api/mentor/activities (BATCH CERTIFICATES / ACHIEVEMENTS VERIFICATION LIST)
const getBatchActivities = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const assignedBatches = await getMentorBatches(mentor.id);
    if (!assignedBatches || assignedBatches.length === 0) {
      return res.status(200).json({ success: true, activities: [] });
    }

    const filterBatchId = req.query.batch_id ? parseInt(req.query.batch_id) : null;
    const targetBatches = filterBatchId 
      ? assignedBatches.filter(b => b.id === filterBatchId)
      : assignedBatches;

    const batchIds = targetBatches.map(b => b.id);
    const placeholders = batchIds.map(() => '?').join(',');

    const activities = await db.query(`
      SELECT a.*, s.id as student_id, s.roll_no, s.urn, u.name as student_name, b.name as batch_name
      FROM activities a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN batches b ON s.batch_id = b.id
      WHERE s.batch_id IN (${placeholders})
      ORDER BY 
        CASE WHEN a.status = 'Pending' THEN 1 ELSE 2 END,
        a.date_achieved DESC,
        a.id DESC
    `, batchIds);

    return res.status(200).json({ success: true, activities });
  } catch (err) {
    logger.error('Error fetching batch activities:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching activities.' });
  }
};

// PUT /api/mentor/activities/:id/status (STATUS UPDATION & CERTIFICATE VERIFICATION)
const updateActivityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, mentor_remarks } = req.body;

    if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status (Approved, Rejected, Pending) is required.' });
    }

    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const assignedBatches = await getMentorBatches(mentor.id);
    const mentorBatchIds = assignedBatches.map(b => b.id);

    // Verify activity belongs to student in mentor's assigned batches
    const acts = await db.query(`
      SELECT a.*, s.batch_id, s.user_id as student_user_id, u.name as student_name
      FROM activities a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE a.id = ? LIMIT 1
    `, [id]);

    if (acts.length === 0) return res.status(404).json({ success: false, message: 'Activity not found.' });
    const act = acts[0];

    if (!mentorBatchIds.includes(act.batch_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot verify certificates from another batch.' });
    }

    await db.query(
      'UPDATE activities SET status = ?, mentor_remarks = ? WHERE id = ?',
      [status, mentor_remarks || '', id]
    );

    // Notify the student
    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [act.student_user_id, `Your certificate / activity "${act.title}" (${act.category}) was ${status} by Faculty Mentor ${mentor.name}.${mentor_remarks ? ' Remarks: ' + mentor_remarks : ''}`]
    );

    logger.info(`Activity #${id} status updated to ${status} by Mentor ${mentor.name}`);
    return res.status(200).json({ success: true, message: `Certificate/Activity status updated to ${status} and student notified.` });
  } catch (err) {
    logger.error('Error updating activity status:', err);
    return res.status(500).json({ success: false, message: 'Server error updating activity status.' });
  }
};

// GET /api/mentor/complaints
const getComplaints = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const assignedBatches = await getMentorBatches(mentor.id);
    if (!assignedBatches || assignedBatches.length === 0) return res.status(200).json({ success: true, complaints: [] });

    const filterBatchId = req.query.batch_id ? parseInt(req.query.batch_id) : null;
    const targetBatches = filterBatchId 
      ? assignedBatches.filter(b => b.id === filterBatchId)
      : assignedBatches;

    const batchIds = targetBatches.map(b => b.id);
    const placeholders = batchIds.map(() => '?').join(',');

    const complaints = await db.query(`
      SELECT c.*, u.name as student_name, s.roll_no, s.urn
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE s.batch_id IN (${placeholders})
      ORDER BY c.created_at DESC
    `, batchIds);

    return res.status(200).json({ success: true, complaints });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching complaints.' });
  }
};

// PUT /api/mentor/complaints/:id/status
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, mentor_response } = req.body;

    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });

    const mentor = await getMentorByUserId(req.user.id);
    const assignedBatches = await getMentorBatches(mentor.id);
    const mentorBatchIds = assignedBatches.map(b => b.id);

    // Verify complaint belongs to mentor's assigned batches
    const complaints = await db.query(`
      SELECT c.*, s.batch_id, s.user_id as student_user_id FROM complaints c
      JOIN students s ON c.student_id = s.id
      WHERE c.id = ? LIMIT 1
    `, [id]);

    if (complaints.length === 0) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (!mentorBatchIds.includes(complaints[0].batch_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot update complaints from another batch.' });
    }

    await db.query(
      'UPDATE complaints SET status = ?, mentor_response = ? WHERE id = ?',
      [status, mentor_response || '', id]
    );

    // Simultaneously notify the mentee
    if (complaints[0].student_user_id) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [complaints[0].student_user_id, `Faculty Mentor ${mentor.name} updated your complaint "${complaints[0].title}" to ${status}.${mentor_response ? ' Remarks: ' + mentor_response : ''}`]
      );
    }

    logger.info(`Complaint #${id} updated to ${status} by Mentor ${mentor.name}`);
    return res.status(200).json({ success: true, message: 'Complaint status and remarks updated successfully.' });
  } catch (err) {
    logger.error('Error updating complaint status:', err);
    return res.status(500).json({ success: false, message: 'Server error updating complaint.' });
  }
};

// GENERATE REPORT 1
const downloadReport1 = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    const assignedBatches = await getMentorBatches(mentor.id);
    if (!assignedBatches || assignedBatches.length === 0) return res.status(400).json({ success: false, message: 'No batch assigned.' });
    
    const targetBatchId = req.query.batch_id ? parseInt(req.query.batch_id) : assignedBatches[0].id;
    const batch = assignedBatches.find(b => b.id === targetBatchId) || assignedBatches[0];

    const workbook = await excelReportService.generateReport1(batch.id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${batch.name}_Mentoring_Report_1_2026.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error('Error generating Report 1:', err);
    res.status(500).send('Error generating Excel report.');
  }
};

// GENERATE REPORT 2
const downloadReport2 = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    const assignedBatches = await getMentorBatches(mentor.id);
    if (!assignedBatches || assignedBatches.length === 0) return res.status(400).json({ success: false, message: 'No batch assigned.' });
    
    const targetBatchId = req.query.batch_id ? parseInt(req.query.batch_id) : assignedBatches[0].id;
    const batch = assignedBatches.find(b => b.id === targetBatchId) || assignedBatches[0];

    const workbook = await excelReportService.generateReport2(batch.id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${batch.name}_Academic_Progress_Report_2_2026.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error('Error generating Report 2:', err);
    res.status(500).send('Error generating Excel report.');
  }
};

// GENERATE REPORT 3
const downloadReport3 = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    const assignedBatches = await getMentorBatches(mentor.id);
    if (!assignedBatches || assignedBatches.length === 0) return res.status(400).json({ success: false, message: 'No batch assigned.' });
    
    const targetBatchId = req.query.batch_id ? parseInt(req.query.batch_id) : assignedBatches[0].id;
    const batch = assignedBatches.find(b => b.id === targetBatchId) || assignedBatches[0];

    const workbook = await excelReportService.generateReport3(batch.id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${batch.name}_Student_Progress_Report_3_2026.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error('Error generating Report 3:', err);
    res.status(500).send('Error generating Excel report.');
  }
};

// GENERATE REPORT 4
const downloadReport4 = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    const assignedBatches = await getMentorBatches(mentor.id);
    if (!assignedBatches || assignedBatches.length === 0) return res.status(400).json({ success: false, message: 'No batch assigned.' });
    
    const targetBatchId = req.query.batch_id ? parseInt(req.query.batch_id) : assignedBatches[0].id;
    const batch = assignedBatches.find(b => b.id === targetBatchId) || assignedBatches[0];

    const workbook = await excelReportService.generateReport4(batch.id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${batch.name}_Mentee_Analysis_Report_4_2026.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error('Error generating Report 4:', err);
    res.status(500).send('Error generating Excel report.');
  }
};

const getMenteeCredentials = async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    if (!mentorId) {
      return res.status(403).json({ success: false, message: 'Mentor profile not found.' });
    }

    const { batch_id } = req.query;
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
        u.initial_password,
        b.name as batch_name,
        mu.name as mentor_name
      FROM batches b
      JOIN students s ON s.batch_id = b.id
      JOIN users u ON s.user_id = u.id
      JOIN mentors m ON b.mentor_id = m.id
      JOIN users mu ON m.user_id = mu.id
      WHERE b.mentor_id = ?
    `;
    const params = [mentorId];
    if (batch_id && batch_id !== 'ALL') {
      sql += ' AND b.id = ?';
      params.push(parseInt(batch_id));
    }
    sql += ' ORDER BY b.name ASC, s.roll_no ASC';

    const rows = await db.query(sql, params);
    const yearPrefixMap = { 1: 'FY', 2: 'SY', 3: 'TY', 4: 'BTECH' };
    const mentees = rows.map((r, index) => ({
      sr_no: index + 1,
      id: r.id,
      roll_no: r.roll_no,
      name: r.name,
      urn: r.urn,
      username: r.urn,
      password: r.initial_password || `Pass@${r.urn}`,
      email: r.email,
      department: r.department,
      year: r.year,
      year_name: yearPrefixMap[r.year] || 'FY',
      division: r.division,
      batch_id: r.batch_id,
      batch_name: r.batch_name,
      mentor_name: r.mentor_name
    }));

    return res.status(200).json({
      success: true,
      department: 'AI & DS',
      count: mentees.length,
      mentees
    });
  } catch (err) {
    logger.error('Error fetching mentee credentials:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching mentee credentials' });
  }
};

// GET /api/mentor/students/:id/report (Comprehensive Mentee Report for Faculty Mentor)
const getMentorStudentReport = async (req, res) => {
  try {
    const { id } = req.params;
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor profile not found.' });

    const assignedBatches = await getMentorBatches(mentor.id);
    const mentorBatchIds = assignedBatches.map(b => b.id);
    if (mentorBatchIds.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: You have no assigned batches.' });
    }

    const students = await db.query(`
      SELECT s.*, u.name, u.email, b.name as batch_name, b.academic_year
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      WHERE s.id = ? LIMIT 1
    `, [id]);

    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    const student = students[0];

    // Batch Isolation Enforcement
    if (!mentorBatchIds.includes(student.batch_id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are only authorized to generate reports for students in your assigned batch.'
      });
    }

    const academicRecords = await db.query(
      'SELECT * FROM academic_records WHERE student_id = ? ORDER BY semester ASC',
      [student.id]
    );

    const activities = await db.query(
      'SELECT * FROM activities WHERE student_id = ? ORDER BY date_achieved DESC',
      [student.id]
    );

    const complaints = await db.query(
      'SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC',
      [student.id]
    );

    const meetings = student.batch_id ? await db.query(
      'SELECT * FROM meetings WHERE batch_id = ? ORDER BY meeting_date DESC',
      [student.batch_id]
    ) : [];

    const mlPred = getStudentMlPrediction(student.id);
    const mlAnalysis = mlPred ? {
      risk_level: mlPred.predicted_risk_level,
      support_priority: mlPred.predicted_risk_level === 'Weak' ? 'High' : (mlPred.predicted_risk_level === 'Average' ? 'Medium' : 'Low'),
      confidence: mlPred.confidence,
      probabilities: mlPred.probabilities,
      features: mlPred.features
    } : {
      risk_level: student.ml_risk_level || 'Average',
      support_priority: student.ml_risk_level === 'Weak' ? 'High' : (student.ml_risk_level === 'Average' ? 'Medium' : 'Low'),
      confidence: 0.88
    };

    const latestAcademic = academicRecords.length > 0 ? academicRecords[academicRecords.length - 1] : null;

    const report = {
      generatedAt: new Date().toISOString(),
      student: {
        id: student.id,
        name: student.name,
        urn: student.urn,
        rollNo: student.roll_no,
        email: student.email,
        phone: student.phone,
        department: student.department || 'AI & DS',
        year: student.year,
        division: student.division,
        semester: student.semester,
        batchName: student.batch_name || 'Assigned Batch',
        academicYear: student.academic_year || '2024-2025'
      },
      mentor: {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        phone: mentor.phone,
        mentorCode: mentor.mentor_code,
        designation: mentor.designation,
        department: mentor.department
      },
      academicRecords,
      latestAcademic,
      activities,
      meetings,
      complaints,
      mlAnalysis,
      overallProgress: latestAcademic?.defaulter_flag ? 'Needs Guidance' : 'Good Academic Standing'
    };

    logger.info(`Mentor ${mentor.name} generated comprehensive report for Student ${student.name} (${student.urn})`);
    return res.status(200).json({ success: true, report });
  } catch (err) {
    logger.error('Error generating mentor student report:', err);
    return res.status(500).json({ success: false, message: 'Server error generating student report' });
  }
};

module.exports = {
  getMentorDashboard,
  getAssignedStudents,
  getStudentDetail,
  updateStudentAcademicRecord,
  getMentorStudentReport,
  createMeeting,
  getMeetings,
  getMeetingAttendance,
  saveMeetingAttendance,
  getBatchActivities,
  updateActivityStatus,
  getComplaints,
  updateComplaintStatus,
  downloadReport1,
  downloadReport2,
  downloadReport3,
  downloadReport4,
  getMenteeCredentials
};

