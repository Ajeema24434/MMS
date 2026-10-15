-- AI-Driven Mentor-Mentee Management System
-- Database Schema for AI & DS Department
-- Database: mentor_mentee

CREATE DATABASE IF NOT EXISTS mentor_mentee;
USE mentor_mentee;

-- Drop tables if exists in reverse dependency order
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS meetings;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS academic_records;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS divisions;
DROP TABLE IF EXISTS mentors;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users;

-- 1. Centralized Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('ADMIN', 'MENTOR', 'STUDENT') NOT NULL,
    identifier VARCHAR(100) NOT NULL UNIQUE, -- Student URN (10260910nn FY, 10250910nn SY, etc.), mentor code for mentors, email for admins
    password_hash VARCHAR(255) NOT NULL,
    initial_password VARCHAR(255) NULL, -- Generated initial password for PDF credential export
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Admins Table (AI & DS Department)
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    department VARCHAR(100) DEFAULT 'AI & DS',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Mentors Table (AI & DS Department)
CREATE TABLE mentors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    mentor_code VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL DEFAULT 'AI & DS',
    designation VARCHAR(100) DEFAULT 'Assistant Professor',
    phone VARCHAR(20) DEFAULT '9876543210',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Divisions Table (AI & DS - 4 Years, Manual Addition Supported)
CREATE TABLE divisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department VARCHAR(100) NOT NULL DEFAULT 'AI & DS',
    year INT NOT NULL, -- 1 = FY, 2 = SY, 3 = TY, 4 = BTECH
    name VARCHAR(50) NOT NULL, -- e.g. 'A', 'B'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (department, year, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Batches Table (4 Batches per Class / Division)
CREATE TABLE batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL DEFAULT 'AI & DS',
    academic_year VARCHAR(20) NOT NULL DEFAULT '2024-2025',
    year INT NULL, -- 1, 2, 3, 4
    division VARCHAR(50) NULL, -- 'A', 'B', etc.
    mentor_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Students Table (AI & DS Department)
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    urn VARCHAR(50) NOT NULL UNIQUE, -- 8-character unique student user ID
    roll_no VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'AI & DS',
    year INT DEFAULT 1, -- 1, 2, 3, 4
    division VARCHAR(10) NOT NULL DEFAULT 'A',
    semester INT DEFAULT 1,
    phone VARCHAR(20) DEFAULT '9876543210',
    batch_id INT NULL,
    ml_risk_level ENUM('Bright', 'Average', 'Weak', 'Pending') DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Academic Records Table
CREATE TABLE academic_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    semester INT NOT NULL DEFAULT 1,
    cgpa DECIMAL(3,2) NOT NULL DEFAULT 7.50,
    attendance_percentage DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    ise_marks DECIMAL(5,2) DEFAULT 18.00,
    mse_marks DECIMAL(5,2) DEFAULT 22.00,
    ese_marks DECIMAL(5,2) DEFAULT 55.00,
    subjects_failed_count INT DEFAULT 0,
    defaulter_flag TINYINT(1) DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Student Activities Table
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    date_achieved DATE,
    evidence_url VARCHAR(255) DEFAULT 'certificate.pdf',
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Approved',
    mentor_remarks TEXT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Student Complaints Table
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Academic',
    status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
    mentor_response TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Meetings Table
CREATE TABLE meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    mentor_id INT NOT NULL,
    meeting_number INT DEFAULT 1,
    meeting_date DATETIME NOT NULL,
    mode VARCHAR(50) DEFAULT 'Offline',
    agenda TEXT NOT NULL,
    discussion TEXT,
    findings TEXT,
    assignment TEXT,
    remarks TEXT,
    status VARCHAR(50) DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10.1 Meeting Attendees & Attendance Tracking Table
CREATE TABLE meeting_attendees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('Present', 'Absent') DEFAULT 'Present',
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_meeting_student (meeting_id, student_id),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Student Subject Attendance Table (Current Semester Subject-Wise Attendance)
CREATE TABLE student_subject_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    semester INT NOT NULL DEFAULT 5,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(150) NOT NULL,
    conducted_sessions INT NOT NULL DEFAULT 36,
    attended_sessions INT NOT NULL DEFAULT 30,
    attendance_percentage DECIMAL(5,2) NOT NULL DEFAULT 83.33,
    remarks VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_sem_subject (student_id, semester, subject_code),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

