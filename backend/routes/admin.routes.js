const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All admin routes require JWT token + ADMIN role
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

// Dashboard stats
router.get('/dashboard', adminController.getDashboardStats);

// Mentors CRUD
router.get('/mentors', adminController.getMentors);
router.post('/mentors', adminController.createMentor);
router.get('/mentors/:id', adminController.getMentorById);
router.put('/mentors/:id', adminController.updateMentor);

// Students CRUD
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);
router.get('/students/:id', adminController.getStudentById);
router.put('/students/:id', adminController.updateStudent);
router.patch('/students/:id/batch', adminController.assignStudentToBatch);

// Batches CRUD
router.get('/batches', adminController.getBatches);
router.post('/batches', adminController.createBatch);
router.put('/batches/:id', adminController.updateBatch);
router.post('/batches/:id/assign-mentor', adminController.assignMentorToBatch);

module.exports = router;
