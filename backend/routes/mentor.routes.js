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
router.get('/students/:id/report', mentorController.getMentorStudentReport);

// Common Meeting Agenda & Attendance
router.post('/meetings', mentorController.createMeeting);
router.get('/meetings', mentorController.getMeetings);
router.get('/meetings/:id/attendance', mentorController.getMeetingAttendance);
router.post('/meetings/:id/attendance', mentorController.saveMeetingAttendance);

// Activities & Certificate Verification
router.get('/activities', mentorController.getBatchActivities);
router.put('/activities/:id/status', mentorController.updateActivityStatus);

// Complaints Management
router.get('/complaints', mentorController.getComplaints);
router.put('/complaints/:id/status', mentorController.updateComplaintStatus);


// Excel Report Generation Routes (Report 1 - 4)
router.get('/reports/report1', mentorController.downloadReport1);
router.get('/reports/report2', mentorController.downloadReport2);
router.get('/reports/report3', mentorController.downloadReport3);
router.get('/reports/report4', mentorController.downloadReport4);

// PDF & Sharable Credentials Data for Mentees
router.get('/credentials/mentees', mentorController.getMenteeCredentials);

module.exports = router;
