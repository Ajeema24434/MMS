const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentor.controller');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All mentor routes require JWT token + MENTOR role
router.use(authenticateToken);
router.use(requireRole('MENTOR'));

// Dashboard & Students
router.get('/dashboard', mentorController.getMentorDashboard);
router.get('/students', mentorController.getAssignedStudents);
router.get('/students/:id', mentorController.getStudentDetail);

// Meetings Management
router.post('/meetings', mentorController.createMeeting);
router.get('/meetings', mentorController.getMeetings);
router.put('/meetings/:id', mentorController.updateMeeting);

// Meeting Attendance
router.get('/meetings/:meetingId/attendance', mentorController.getMeetingAttendance);
router.post('/meetings/:meetingId/attendance', mentorController.saveMeetingAttendance);

// Complaints Management
router.get('/complaints', mentorController.getComplaints);
router.put('/complaints/:id/status', mentorController.updateComplaintStatus);

// Excel Report Generation Routes (Report 1 - 4)
router.get('/reports/report1', mentorController.downloadReport1);
router.get('/reports/report2', mentorController.downloadReport2);
router.get('/reports/report3', mentorController.downloadReport3);
router.get('/reports/report4', mentorController.downloadReport4);

module.exports = router;
