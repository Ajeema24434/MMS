const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const logger = require('../utils/logger');
const { validateFileHeader, uploadDir } = require('../middleware/upload');

// Helper to fetch student record
const getStudentByUserId = async (userId) => {
  const students = await db.query(`
    SELECT 
      s.id,
      s.user_id,
      s.urn,
      s.roll_no,
      s.department,
      s.division,
      s.semester,
      s.phone,
      s.batch_id,
      s.ml_risk_level,
      u.name,
      u.email,
      u.role,
      b.name as batch_name,
      b.academic_year,
      m.id as mentor_id,
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

// GET /api/student/dashboard
const getStudentDashboard = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Academic records (REAL DB records only)
    const academicRecords = await db.query(
      'SELECT * FROM academic_records WHERE student_id = ? ORDER BY semester DESC',
      [student.id]
    );

    const latestAcademic = academicRecords.length > 0 ? academicRecords[0] : null;

    // Real subject-wise marks from subject_marks table
    let subjectMarks = [];
    if (latestAcademic) {
      subjectMarks = await db.query(`
        SELECT subject, internal_marks as internal, exam_marks as exam, total_marks as total, grade
        FROM subject_marks
        WHERE student_id = ? AND semester = ?
        ORDER BY id ASC
      `, [student.id, latestAcademic.semester]);
    } else {
      // Check if any subject marks exist for student's current semester
      subjectMarks = await db.query(`
        SELECT subject, internal_marks as internal, exam_marks as exam, total_marks as total, grade
        FROM subject_marks
        WHERE student_id = ? AND semester = ?
        ORDER BY id ASC
      `, [student.id, student.semester || 5]);
    }

    // Real Meetings for student's batch
    const meetings = student.batch_id ? await db.query(
      'SELECT * FROM meetings WHERE batch_id = ? ORDER BY meeting_date DESC',
      [student.batch_id]
    ) : [];

    const upcomingMeeting = meetings.find(m => m.status === 'Scheduled') || null;
    const meetingsAttendedCount = meetings.filter(m => m.status === 'Completed').length;

    // Real Activities
    const activities = await db.query(
      'SELECT * FROM activities WHERE student_id = ? ORDER BY date_achieved DESC',
      [student.id]
    );
    const pendingActivitiesCount = activities.filter(a => a.status === 'Pending').length;

    // Real Complaints
    const complaints = await db.query(
      'SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC',
      [student.id]
    );
    const pendingComplaintsCount = complaints.filter(c => c.status !== 'Resolved').length;

    // Real Notifications
    const notifications = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );

    // Real Mentor Advice (from academic record remarks or latest meeting remarks)
    let mentorAdvice = null;
    if (latestAcademic && latestAcademic.mentor_remarks && latestAcademic.mentor_remarks.trim()) {
      mentorAdvice = latestAcademic.mentor_remarks.trim();
    } else {
      const meetingWithRemarks = meetings.find(m => m.remarks && m.remarks.trim());
      if (meetingWithRemarks) {
        mentorAdvice = meetingWithRemarks.remarks.trim();
      }
    }

    // Summary calculation (only from real data, no fake fallbacks)
    const summary = {
      attendance: latestAcademic && latestAcademic.attendance_percentage != null ? `${Number(latestAcademic.attendance_percentage)}%` : 'N/A',
      attendanceNumber: latestAcademic && latestAcademic.attendance_percentage != null ? Number(latestAcademic.attendance_percentage) : null,
      avgMarks: latestAcademic && latestAcademic.cgpa != null ? (latestAcademic.cgpa * 10).toFixed(2) + '%' : (latestAcademic && latestAcademic.ese_marks != null ? latestAcademic.ese_marks + '%' : 'N/A'),
      academicProgress: latestAcademic ? (latestAcademic.defaulter_flag ? 'Needs Guidance' : 'Good Progress') : 'Not Available',
      hasAcademicData: Boolean(latestAcademic || subjectMarks.length > 0),
      meetingsAttended: `${meetingsAttendedCount}/${meetings.length}`,
      pendingActivities: pendingActivitiesCount,
      complaints: `${pendingComplaintsCount} ${pendingComplaintsCount > 0 ? 'In Progress' : 'Resolved'}`
    };

    return res.status(200).json({
      success: true,
      student,
      summary,
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

// PUT /api/student/profile (Edit permitted personal fields ONLY: email, phone)
const updateStudentProfile = async (req, res) => {
  try {
    const { phone, email } = req.body;
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    // Validate phone
    if (phone) {
      const cleanPhone = phone.trim();
      if (!/^[0-9+ -]{7,15}$/.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
      }
      await db.query('UPDATE students SET phone = ? WHERE id = ?', [cleanPhone, student.id]);
    }

    // Validate email
    if (email) {
      const cleanEmail = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email address format.' });
      }
      await db.query('UPDATE users SET email = ? WHERE id = ?', [cleanEmail, student.user_id]);
    }

    logger.info(`Student personal profile updated for URN ${student.urn}`);
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

    const records = await db.query(
      'SELECT * FROM academic_records WHERE student_id = ? ORDER BY semester DESC',
      [student.id]
    );

    const latestSemester = records.length > 0 ? records[0].semester : (student.semester || 5);

    const subjectMarks = await db.query(`
      SELECT subject, internal_marks as internal, exam_marks as exam, total_marks as total, grade
      FROM subject_marks
      WHERE student_id = ? AND semester = ?
      ORDER BY id ASC
    `, [student.id, latestSemester]);

    const hasData = records.length > 0 || subjectMarks.length > 0;

    return res.status(200).json({
      success: true,
      hasData,
      message: hasData ? null : 'Academic records are not available yet.',
      records,
      subjectMarks,
      overallAttendance: records[0]?.attendance_percentage != null ? records[0].attendance_percentage : null,
      subjectsBelowAttendance: records[0]?.subjects_failed_count || 0,
      academicPerformance: records[0] ? (records[0].defaulter_flag ? 'Needs Guidance' : 'Good Progress') : 'Not Available'
    });
  } catch (err) {
    logger.error('Error fetching academic records:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching academic records' });
  }
};

// GET /api/student/activities
const getStudentActivities = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const activities = await db.query(
      `SELECT a.*, m.mentor_code as reviewer_code, u.name as reviewer_name
       FROM activities a
       LEFT JOIN mentors m ON a.reviewed_by = m.id
       LEFT JOIN users u ON m.user_id = u.id
       WHERE a.student_id = ?
       ORDER BY a.date_achieved DESC, a.id DESC`,
      [student.id]
    );
    return res.status(200).json({ success: true, activities });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching activities' });
  }
};

// POST /api/student/activities (Supports both JSON and multipart certificate upload)
const addStudentActivity = async (req, res) => {
  let uploadedFilePath = null;
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const { title, category, description, date_achieved } = req.body;

    if (!title || !title.trim() || !category || !category.trim() || !date_achieved) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Activity title, category, and date achieved are required.' });
    }

    let evidence_url = null;
    let original_filename = null;
    let file_size = null;

    if (req.file) {
      uploadedFilePath = req.file.path;

      // Validate magic bytes header on server
      const isValid = validateFileHeader(uploadedFilePath);
      if (!isValid) {
        fs.unlinkSync(uploadedFilePath);
        return res.status(400).json({
          success: false,
          message: 'Invalid certificate file content. File does not match valid PDF, PNG, or JPG headers.'
        });
      }

      evidence_url = req.file.filename;
      original_filename = path.basename(req.file.originalname);
      file_size = req.file.size;
    } else if (req.body.evidence_url && typeof req.body.evidence_url === 'string') {
      evidence_url = path.basename(req.body.evidence_url.trim());
      original_filename = evidence_url;
    }

    // Always start with 'Pending' status (student cannot approve their own activity)
    const actRes = await db.query(
      `INSERT INTO activities (student_id, title, category, description, date_achieved, evidence_url, original_filename, file_size, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        student.id,
        title.trim(),
        category.trim(),
        (description || '').trim(),
        date_achieved,
        evidence_url,
        original_filename,
        file_size
      ]
    );

    logger.info(`Activity #${actRes.insertId} submitted by student ${student.urn}`);

    return res.status(201).json({
      success: true,
      message: 'Activity submitted successfully with Pending verification status.',
      activityId: actRes.insertId,
      status: 'Pending'
    });
  } catch (err) {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try { fs.unlinkSync(uploadedFilePath); } catch (e) {}
    }
    logger.error('Error submitting activity:', err);
    return res.status(500).json({ success: false, message: 'Server error submitting activity: ' + err.message });
  }
};

// GET /api/student/activities/:id/certificate
const downloadActivityCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const activities = await db.query(
      'SELECT evidence_url, original_filename FROM activities WHERE id = ? AND student_id = ? LIMIT 1',
      [id, student.id]
    );

    if (activities.length === 0 || !activities[0].evidence_url) {
      return res.status(404).json({ success: false, message: 'Certificate file not found.' });
    }

    const filename = path.basename(activities[0].evidence_url);
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Stored certificate file is not present on server.' });
    }

    return res.download(filePath, activities[0].original_filename || filename);
  } catch (err) {
    logger.error('Error downloading certificate:', err);
    return res.status(500).json({ success: false, message: 'Server error accessing certificate file.' });
  }
};

// GET /api/student/meetings
const getStudentMeetings = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student || !student.batch_id) return res.status(200).json({ success: true, upcoming: [], past: [] });

    const meetings = await db.query(
      'SELECT * FROM meetings WHERE batch_id = ? ORDER BY meeting_date DESC',
      [student.batch_id]
    );

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

    const complaints = await db.query(
      'SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC',
      [student.id]
    );
    return res.status(200).json({ success: true, complaints });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching complaints' });
  }
};

// POST /api/student/complaints
const submitComplaint = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !title.trim() || !description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Complaint title and description are required.' });
    }

    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const complaintRes = await db.query(
      `INSERT INTO complaints (student_id, title, description, category, status) VALUES (?, ?, ?, ?, 'Pending')`,
      [student.id, title.trim(), description.trim(), category ? category.trim() : 'Academic']
    );

    logger.info(`Complaint #${complaintRes.insertId} submitted by student ${student.urn}`);

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
    const notifications = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.status(200).json({ success: true, notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

// PATCH /api/student/notifications/:id/read (Mark student's own notification as read)
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    // Strict ownership verification: cannot modify another student's notification
    const existing = await db.query(
      'SELECT id, user_id FROM notifications WHERE id = ? LIMIT 1',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (existing[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify another user\'s notification.' });
    }

    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating notification status' });
  }
};

// POST /api/student/notifications/read-all
const markAllNotificationsRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating notifications' });
  }
};

// GET /api/student/report (MY COMPLETE REPORT GENERATOR)
const getStudentCompleteReport = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const academicRecords = await db.query(
      'SELECT * FROM academic_records WHERE student_id = ? ORDER BY semester DESC',
      [student.id]
    );

    const latestSemester = academicRecords.length > 0 ? academicRecords[0].semester : (student.semester || 5);

    // Fetch real subject marks
    const subjectMarks = await db.query(`
      SELECT subject, internal_marks as internal, exam_marks as exam, total_marks as total, grade
      FROM subject_marks
      WHERE student_id = ? AND semester = ?
      ORDER BY id ASC
    `, [student.id, latestSemester]);

    const activities = await db.query(
      'SELECT * FROM activities WHERE student_id = ? ORDER BY date_achieved DESC',
      [student.id]
    );

    const meetings = student.batch_id ? await db.query(
      'SELECT * FROM meetings WHERE batch_id = ? ORDER BY meeting_date DESC',
      [student.batch_id]
    ) : [];

    const complaints = await db.query(
      'SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC',
      [student.id]
    );

    // Real mentor observations (from academic records or meetings)
    const mentorObservations = [];
    if (academicRecords[0]?.mentor_remarks && academicRecords[0].mentor_remarks.trim()) {
      mentorObservations.push(academicRecords[0].mentor_remarks.trim());
    }
    meetings.forEach(m => {
      if (m.remarks && m.remarks.trim() && !mentorObservations.includes(m.remarks.trim())) {
        mentorObservations.push(`Meeting #${m.meeting_number || 1}: ${m.remarks.trim()}`);
      }
    });

    const hasAcademicRecords = academicRecords.length > 0;

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
        available: hasAcademicRecords || subjectMarks.length > 0,
        records: academicRecords,
        overallAttendance: hasAcademicRecords && academicRecords[0].attendance_percentage != null ? `${Number(academicRecords[0].attendance_percentage)}%` : 'Not available',
        overallCgpa: hasAcademicRecords && academicRecords[0].cgpa != null ? Number(academicRecords[0].cgpa) : 'Not available',
        subjectMarks: subjectMarks,
        notice: (hasAcademicRecords || subjectMarks.length > 0) ? null : 'Academic records are not available yet.'
      },
      meetings,
      activities,
      mentorObservations: mentorObservations.length > 0 ? mentorObservations : ['No mentor observations recorded yet.'],
      complaints,
      overallProgress: hasAcademicRecords ? (academicRecords[0].defaulter_flag ? 'Needs Guidance' : 'Good Performance') : 'Pending Evaluation'
    };

    return res.status(200).json({ success: true, report });
  } catch (err) {
    logger.error('Error generating student complete report:', err);
    return res.status(500).json({ success: false, message: 'Server error generating complete report' });
  }
};

module.exports = {
  getStudentDashboard,
  getStudentProfile,
  updateStudentProfile,
  getStudentAcademic,
  getStudentActivities,
  addStudentActivity,
  downloadActivityCertificate,
  getStudentMeetings,
  getStudentComplaints,
  submitComplaint,
  getStudentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getStudentCompleteReport
};
