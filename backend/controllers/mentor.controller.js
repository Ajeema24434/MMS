const db = require('../config/db');
const logger = require('../utils/logger');
const excelReportService = require('../services/excelReport.service');

// Helper to fetch authenticated mentor record
const getMentorByUserId = async (userId) => {
  const mentors = await db.query(`
    SELECT m.id, m.user_id, m.mentor_code, m.department, m.designation, m.phone, u.name, u.email
    FROM mentors m
    JOIN users u ON m.user_id = u.id
    WHERE m.user_id = ? LIMIT 1
  `, [userId]);
  return mentors.length > 0 ? mentors[0] : null;
};

// Helper to fetch mentor's assigned batch (strict isolation source of truth)
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

    // Fetch meetings with attendance summary
    const meetings = await db.query(`
      SELECT m.*,
             (SELECT COUNT(*) FROM attendance a WHERE a.meeting_id = m.id AND a.status = 'Present') as present_count,
             (SELECT COUNT(*) FROM attendance a WHERE a.meeting_id = m.id AND a.status = 'Absent') as absent_count,
             (SELECT COUNT(*) FROM attendance a WHERE a.meeting_id = m.id) as attendance_marked_count
      FROM meetings m
      WHERE m.batch_id = ?
      ORDER BY m.meeting_date DESC
    `, [assignedBatch.id]);

    const mlRiskSummary = {
      Bright: students.filter(s => s.ml_risk_level === 'Bright').length,
      Average: students.filter(s => s.ml_risk_level === 'Average').length,
      Weak: students.filter(s => s.ml_risk_level === 'Weak').length,
      Pending: students.filter(s => !s.ml_risk_level || s.ml_risk_level === 'Pending').length
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
      SELECT s.*, u.name, u.email, b.name as batch_name, b.academic_year
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      WHERE s.id = ? LIMIT 1
    `, [id]);

    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    const student = students[0];

    // Batch Isolation Enforcement: Mentor can only view their own batch's students
    if (student.batch_id !== batch.id) {
      logger.warn(`Mentor ID ${mentor.id} denied access to student ${student.id} belonging to Batch ${student.batch_id}`);
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are only authorized to view students in your assigned batch.'
      });
    }

    const academicRecords = await db.query(
      'SELECT * FROM academic_records WHERE student_id = ? ORDER BY semester DESC',
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

    // Fetch meeting attendance records for this student
    const attendanceRecords = await db.query(`
      SELECT m.id as meeting_id, m.meeting_number, m.meeting_date, m.mode, m.agenda,
             a.status as attendance_status, a.remarks as attendance_remarks, a.marked_at
      FROM meetings m
      LEFT JOIN attendance a ON a.meeting_id = m.id AND a.student_id = ?
      WHERE m.batch_id = ?
      ORDER BY m.meeting_date DESC
    `, [student.id, batch.id]);

    // Risk level recommendation and action priority based on ML classification
    let support_priority = 'Medium';
    let recommendation = 'Encourage consistent academic effort and participation in technical certifications.';

    if (student.ml_risk_level === 'Weak') {
      support_priority = 'High / Critical';
      recommendation = 'Schedule mandatory remedial sessions, track weekly attendance, and initiate parental communication.';
    } else if (student.ml_risk_level === 'Bright') {
      support_priority = 'Low / Enrichment';
      recommendation = 'Assign advanced research projects, competitive coding practice, and GATE / higher study guidance.';
    } else if (student.ml_risk_level === 'Pending' || !student.ml_risk_level) {
      support_priority = 'Evaluation Pending';
      recommendation = 'Incomplete semester metrics; conduct baseline assessment to establish mentoring plan.';
    }

    return res.status(200).json({
      success: true,
      student,
      academicRecords,
      activities,
      complaints,
      attendanceRecords,
      mlDemoResult: {
        risk_level: student.ml_risk_level || 'Pending',
        support_priority,
        recommendation
      }
    });
  } catch (err) {
    logger.error('Error fetching student details:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching student details.' });
  }
};

// POST /api/mentor/meetings (Create Batch Meeting Agenda)
const createMeeting = async (req, res) => {
  try {
    const {
      meeting_date,
      mode,
      agenda,
      discussion,
      findings,
      assignment,
      remarks,
      meeting_number,
      status
    } = req.body;

    if (!meeting_date || !agenda) {
      return res.status(400).json({ success: false, message: 'Meeting date and agenda are required.' });
    }

    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor profile not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(400).json({ success: false, message: 'No batch assigned to this mentor.' });

    // Compute meeting number if not provided
    let finalMeetingNum = meeting_number ? parseInt(meeting_number, 10) : null;
    if (!finalMeetingNum) {
      const existing = await db.query('SELECT MAX(meeting_number) as max_num FROM meetings WHERE batch_id = ?', [batch.id]);
      finalMeetingNum = (existing[0]?.max_num || 0) + 1;
    }

    const cleanDate = meeting_date ? String(meeting_date).replace('T', ' ') : meeting_date;

    const result = await db.query(`
      INSERT INTO meetings (
        batch_id, mentor_id, meeting_number, meeting_date, mode, agenda,
        discussion, findings, assignment, remarks, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      batch.id,
      mentor.id,
      finalMeetingNum,
      cleanDate,
      mode || 'Offline / Seminar Hall',
      agenda.trim(),
      discussion ? discussion.trim() : '',
      findings ? findings.trim() : '',
      assignment ? assignment.trim() : '',
      remarks ? remarks.trim() : '',
      status || 'Scheduled'
    ]);

    logger.info(`Meeting agenda #${finalMeetingNum} created for Batch ${batch.name} by Mentor ${mentor.name}`);

    return res.status(201).json({
      success: true,
      message: `Meeting #${finalMeetingNum} agenda created successfully for Batch ${batch.name}.`,
      meetingId: result.insertId
    });
  } catch (err) {
    logger.error('Error creating meeting:', err);
    return res.status(500).json({ success: false, message: 'Server error creating meeting agenda.' });
  }
};

// PUT /api/mentor/meetings/:id (Update Meeting Details)
const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      meeting_date,
      mode,
      agenda,
      discussion,
      findings,
      assignment,
      remarks,
      status
    } = req.body;

    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(403).json({ success: false, message: 'No batch assigned.' });

    // Verify meeting belongs to mentor's batch
    const meetings = await db.query('SELECT * FROM meetings WHERE id = ? LIMIT 1', [id]);
    if (meetings.length === 0) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    if (meetings[0].batch_id !== batch.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify meetings of another batch.' });
    }

    const cleanDate = meeting_date ? String(meeting_date).replace('T', ' ') : null;

    await db.query(`
      UPDATE meetings
      SET meeting_date = COALESCE(?, meeting_date),
          mode = COALESCE(?, mode),
          agenda = COALESCE(?, agenda),
          discussion = COALESCE(?, discussion),
          findings = COALESCE(?, findings),
          assignment = COALESCE(?, assignment),
          remarks = COALESCE(?, remarks),
          status = COALESCE(?, status)
      WHERE id = ?
    `, [
      cleanDate,
      mode || null,
      agenda ? agenda.trim() : null,
      discussion !== undefined ? discussion.trim() : null,
      findings !== undefined ? findings.trim() : null,
      assignment !== undefined ? assignment.trim() : null,
      remarks !== undefined ? remarks.trim() : null,
      status || null,
      id
    ]);

    logger.info(`Meeting #${id} updated by Mentor ${mentor.name}`);
    return res.status(200).json({ success: true, message: 'Meeting details updated successfully.' });
  } catch (err) {
    logger.error('Error updating meeting:', err);
    return res.status(500).json({ success: false, message: 'Server error updating meeting.' });
  }
};

// GET /api/mentor/meetings
const getMeetings = async (req, res) => {
  try {
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(200).json({ success: true, meetings: [] });

    const meetings = await db.query(`
      SELECT m.*,
             (SELECT COUNT(*) FROM attendance a WHERE a.meeting_id = m.id AND a.status = 'Present') as present_count,
             (SELECT COUNT(*) FROM attendance a WHERE a.meeting_id = m.id AND a.status = 'Absent') as absent_count,
             (SELECT COUNT(*) FROM attendance a WHERE a.meeting_id = m.id) as attendance_marked_count
      FROM meetings m
      WHERE m.batch_id = ?
      ORDER BY m.meeting_date DESC
    `, [batch.id]);

    return res.status(200).json({ success: true, meetings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching meetings.' });
  }
};

// GET /api/mentor/meetings/:meetingId/attendance
const getMeetingAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(403).json({ success: false, message: 'No batch assigned.' });

    // Verify meeting belongs to mentor's batch
    const meetings = await db.query('SELECT * FROM meetings WHERE id = ? LIMIT 1', [meetingId]);
    if (meetings.length === 0) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    if (meetings[0].batch_id !== batch.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot access attendance of another batch.' });
    }

    const students = await db.query(`
      SELECT s.id as student_id, s.roll_no, s.urn, s.division, u.name,
             a.id as attendance_id, a.status as attendance_status, a.remarks as attendance_remarks
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.meeting_id = ?
      WHERE s.batch_id = ?
      ORDER BY s.roll_no ASC
    `, [meetingId, batch.id]);

    return res.status(200).json({
      success: true,
      meeting: meetings[0],
      students
    });
  } catch (err) {
    logger.error('Error fetching meeting attendance:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching attendance.' });
  }
};

// POST /api/mentor/meetings/:meetingId/attendance (Save / Edit Attendance)
const saveMeetingAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { records } = req.body; // array of { student_id, status, remarks }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Attendance records array is required.' });
    }

    const mentor = await getMentorByUserId(req.user.id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(403).json({ success: false, message: 'No batch assigned.' });

    // Verify meeting belongs to mentor's batch
    const meetings = await db.query('SELECT * FROM meetings WHERE id = ? LIMIT 1', [meetingId]);
    if (meetings.length === 0) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    if (meetings[0].batch_id !== batch.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot save attendance for another batch.' });
    }

    // Get list of valid student IDs in this batch to enforce isolation
    const batchStudents = await db.query('SELECT id FROM students WHERE batch_id = ?', [batch.id]);
    const validStudentIds = new Set(batchStudents.map(s => s.id));

    let presentCount = 0;
    let absentCount = 0;

    for (const item of records) {
      const studentId = parseInt(item.student_id, 10);
      if (!validStudentIds.has(studentId)) {
        logger.warn(`Attempt to mark attendance for non-batch student ${studentId} by Mentor ${mentor.id}`);
        continue;
      }

      const status = item.status === 'Absent' ? 'Absent' : 'Present';
      const remarks = item.remarks ? item.remarks.trim() : null;

      if (status === 'Present') presentCount++;
      else absentCount++;

      // Check if existing record exists (compatible with both MySQL and SQLite)
      const existing = await db.query(
        'SELECT id FROM attendance WHERE meeting_id = ? AND student_id = ? LIMIT 1',
        [meetingId, studentId]
      );

      if (existing.length > 0) {
        await db.query(
          'UPDATE attendance SET status = ?, remarks = ? WHERE id = ?',
          [status, remarks, existing[0].id]
        );
      } else {
        await db.query(
          'INSERT INTO attendance (meeting_id, student_id, status, remarks) VALUES (?, ?, ?, ?)',
          [meetingId, studentId, status, remarks]
        );
      }
    }

    // Update meeting status to Completed once attendance is marked
    await db.query("UPDATE meetings SET status = 'Completed' WHERE id = ?", [meetingId]);

    logger.info(`Attendance saved for meeting #${meetingId}: ${presentCount} Present, ${absentCount} Absent`);

    return res.status(200).json({
      success: true,
      message: 'Attendance saved successfully.',
      presentCount,
      absentCount
    });
  } catch (err) {
    logger.error('Error saving attendance:', err);
    return res.status(500).json({ success: false, message: 'Server error saving attendance.' });
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
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(403).json({ success: false, message: 'No batch assigned.' });

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
      [status, mentor_response ? mentor_response.trim() : '', id]
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
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(400).json({ success: false, message: 'No batch assigned.' });

    const workbook = await excelReportService.generateReport1(batch.id);
    const sanitizedBatchName = batch.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedBatchName}_Cumulative_Mentoring_Report_1.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(400).json({ success: false, message: 'No batch assigned.' });

    const workbook = await excelReportService.generateReport2(batch.id);
    const sanitizedBatchName = batch.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedBatchName}_Academic_Progress_Report_2.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(400).json({ success: false, message: 'No batch assigned.' });

    const workbook = await excelReportService.generateReport3(batch.id);
    const sanitizedBatchName = batch.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedBatchName}_Students_Progress_Report_3.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });

    const batch = await getMentorBatch(mentor.id);
    if (!batch) return res.status(400).json({ success: false, message: 'No batch assigned.' });

    const workbook = await excelReportService.generateReport4(batch.id);
    const sanitizedBatchName = batch.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedBatchName}_Analysis_of_Mentees_Report_4.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
  updateMeeting,
  getMeetings,
  getMeetingAttendance,
  saveMeetingAttendance,
  getComplaints,
  updateComplaintStatus,
  downloadReport1,
  downloadReport2,
  downloadReport3,
  downloadReport4
};
