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

// Divisions CRUD (AI & DS - 4 Years, Manual Addition)
router.get('/divisions', adminController.getDivisions);
router.post('/divisions', adminController.createDivision);
router.delete('/divisions/:id', adminController.deleteDivision);

// Mentors CRUD
router.get('/mentors', adminController.getMentors);
router.post('/mentors', adminController.createMentor);
router.get('/mentors/:id', adminController.getMentorById);
router.put('/mentors/:id', adminController.updateMentor);
router.delete('/mentors/:id', adminController.deleteMentor);

// Students CRUD
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);
router.get('/students/:id', adminController.getStudentById);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.patch('/students/:id/batch', adminController.assignStudentToBatch);

// Batches CRUD
router.get('/batches', adminController.getBatches);
router.post('/batches', adminController.createBatch);
router.put('/batches/:id', adminController.updateBatch);
router.delete('/batches/:id', adminController.deleteBatch);
router.post('/batches/:id/assign-mentor', adminController.assignMentorToBatch);

// PDF & Sharable Credentials Data
router.get('/credentials/students', adminController.getStudentCredentials);
router.get('/credentials/mentors', adminController.getMentorCredentials);

module.exports = router;
