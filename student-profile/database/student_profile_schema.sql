-- ===================================================================
-- STUDENT PROFILE MODULE SCHEMA EXTENSIONS
-- ===================================================================

-- 1. Subject Marks Table (Semester-wise course performance)
CREATE TABLE IF NOT EXISTS subject_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    semester INT NOT NULL DEFAULT 5,
    subject VARCHAR(100) NOT NULL,
    internal_marks DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    exam_marks DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_marks DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    grade VARCHAR(10) NOT NULL DEFAULT 'P',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY uq_student_sem_sub (student_id, semester, subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Academic Records column extension
-- ALTER TABLE academic_records ADD COLUMN mentor_remarks TEXT NULL;

-- 3. Activity certificate metadata columns
-- ALTER TABLE activities ADD COLUMN original_filename VARCHAR(255) NULL;
-- ALTER TABLE activities ADD COLUMN file_size INT NULL;
-- ALTER TABLE activities ADD COLUMN reviewed_by INT NULL;
-- ALTER TABLE activities ADD COLUMN reviewed_at DATETIME NULL;
-- ALTER TABLE activities ADD COLUMN mentor_remarks TEXT NULL;