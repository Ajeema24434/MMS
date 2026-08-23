-- AI-Driven Mentor-Mentee Management System
-- Database Seed File for Student Portal & System Integration
-- Password for all seed users: password123
-- Hash: $2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42

USE mentor_mentee;

-- 1. Insert Users (Admin, Mentors, Students)
INSERT INTO users (id, role, identifier, password_hash, name, email, is_active) VALUES
-- Admin
(1, 'ADMIN', 'admin@mms.edu', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'System Administrator', 'admin@mms.edu', 1),

-- Mentors
(2, 'MENTOR', 'MNT101', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Dr. Ramesh Sharma', 'ramesh.sharma@mms.edu', 1),
(3, 'MENTOR', 'MNT102', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Prof. Sunita Patil', 'sunita.patil@mms.edu', 1),
(4, 'MENTOR', 'MNT103', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Dr. Amit Verma', 'amit.verma@mms.edu', 1),
(5, 'MENTOR', 'MNT104', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Prof. Neha Gupta', 'neha.gupta@mms.edu', 1),

-- Students (Batch CSE-2024-A)
(6, 'STUDENT', 'URN2024001', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Aarav Patel', 'aarav.patel@student.mms.edu', 1),
(7, 'STUDENT', 'URN2024002', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Ananya Deshmukh', 'ananya.d@student.mms.edu', 1),
(8, 'STUDENT', 'URN2024003', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Rohan Mehta', 'rohan.mehta@student.mms.edu', 1),
(9, 'STUDENT', 'URN2024004', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Priya Kulkarni', 'priya.k@student.mms.edu', 1),
(10, 'STUDENT', 'URN2024005', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Siddharth Joshi', 'sid.j@student.mms.edu', 1),

-- Students (Batch CSE-2024-B)
(11, 'STUDENT', 'URN2024006', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Diya Roy', 'diya.roy@student.mms.edu', 1),
(12, 'STUDENT', 'URN2024007', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Vikram Singh', 'vikram.s@student.mms.edu', 1),
(13, 'STUDENT', 'URN2024008', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Ishaan Malhotra', 'ishaan.m@student.mms.edu', 1),
(14, 'STUDENT', 'URN2024009', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Kavya Nair', 'kavya.n@student.mms.edu', 1),
(15, 'STUDENT', 'URN2024010', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Aditya Kumar', 'aditya.k@student.mms.edu', 1),

-- Students (Batch ECE-2024-A)
(16, 'STUDENT', 'URN2024011', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Tanvi Saxena', 'tanvi.s@student.mms.edu', 1),
(17, 'STUDENT', 'URN2024012', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Rahul Choudhury', 'rahul.c@student.mms.edu', 1),
(18, 'STUDENT', 'URN2024013', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Meera Iyer', 'meera.i@student.mms.edu', 1),
(19, 'STUDENT', 'URN2024014', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Varun Rao', 'varun.r@student.mms.edu', 1),
(20, 'STUDENT', 'URN2024015', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Neha Reddy', 'neha.r@student.mms.edu', 1),

-- Students (Batch IT-2024-A)
(21, 'STUDENT', 'URN2024016', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Yash Varma', 'yash.v@student.mms.edu', 1),
(22, 'STUDENT', 'URN2024017', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Pooja Bhatt', 'pooja.b@student.mms.edu', 1),
(23, 'STUDENT', 'URN2024018', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Gaurav Das', 'gaurav.d@student.mms.edu', 1),
(24, 'STUDENT', 'URN2024019', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Sneha Shinde', 'sneha.s@student.mms.edu', 1),
(25, 'STUDENT', 'URN2024020', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Karan Gupta', 'karan.g@student.mms.edu', 1);

-- 2. Insert Admins
INSERT INTO admins (id, user_id, department) VALUES
(1, 1, 'Computer Engineering');

-- 3. Insert Mentors
INSERT INTO mentors (id, user_id, mentor_code, department, designation, phone) VALUES
(1, 2, 'MNT101', 'Computer Engineering', 'Associate Professor', '9876543210'),
(2, 3, 'MNT102', 'Computer Engineering', 'Assistant Professor', '9876543211'),
(3, 4, 'MNT103', 'Electronics & Telecom', 'Assistant Professor', '9876543212'),
(4, 5, 'MNT104', 'Information Tech', 'Professor & HOD', '9876543213');

-- 4. Insert Batches
INSERT INTO batches (id, name, department, academic_year, mentor_id) VALUES
(1, 'CSE-2024-A', 'Computer Engineering', '2024-2025', 1),
(2, 'CSE-2024-B', 'Computer Engineering', '2024-2025', 2),
(3, 'ECE-2024-A', 'Electronics & Telecom', '2024-2025', 3),
(4, 'IT-2024-A', 'Information Tech', '2024-2025', 4);

-- 5. Insert Students
INSERT INTO students (id, user_id, urn, roll_no, department, division, semester, phone, batch_id, ml_risk_level) VALUES
-- Batch 1 (CSE-2024-A)
(1, 6, 'URN2024001', 'CSE-01', 'Computer Engineering', 'A', 5, '9876543201', 1, 'Bright'),
(2, 7, 'URN2024002', 'CSE-02', 'Computer Engineering', 'A', 5, '9876543202', 1, 'Average'),
(3, 8, 'URN2024003', 'CSE-03', 'Computer Engineering', 'A', 5, '9876543203', 1, 'Weak'),
(4, 9, 'URN2024004', 'CSE-04', 'Computer Engineering', 'A', 5, '9876543204', 1, 'Average'),
(5, 10, 'URN2024005', 'CSE-05', 'Computer Engineering', 'A', 5, '9876543205', 1, 'Bright'),

-- Batch 2 (CSE-2024-B)
(6, 11, 'URN2024006', 'CSE-06', 'Computer Engineering', 'B', 5, '9876543206', 2, 'Average'),
(7, 12, 'URN2024007', 'CSE-07', 'Computer Engineering', 'B', 5, '9876543207', 2, 'Weak'),
(8, 13, 'URN2024008', 'CSE-08', 'Computer Engineering', 'B', 5, '9876543208', 2, 'Average'),
(9, 14, 'URN2024009', 'CSE-09', 'Computer Engineering', 'B', 5, '9876543209', 2, 'Bright'),
(10, 15, 'URN2024010', 'CSE-10', 'Computer Engineering', 'B', 5, '9876543210', 2, 'Average'),

-- Batch 3 (ECE-2024-A)
(11, 16, 'URN2024011', 'ECE-01', 'Electronics & Telecom', 'A', 5, '9876543211', 3, 'Bright'),
(12, 17, 'URN2024012', 'ECE-02', 'Electronics & Telecom', 'A', 5, '9876543212', 3, 'Weak'),
(13, 18, 'URN2024013', 'ECE-03', 'Electronics & Telecom', 'A', 5, '9876543213', 3, 'Average'),
(14, 19, 'URN2024014', 'ECE-04', 'Electronics & Telecom', 'A', 5, '9876543214', 3, 'Average'),
(15, 20, 'URN2024015', 'ECE-05', 'Electronics & Telecom', 'A', 5, '9876543215', 3, 'Bright'),

-- Batch 4 (IT-2024-A)
(16, 21, 'URN2024016', 'IT-01', 'Information Tech', 'A', 5, '9876543216', 4, 'Average'),
(17, 22, 'URN2024017', 'IT-02', 'Information Tech', 'A', 5, '9876543217', 4, 'Weak'),
(18, 23, 'URN2024018', 'IT-03', 'Information Tech', 'A', 5, '9876543218', 4, 'Average'),
(19, 24, 'URN2024019', 'IT-04', 'Information Tech', 'A', 5, '9876543219', 4, 'Bright'),
(20, 25, 'URN2024020', 'IT-05', 'Information Tech', 'A', 5, '9876543220', 4, 'Average');

-- 6. Insert Academic Records
INSERT INTO academic_records (id, student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag) VALUES
(1, 1, 5, 8.90, 82.45, 19.5, 27.0, 62.0, 0, 0),
(2, 2, 5, 7.20, 81.00, 16.0, 21.5, 51.0, 0, 0),
(3, 3, 5, 5.40, 62.00, 12.0, 14.0, 38.0, 2, 1),
(4, 4, 5, 6.80, 78.50, 15.0, 19.0, 48.0, 0, 0),
(5, 5, 5, 9.10, 95.00, 20.0, 28.5, 65.0, 0, 0),
(6, 6, 5, 7.40, 83.00, 17.0, 22.0, 52.0, 0, 0),
(7, 7, 5, 5.10, 58.00, 10.0, 12.0, 34.0, 3, 1),
(8, 8, 5, 6.90, 76.00, 14.5, 18.5, 49.0, 0, 0),
(9, 9, 5, 8.80, 91.00, 19.0, 26.0, 61.0, 0, 0),
(10, 10, 5, 7.10, 80.00, 16.0, 20.0, 50.0, 0, 0),
(11, 11, 5, 9.20, 96.00, 20.0, 29.0, 67.0, 0, 0),
(12, 12, 5, 5.60, 64.00, 11.5, 15.0, 41.0, 1, 1),
(13, 13, 5, 7.30, 82.00, 16.5, 21.0, 53.0, 0, 0),
(14, 14, 5, 6.70, 77.00, 14.0, 18.0, 46.0, 0, 0),
(15, 15, 5, 8.70, 90.00, 18.5, 25.5, 59.0, 0, 0),
(16, 16, 5, 7.50, 84.00, 17.0, 22.5, 54.0, 0, 0),
(17, 17, 5, 5.20, 60.00, 10.5, 13.0, 36.0, 2, 1),
(18, 18, 5, 6.95, 79.00, 15.0, 19.5, 49.5, 0, 0),
(19, 19, 5, 9.00, 94.00, 19.5, 28.0, 64.0, 0, 0),
(20, 20, 5, 7.00, 81.50, 16.0, 21.0, 50.5, 0, 0);

-- 7. Insert Activities
INSERT INTO activities (id, student_id, title, category, description, date_achieved, evidence_url, status) VALUES
(1, 1, 'NPTEL Cloud Computing Certification', 'NPTEL', 'Completed course with Elite Gold status', '2024-04-15', 'nptel_cert.pdf', 'Approved'),
(2, 1, 'Smart India Hackathon Finalist', 'Software / Certification', 'Built IoT prototype for smart campus', '2024-03-10', 'sih_cert.pdf', 'Approved'),
(3, 1, 'Web Development MERN Stack Workshop', 'Workshop', 'Attended 3-day hands-on MERN stack training', '2024-02-20', 'mern_workshop.pdf', 'Pending'),
(4, 2, 'College Sports Football Captain', 'Sports', 'Led department football team to finals', '2024-01-25', 'sports_cert.pdf', 'Approved'),
(5, 5, 'AI Research Internship', 'Internship', 'Machine Learning research intern at Tech Corp', '2024-07-01', 'internship_letter.pdf', 'Approved');

-- 8. Insert Complaints
INSERT INTO complaints (id, student_id, title, description, category, status, mentor_response, created_at) VALUES
(1, 1, 'Difficulty in Machine Learning Subject', 'Need additional remedial classes and doubt solving sessions for ML algorithms.', 'Academic', 'In Progress', 'Scheduled remedial doubt session for next Tuesday at 4 PM.', '2024-08-10 10:30:00'),
(2, 7, 'Attendance Discrepancy in DBMS Lab', 'My attendance for 2 lab sessions in July was marked absent by mistake.', 'Academic', 'Pending', NULL, '2024-08-12 14:15:00'),
(3, 12, 'Library Book Access Issue', 'Reference books for Signals & Systems are not available in library.', 'Infrastructure', 'In Progress', 'Forwarded request to central library committee.', '2024-08-05 11:00:00'),
(4, 17, 'Request for Placement Guidance', 'Need assistance with resume formatting and mock technical interviews.', 'Personal', 'Resolved', 'Provided resume template and conducted 1-on-1 mock interview.', '2024-08-14 16:45:00');

-- 9. Insert Meetings
INSERT INTO meetings (id, batch_id, mentor_id, meeting_number, meeting_date, mode, agenda, discussion, findings, assignment, remarks, status, created_at) VALUES
(1, 1, 1, 1, '2024-08-01 11:00:00', 'Offline / Seminar Hall 2', 'Semester Opening & Attendance Warning', 'Discussed 75% attendance rule and ISE/MSE exam pattern.', 'Most students satisfied, 1 student flagged for attendance.', 'Submit mini-project proposal by Aug 20.', 'Counseled defaulter students.', 'Completed', '2024-08-01 12:00:00'),
(2, 1, 1, 2, '2024-08-28 14:00:00', 'Offline / Lab 4', 'Mid-Term Progress Review & Guidance', 'Reviewing ISE performance and NPTEL certifications.', 'Assigned peer tutors for weak mentees.', 'Complete NPTEL assignment 3.', 'Upcoming meeting for CSE-2024-A.', 'Scheduled', '2024-08-15 15:00:00'),
(3, 2, 2, 1, '2024-08-05 10:30:00', 'Offline / Room 302', 'Mentorship Intro & Remedial Planning', 'General mentorship orientation and career counseling.', 'Mapped student interests.', 'Prepare resume drafts.', 'Completed meeting.', 'Completed', '2024-08-05 11:30:00');

-- 10. Insert Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES
(1, 6, 'Activity Approved', 'Your activity "NPTEL Cloud Computing Certification" was approved by Dr. Ramesh Sharma.', 'Success', 0, '2024-08-16 09:00:00'),
(2, 6, 'Meeting Scheduled', 'New mentoring meeting #2 scheduled for Aug 28, 2:00 PM in Lab 4.', 'Info', 0, '2024-08-15 15:00:00'),
(3, 6, 'Complaint Response Updated', 'Dr. Ramesh Sharma updated response for "Difficulty in Machine Learning Subject".', 'Warning', 0, '2024-08-14 11:30:00'),
(4, 6, 'Mentor Advice Added', 'New guidance note added: Focus on DBMS lab submissions and complete NPTEL credits.', 'Info', 1, '2024-08-10 16:00:00');
