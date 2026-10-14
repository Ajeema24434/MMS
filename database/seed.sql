-- AI-Driven Mentor-Mentee Management System
-- Database Seed File for Student Portal & System Integration
-- Password for all seed users: password123
-- Hash: $2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42

USE mentor_mentee;

-- 1. Insert Users (Admin, Mentors, Students)
INSERT INTO users (id, role, identifier, password_hash, name, email, is_active) VALUES
-- Admin (ID: 1)
(1, 'ADMIN', 'admin@mms.edu', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'System Administrator', 'admin@mms.edu', 1),

-- Mentors (IDs: 2 - 5)
(2, 'MENTOR', 'MNT101', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Dr. Ramesh Sharma', 'ramesh.sharma@mms.edu', 1),
(3, 'MENTOR', 'MNT102', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Prof. Sunita Patil', 'sunita.patil@mms.edu', 1),
(4, 'MENTOR', 'MNT103', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Dr. Amit Verma', 'amit.verma@mms.edu', 1),
(5, 'MENTOR', 'MNT104', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Prof. Neha Gupta', 'neha.gupta@mms.edu', 1),

-- Students: Batch 1 (CSE-2024-A, Mentor: Dr. Ramesh Sharma) - Exactly 20 Students (IDs: 6 - 25)
(6, 'STUDENT', 'URN2024001', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Aarav Patel', 'aarav.patel@student.mms.edu', 1),
(7, 'STUDENT', 'URN2024002', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Ananya Deshmukh', 'ananya.d@student.mms.edu', 1),
(8, 'STUDENT', 'URN2024003', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Rohan Mehta', 'rohan.mehta@student.mms.edu', 1),
(9, 'STUDENT', 'URN2024004', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Priya Kulkarni', 'priya.k@student.mms.edu', 1),
(10, 'STUDENT', 'URN2024005', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Siddharth Joshi', 'sid.j@student.mms.edu', 1),
(11, 'STUDENT', 'URN2024006', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Diya Roy', 'diya.roy@student.mms.edu', 1),
(12, 'STUDENT', 'URN2024007', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Vikram Singh', 'vikram.s@student.mms.edu', 1),
(13, 'STUDENT', 'URN2024008', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Ishaan Malhotra', 'ishaan.m@student.mms.edu', 1),
(14, 'STUDENT', 'URN2024009', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Kavya Nair', 'kavya.n@student.mms.edu', 1),
(15, 'STUDENT', 'URN2024010', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Aditya Kumar', 'aditya.k@student.mms.edu', 1),
(16, 'STUDENT', 'URN2024011', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Tanvi Saxena', 'tanvi.s@student.mms.edu', 1),
(17, 'STUDENT', 'URN2024012', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Rahul Choudhury', 'rahul.c@student.mms.edu', 1),
(18, 'STUDENT', 'URN2024013', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Meera Iyer', 'meera.i@student.mms.edu', 1),
(19, 'STUDENT', 'URN2024014', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Varun Rao', 'varun.r@student.mms.edu', 1),
(20, 'STUDENT', 'URN2024015', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Neha Reddy', 'neha.r@student.mms.edu', 1),
(21, 'STUDENT', 'URN2024016', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Yash Varma', 'yash.v@student.mms.edu', 1),
(22, 'STUDENT', 'URN2024017', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Pooja Bhatt', 'pooja.b@student.mms.edu', 1),
(23, 'STUDENT', 'URN2024018', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Gaurav Das', 'gaurav.d@student.mms.edu', 1),
(24, 'STUDENT', 'URN2024019', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Sneha Shinde', 'sneha.s@student.mms.edu', 1),
(25, 'STUDENT', 'URN2024020', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Karan Gupta', 'karan.g@student.mms.edu', 1),

-- Students: Batch 2 (CSE-2024-B, Mentor: Prof. Sunita Patil) - (IDs: 26 - 30)
(26, 'STUDENT', 'URN2024021', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Amit Trivedi', 'amit.t@student.mms.edu', 1),
(27, 'STUDENT', 'URN2024022', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Ritu Sen', 'ritu.s@student.mms.edu', 1),
(28, 'STUDENT', 'URN2024023', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Kunal Shah', 'kunal.s@student.mms.edu', 1),
(29, 'STUDENT', 'URN2024024', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Shreya Ghoshal', 'shreya.g@student.mms.edu', 1),
(30, 'STUDENT', 'URN2024025', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Sameer Khan', 'sameer.k@student.mms.edu', 1),

-- Students: Batch 3 (ECE-2024-A, Mentor: Dr. Amit Verma) - (IDs: 31 - 35)
(31, 'STUDENT', 'URN2024026', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Abhinav Shukla', 'abhinav.s@student.mms.edu', 1),
(32, 'STUDENT', 'URN2024027', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Rakesh Yadav', 'rakesh.y@student.mms.edu', 1),
(33, 'STUDENT', 'URN2024028', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Prachi Mishra', 'prachi.m@student.mms.edu', 1),
(34, 'STUDENT', 'URN2024029', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Manish Pandey', 'manish.p@student.mms.edu', 1),
(35, 'STUDENT', 'URN2024030', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Divya Pillai', 'divya.p@student.mms.edu', 1),

-- Students: Batch 4 (IT-2024-A, Mentor: Prof. Neha Gupta) - (IDs: 36 - 40)
(36, 'STUDENT', 'URN2024031', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Tarun Bakshi', 'tarun.b@student.mms.edu', 1),
(37, 'STUDENT', 'URN2024032', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Swati Roy', 'swati.r@student.mms.edu', 1),
(38, 'STUDENT', 'URN2024033', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Deepa Nair', 'deepa.n@student.mms.edu', 1),
(39, 'STUDENT', 'URN2024034', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Harish Bhat', 'harish.b@student.mms.edu', 1),
(40, 'STUDENT', 'URN2024035', '$2a$10$8GlurFZEJepIw8iQvKX2eezSIRK9ASoGnSKznnderdOmRlkM4Li42', 'Mona Sen', 'mona.s@student.mms.edu', 1);

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
-- Batch 1 (CSE-2024-A) - Mentor 1 (Dr. Ramesh Sharma) - Exactly 20 Mentees (IDs: 1 to 20)
-- 6 Bright, 10 Average, 4 Weak
(1, 6, 'URN2024001', 'CSE-01', 'Computer Engineering', 'A', 5, '9876543201', 1, 'Bright'),
(2, 7, 'URN2024002', 'CSE-02', 'Computer Engineering', 'A', 5, '9876543202', 1, 'Average'),
(3, 8, 'URN2024003', 'CSE-03', 'Computer Engineering', 'A', 5, '9876543203', 1, 'Weak'),
(4, 9, 'URN2024004', 'CSE-04', 'Computer Engineering', 'A', 5, '9876543204', 1, 'Average'),
(5, 10, 'URN2024005', 'CSE-05', 'Computer Engineering', 'A', 5, '9876543205', 1, 'Bright'),
(6, 11, 'URN2024006', 'CSE-06', 'Computer Engineering', 'A', 5, '9876543206', 1, 'Average'),
(7, 12, 'URN2024007', 'CSE-07', 'Computer Engineering', 'A', 5, '9876543207', 1, 'Weak'),
(8, 13, 'URN2024008', 'CSE-08', 'Computer Engineering', 'A', 5, '9876543208', 1, 'Average'),
(9, 14, 'URN2024009', 'CSE-09', 'Computer Engineering', 'A', 5, '9876543209', 1, 'Bright'),
(10, 15, 'URN2024010', 'CSE-10', 'Computer Engineering', 'A', 5, '9876543210', 1, 'Average'),
(11, 16, 'URN2024011', 'CSE-11', 'Computer Engineering', 'A', 5, '9876543211', 1, 'Bright'),
(12, 17, 'URN2024012', 'CSE-12', 'Computer Engineering', 'A', 5, '9876543212', 1, 'Weak'),
(13, 18, 'URN2024013', 'CSE-13', 'Computer Engineering', 'A', 5, '9876543213', 1, 'Average'),
(14, 19, 'URN2024014', 'CSE-14', 'Computer Engineering', 'A', 5, '9876543214', 1, 'Average'),
(15, 20, 'URN2024015', 'CSE-15', 'Computer Engineering', 'A', 5, '9876543215', 1, 'Bright'),
(16, 21, 'URN2024016', 'CSE-16', 'Computer Engineering', 'A', 5, '9876543216', 1, 'Average'),
(17, 22, 'URN2024017', 'CSE-17', 'Computer Engineering', 'A', 5, '9876543217', 1, 'Weak'),
(18, 23, 'URN2024018', 'CSE-18', 'Computer Engineering', 'A', 5, '9876543218', 1, 'Average'),
(19, 24, 'URN2024019', 'CSE-19', 'Computer Engineering', 'A', 5, '9876543219', 1, 'Bright'),
(20, 25, 'URN2024020', 'CSE-20', 'Computer Engineering', 'A', 5, '9876543220', 1, 'Average'),

-- Batch 2 (CSE-2024-B) - Mentor 2 (Prof. Sunita Patil) - (IDs: 21 to 25)
(21, 26, 'URN2024021', 'CSE-21', 'Computer Engineering', 'B', 5, '9876543221', 2, 'Average'),
(22, 27, 'URN2024022', 'CSE-22', 'Computer Engineering', 'B', 5, '9876543222', 2, 'Bright'),
(23, 28, 'URN2024023', 'CSE-23', 'Computer Engineering', 'B', 5, '9876543223', 2, 'Weak'),
(24, 29, 'URN2024024', 'CSE-24', 'Computer Engineering', 'B', 5, '9876543224', 2, 'Average'),
(25, 30, 'URN2024025', 'CSE-25', 'Computer Engineering', 'B', 5, '9876543225', 2, 'Bright'),

-- Batch 3 (ECE-2024-A) - Mentor 3 (Dr. Amit Verma) - (IDs: 26 to 30)
(26, 31, 'URN2024026', 'ECE-01', 'Electronics & Telecom', 'A', 5, '9876543226', 3, 'Bright'),
(27, 32, 'URN2024027', 'ECE-02', 'Electronics & Telecom', 'A', 5, '9876543227', 3, 'Weak'),
(28, 33, 'URN2024028', 'ECE-03', 'Electronics & Telecom', 'A', 5, '9876543228', 3, 'Average'),
(29, 34, 'URN2024029', 'ECE-04', 'Electronics & Telecom', 'A', 5, '9876543229', 3, 'Average'),
(30, 35, 'URN2024030', 'ECE-05', 'Electronics & Telecom', 'A', 5, '9876543230', 3, 'Bright'),

-- Batch 4 (IT-2024-A) - Mentor 4 (Prof. Neha Gupta) - (IDs: 31 to 35)
(31, 36, 'URN2024031', 'IT-01', 'Information Tech', 'A', 5, '9876543231', 4, 'Average'),
(32, 37, 'URN2024032', 'IT-02', 'Information Tech', 'A', 5, '9876543232', 4, 'Weak'),
(33, 38, 'URN2024033', 'IT-03', 'Information Tech', 'A', 5, '9876543233', 4, 'Average'),
(34, 39, 'URN2024034', 'IT-04', 'Information Tech', 'A', 5, '9876543234', 4, 'Bright'),
(35, 40, 'URN2024035', 'IT-05', 'Information Tech', 'A', 5, '9876543235', 4, 'Average');

-- 6. Insert Academic Records
INSERT INTO academic_records (id, student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag) VALUES
-- Batch 1 (IDs: 1 - 20)
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
(20, 20, 5, 7.00, 81.50, 16.0, 21.0, 50.5, 0, 0),

-- Batch 2 (IDs: 21 - 25)
(21, 21, 5, 7.35, 82.50, 16.5, 21.5, 51.5, 0, 0),
(22, 22, 5, 8.95, 93.00, 19.5, 27.5, 63.0, 0, 0),
(23, 23, 5, 5.30, 61.00, 11.0, 13.5, 37.0, 2, 1),
(24, 24, 5, 7.05, 80.50, 16.0, 20.5, 50.0, 0, 0),
(25, 25, 5, 9.15, 95.50, 20.0, 28.5, 66.0, 0, 0),

-- Batch 3 (IDs: 26 - 30)
(26, 26, 5, 9.25, 96.50, 20.0, 29.5, 68.0, 0, 0),
(27, 27, 5, 5.45, 63.00, 11.5, 14.5, 39.0, 2, 1),
(28, 28, 5, 7.15, 81.00, 16.0, 21.0, 51.0, 0, 0),
(29, 29, 5, 6.85, 78.00, 15.0, 19.0, 48.0, 0, 0),
(30, 30, 5, 8.85, 92.00, 19.0, 26.5, 62.0, 0, 0),

-- Batch 4 (IDs: 31 - 35)
(31, 31, 5, 7.45, 83.50, 17.0, 22.0, 53.0, 0, 0),
(32, 32, 5, 5.15, 59.00, 10.5, 12.5, 35.0, 3, 1),
(33, 33, 5, 6.95, 79.50, 15.0, 19.5, 49.0, 0, 0),
(34, 34, 5, 9.05, 94.50, 19.5, 28.5, 65.0, 0, 0),
(35, 35, 5, 7.25, 82.00, 16.5, 21.5, 52.0, 0, 0);

-- 7. Insert Activities (Realistic achievements across categories)
INSERT INTO activities (id, student_id, title, category, description, date_achieved, evidence_url, status) VALUES
(1, 1, 'NPTEL Cloud Computing Certification', 'NPTEL', 'Completed course with Elite Gold status', '2024-04-15', 'nptel_cert.pdf', 'Approved'),
(2, 1, 'Smart India Hackathon Finalist', 'Software / Certification', 'Built IoT prototype for smart campus', '2024-03-10', 'sih_cert.pdf', 'Approved'),
(3, 1, 'Web Development MERN Stack Workshop', 'Workshop', 'Attended 3-day hands-on MERN stack training', '2024-02-20', 'mern_workshop.pdf', 'Pending'),
(4, 2, 'College Sports Football Captain', 'Sports', 'Led department football team to finals', '2024-01-25', 'sports_cert.pdf', 'Approved'),
(5, 5, 'AI Research Internship', 'Internship', 'Machine Learning research intern at Tech Corp', '2024-07-01', 'internship_letter.pdf', 'Approved'),
(6, 5, 'IEEE Conference Paper on Transformers', 'Publication', 'Published paper on lightweight transformer models', '2024-05-18', 'ieee_paper.pdf', 'Approved'),
(7, 6, 'Classical Dance Solo Competition 1st Prize', 'Cultural', 'Won first prize in annual inter-college cultural fest', '2024-02-12', 'dance_cert.pdf', 'Approved'),
(8, 8, 'National Coding Contest Runner-Up', 'Competition', 'Secured 2nd rank in National CodeQuest 2024', '2024-03-22', 'codequest.pdf', 'Approved'),
(9, 9, 'AWS Certified Solutions Architect', 'Software / Certification', 'Earned official AWS Associate certificate', '2024-06-10', 'aws_cert.pdf', 'Approved'),
(10, 9, 'NPTEL Deep Learning Certification', 'NPTEL', 'Completed 12-week course with 88% score', '2024-04-20', 'nptel_dl.pdf', 'Approved'),
(11, 11, 'Google Summer of Code Mentee', 'Internship', 'Contributed to open source machine learning tooling', '2024-07-15', 'gsoc_cert.pdf', 'Approved'),
(12, 11, 'State Level Chess Championship Winner', 'Sports', 'Gold medalist in inter-university chess tournament', '2024-01-30', 'chess_gold.pdf', 'Approved'),
(13, 13, 'Cyber Security Ethical Hacking Workshop', 'Workshop', 'Completed 5-day network defense and penetration testing bootcamp', '2024-03-05', 'cyber_cert.pdf', 'Approved'),
(14, 15, 'International Journal Paper on Cyber-Physical Systems', 'Publication', 'Published paper in Scopus-indexed journal', '2024-06-25', 'journal_paper.pdf', 'Approved'),
(15, 16, 'Annual Drama Fest Best Director Award', 'Cultural', 'Directed the winning one-act play in youth festival', '2024-02-28', 'drama_award.pdf', 'Approved'),
(16, 18, 'Blood Donation Camp Student Lead', 'Extra-curricular', 'Organized campus-wide blood donation drive with 250+ donors', '2024-04-02', 'nss_letter.pdf', 'Approved'),
(17, 19, 'Microsoft Certified Azure AI Engineer', 'Software / Certification', 'Passed AI-102 Associate certification exam', '2024-05-30', 'azure_ai.pdf', 'Approved'),
(18, 19, 'NPTEL Data Science for Engineers', 'NPTEL', 'Earned Elite certificate with 85% score', '2024-04-18', 'nptel_ds.pdf', 'Approved');

-- 8. Insert Complaints (Realistic Batch 1 student issues)
INSERT INTO complaints (id, student_id, title, description, category, status, mentor_response, created_at) VALUES
(1, 1, 'Difficulty in Machine Learning Subject', 'Need additional remedial classes and doubt solving sessions for ML algorithms.', 'Academic', 'In Progress', 'Scheduled remedial doubt session for next Tuesday at 4 PM.', '2024-08-10 10:30:00'),
(2, 3, 'Request for Lab Equipment Maintenance', 'System #14 in Lab 3 crashes during deep learning compilation.', 'Infrastructure', 'Pending', NULL, '2024-08-12 11:15:00'),
(3, 7, 'Attendance Discrepancy in Computer Networks', 'Was present on Aug 12 but marked absent in attendance register.', 'Academic', 'Resolved', 'Verified with subject faculty and corrected in attendance portal.', '2024-08-05 14:00:00'),
(4, 17, 'Mental Stress and Exam Anxiety Counseling', 'Finding it stressful balancing 5 subjects and backlog preparations.', 'Personal', 'In Progress', 'Referred to student counseling cell and scheduled weekly review.', '2024-08-14 16:45:00'),
(5, 21, 'Library Access Issue', 'Reference books for Signals & Systems are not available in library.', 'Infrastructure', 'Pending', NULL, '2024-08-15 10:00:00');

-- 9. Insert Meetings
INSERT INTO meetings (id, batch_id, mentor_id, meeting_number, meeting_date, mode, agenda, discussion, findings, assignment, remarks, status, created_at) VALUES
(1, 1, 1, 1, '2024-08-01 11:00:00', 'Offline / Seminar Hall 2', 'Semester Opening & Attendance Warning', 'Discussed 75% attendance rule and ISE/MSE exam pattern.', 'Most students satisfied, 3 students flagged for attendance concerns.', 'Submit mini-project proposal by Aug 20.', 'Counseled defaulter students.', 'Completed', '2024-08-01 12:00:00'),
(2, 1, 1, 2, '2024-08-28 14:00:00', 'Offline / Lab 4', 'Mid-Term Progress Review & Guidance', 'Reviewing ISE performance, lab submissions, and NPTEL certifications.', 'Assigned peer tutors for weak mentees.', 'Complete NPTEL assignment 3 and submit rough code.', 'Active participation observed.', 'Completed', '2024-08-15 15:00:00'),
(3, 2, 2, 1, '2024-08-05 10:30:00', 'Offline / Room 302', 'Mentorship Intro & Remedial Planning', 'General mentorship orientation and career counseling.', 'Mapped student interests.', 'Prepare resume drafts.', 'Completed meeting.', 'Completed', '2024-08-05 11:30:00');

-- 10. Insert Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES
(1, 6, 'Activity Approved', 'Your activity "NPTEL Cloud Computing Certification" was approved by Dr. Ramesh Sharma.', 'Success', 0, '2024-08-16 09:00:00'),
(2, 6, 'Meeting Scheduled', 'New mentoring meeting #2 scheduled for Aug 28, 2:00 PM in Lab 4.', 'Info', 0, '2024-08-15 15:00:00'),
(3, 6, 'Complaint Response Updated', 'Dr. Ramesh Sharma updated response for "Difficulty in Machine Learning Subject".', 'Warning', 0, '2024-08-14 11:30:00'),
(4, 6, 'Mentor Advice Added', 'New guidance note added: Focus on DBMS lab submissions and complete NPTEL credits.', 'Info', 1, '2024-08-10 16:00:00');

-- 11. Insert Attendance
-- Meeting 1 (Batch 1: All 20 students: 17 Present, 3 Absent [CSE-03, CSE-07, CSE-12])
INSERT INTO attendance (id, meeting_id, student_id, status, remarks) VALUES
(1, 1, 1, 'Present', 'Attended on time'),
(2, 1, 2, 'Present', 'Attended on time'),
(3, 1, 3, 'Absent', 'Makeup exam'),
(4, 1, 4, 'Present', 'Attended on time'),
(5, 1, 5, 'Present', 'Attended on time'),
(6, 1, 6, 'Present', 'Attended on time'),
(7, 1, 7, 'Absent', 'Medical leave'),
(8, 1, 8, 'Present', 'Attended on time'),
(9, 1, 9, 'Present', 'Attended on time'),
(10, 1, 10, 'Present', 'Attended on time'),
(11, 1, 11, 'Present', 'Attended on time'),
(12, 1, 12, 'Absent', 'Family emergency'),
(13, 1, 13, 'Present', 'Attended on time'),
(14, 1, 14, 'Present', 'Attended on time'),
(15, 1, 15, 'Present', 'Attended on time'),
(16, 1, 16, 'Present', 'Attended on time'),
(17, 1, 17, 'Present', 'Attended on time'),
(18, 1, 18, 'Present', 'Attended on time'),
(19, 1, 19, 'Present', 'Attended on time'),
(20, 1, 20, 'Present', 'Attended on time'),

-- Meeting 2 (Batch 1: All 20 students: 18 Present, 2 Absent [CSE-03, CSE-17])
(21, 2, 1, 'Present', 'Attended on time'),
(22, 2, 2, 'Present', 'Attended on time'),
(23, 2, 3, 'Absent', 'Sick leave'),
(24, 2, 4, 'Present', 'Attended on time'),
(25, 2, 5, 'Present', 'Attended on time'),
(26, 2, 6, 'Present', 'Attended on time'),
(27, 2, 7, 'Present', 'Attended on time'),
(28, 2, 8, 'Present', 'Attended on time'),
(29, 2, 9, 'Present', 'Attended on time'),
(30, 2, 10, 'Present', 'Attended on time'),
(31, 2, 11, 'Present', 'Attended on time'),
(32, 2, 12, 'Present', 'Attended on time'),
(33, 2, 13, 'Present', 'Attended on time'),
(34, 2, 14, 'Present', 'Attended on time'),
(35, 2, 15, 'Present', 'Attended on time'),
(36, 2, 16, 'Present', 'Attended on time'),
(37, 2, 17, 'Absent', 'NSS duty'),
(38, 2, 18, 'Present', 'Attended on time'),
(39, 2, 19, 'Present', 'Attended on time'),
(40, 2, 20, 'Present', 'Attended on time'),

-- Meeting 3 (Batch 2: Students 21 to 25: 4 Present, 1 Absent [CSE-23])
(41, 3, 21, 'Present', 'Attended on time'),
(42, 3, 22, 'Present', 'Attended on time'),
(43, 3, 23, 'Absent', 'Medical leave'),
(44, 3, 24, 'Present', 'Attended on time'),
(45, 3, 25, 'Present', 'Attended on time');
