const db = require('../config/db');
const logger = require('../utils/logger');
const excelReportService = require('../services/excelReport.service');

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

// Helper to fetch mentor's assigned batch
const getMentorBatch = async (mentorId) => {
  const batches = await db.query('SELECT * FROM batches WHERE mentor_id = ? LIMIT 1', [mentorId]);
  return batches.length > 0 ? batches[0] : null;
};

// GET /api/mentor/dashboard
const getMentorDashboard = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor profile not found.' });
    }

    const assignedBatch = await getMentorBatch(mentor.id);
    if (!assignedBatch) {
      return res.status(200).json({
        success: true,
        mentor,
        assignedBatch: null,
        totalStudents: 0,
        pendingComplaints: 0,
        resolvedComplaints: 0,
        students: [],
        recentMeetings: [],
        mlRiskSummary: { Bright: 0, Average: 0, Weak: 0, Pending: 0 }
      });
    }

    const students = await db.query(`
      SELECT s.id, s.urn, s.roll_no, s.department, s.division, s.ml_risk_level, u.name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.batch_id = ?
      ORDER BY s.roll_no ASC
    `, [assignedBatch.id]);

    const complaints = await db.query(`
      SELECT c.*, u.name as student_name, s.roll_no
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE s.batch_id = ?
    `, [assignedBatch.id]);

    const pendingComplaints = complaints.filter(c => c.status !== 'Resolved').length;
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;

    const meetings = await db.query(
      'SELECT * FROM meetings WHERE batch_id = ? ORDER BY meeting_date DESC',
      [assignedBatch.id]
    );

    const mlRiskSummary = {
      Bright: students.filter(s => s.ml_risk_level === 'Bright').length,
      Average: students.filter(s => s.ml_risk_level === 'Average').length,
      Weak: students.filter(s => s.ml_risk_level === 'Weak').length,
      Pending: students.filter(s => s.ml_risk_level === 'Pending').length
    };

    return res.status(200).json({
      success: true,
      mentor,
      assignedBatch,
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

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(200).json({ success: true, students: [] });

    const students = await db.query(`
      SELECT s.id, s.urn, s.roll_no, s.department, s.division, s.semester, s.phone, s.ml_risk_level, u.name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.batch_id = ?
      ORDER BY s.roll_no ASC
    `, [batch.id]);

    return res.status(200).json({ success: true, students });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching assigned students.' });
  }
};

// GET /api/mentor/students/:id (Strict Batch Isolation Verification)
const getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(403).json({ success: false, message: 'Forbidden: You have no assigned batch.' });

    const students = await db.query(`
      SELECT s.*, u.name, u.email, b.name as batch_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      WHERE s.id = ? LIMIT 1
    `, [id]);

    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    const student = students[0];

    // Batch Isolation Enforcement
    if (student.batch_id !== batch.id) {
      logger.warn(`Mentor ID ${mentor.id} tried to access student ${student.id} belonging to Batch ${student.batch_id}`);
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are only authorized to view students in your assigned batch.'
      });
    }

    const academicRecords = await db.query('SELECT * FROM academic_records WHERE student_id = ? ORDER BY semester DESC', [student.id]);
    const activities = await db.query('SELECT * FROM activities WHERE student_id = ? ORDER BY date_achieved DESC', [student.id]);
    const complaints = await db.query('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [student.id]);

    return res.status(200).json({
      success: true,
      student,
      academicRecords,
      activities,
      complaints,
      mlDemoResult: {
        risk_level: student.ml_risk_level || 'Average',
        support_priority: student.ml_risk_level === 'Weak' ? 'High' : (student.ml_risk_level === 'Average' ? 'Medium' : 'Low'),
        confidence: 0.94
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching student details.' });
  }
};

// POST /api/mentor/meetings (AUTOMATED COMMON MEETING AGENDA FOR ENTIRE BATCH)
const createMeeting = async (req, res) => {
  try {
    const { meeting_date, mode, agenda, discussion, findings, assignment, remarks } = req.body;
    if (!meeting_date || !agenda) {
      return res.status(400).json({ success: false, message: 'Meeting date and agenda are required.' });
    }

    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor profile not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(400).json({ success: false, message: 'No batch assigned to this mentor.' });

    // Fetch highest meeting number for this batch
    const existing = await db.query('SELECT MAX(meeting_number) as max_num FROM meetings WHERE batch_id = ?', [batch.id]);
    const meeting_number = (existing[0]?.max_num || 0) + 1;

    const result = await db.query(`
      INSERT INTO meetings (batch_id, mentor_id, meeting_number, meeting_date, mode, agenda, discussion, findings, assignment, remarks, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled')
    `, [batch.id, mentor.id, meeting_number, meeting_date, mode || 'Offline / Seminar Hall', agenda, discussion || '', findings || '', assignment || '', remarks || '']);

    logger.info(`Common meeting agenda #${meeting_number} created for Batch ${batch.name}`);

    return res.status(201).json({
      success: true,
      message: `Meeting agenda successfully added for Batch ${batch.name} (${batch.id}). Associated with all mentees.`,
      meetingId: result.insertId
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

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(200).json({ success: true, meetings: [] });

    const meetings = await db.query('SELECT * FROM meetings WHERE batch_id = ? ORDER BY meeting_date DESC', [batch.id]);
    return res.status(200).json({ success: true, meetings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching meetings.' });
  }
};

// GET /api/mentor/complaints
const getComplaints = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(200).json({ success: true, complaints: [] });

    const complaints = await db.query(`
      SELECT c.*, u.name as student_name, s.roll_no, s.urn
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE s.batch_id = ?
      ORDER BY c.created_at DESC
    `, [batch.id]);

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
    const batch = await getMentorBatch(mentor.id);

    // Verify complaint belongs to mentor's batch
    const complaints = await db.query(`
      SELECT c.*, s.batch_id FROM complaints c
      JOIN students s ON c.student_id = s.id
      WHERE c.id = ? LIMIT 1
    `, [id]);

    if (complaints.length === 0) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (complaints[0].batch_id !== batch.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot update complaints from another batch.' });
    }

    await db.query(
      'UPDATE complaints SET status = ?, mentor_response = ? WHERE id = ?',
      [status, mentor_response || '', id]
    );

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
    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(400).json({ success: false, message: 'No batch assigned.' });

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
    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(400).json({ success: false, message: 'No batch assigned.' });

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
    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(400).json({ success: false, message: 'No batch assigned.' });

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
    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(400).json({ success: false, message: 'No batch assigned.' });

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

module.exports = {
  getMentorDashboard,
  getAssignedStudents,
  getStudentDetail,
  createMeeting,
  getMeetings,
  getComplaints,
  updateComplaintStatus,
  downloadReport1,
  downloadReport2,
  downloadReport3,
  downloadReport4
};
