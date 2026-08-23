const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All student routes require JWT token + STUDENT role
router.use(authenticateToken);
router.use(requireRole('STUDENT'));

router.get('/dashboard', studentController.getStudentDashboard);
router.get('/profile', studentController.getStudentProfile);
router.put('/profile', studentController.updateStudentProfile);

router.get('/academic', studentController.getStudentAcademic);

router.get('/activities', studentController.getStudentActivities);
router.post('/activities', studentController.addStudentActivity);

router.get('/meetings', studentController.getStudentMeetings);

router.get('/complaints', studentController.getStudentComplaints);
router.post('/complaints', studentController.submitComplaint);

router.get('/notifications', studentController.getStudentNotifications);
router.get('/report', studentController.getStudentCompleteReport);

module.exports = router;
