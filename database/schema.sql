-- AI-Driven Mentor-Mentee Management System
-- Database Schema for Student Portal & System Integration
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
DROP TABLE IF EXISTS mentors;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users;

-- 1. Centralized Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('ADMIN', 'MENTOR', 'STUDENT') NOT NULL,
    identifier VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Admins Table
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    department VARCHAR(100) DEFAULT 'Computer Engineering',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Mentors Table
CREATE TABLE mentors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    mentor_code VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) DEFAULT 'Assistant Professor',
    phone VARCHAR(20) DEFAULT '9876543210',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Batches Table
CREATE TABLE batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    mentor_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Students Table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    urn VARCHAR(50) NOT NULL UNIQUE,
    roll_no VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    division VARCHAR(10) NOT NULL,
    semester INT DEFAULT 5,
    phone VARCHAR(20) DEFAULT '9876543210',
    batch_id INT NULL,
    ml_risk_level ENUM('Bright', 'Average', 'Weak', 'Pending') DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Academic Records Table
CREATE TABLE academic_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    semester INT NOT NULL DEFAULT 5,
    cgpa DECIMAL(3,2) NOT NULL DEFAULT 7.50,
    attendance_percentage DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    ise_marks DECIMAL(5,2) DEFAULT 18.00,
    mse_marks DECIMAL(5,2) DEFAULT 22.00,
    ese_marks DECIMAL(5,2) DEFAULT 55.00,
    subjects_failed_count INT DEFAULT 0,
    defaulter_flag TINYINT(1) DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Student Activities Table
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    date_achieved DATE,
    evidence_url VARCHAR(255) DEFAULT 'certificate_sample.pdf',
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Student Complaints Table
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Academic',
    status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
    mentor_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Batch Meetings Table
CREATE TABLE meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    mentor_id INT NOT NULL,
    meeting_number INT DEFAULT 1,
    meeting_date DATETIME NOT NULL,
    mode VARCHAR(50) DEFAULT 'Offline / Seminar Hall',
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

-- 10. Student Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'Info',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
