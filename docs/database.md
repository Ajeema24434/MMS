# Database Documentation - AI-Driven Mentor-Mentee Management System

## Entity Relationship Overview

The database uses normalized 3NF relational tables centered around a unified `users` table.

```
                    +--------------------+
                    |       users        |
                    +--------------------+
                    | PK  id             |
                    |     role           |
                    |     identifier     |
                    |     password_hash  |
                    |     name           |
                    |     email          |
                    +---------+----------+
                              |
       +----------------------+----------------------+
       | 1:1                  | 1:1                  | 1:1
       v                      v                      v
+--------------+       +--------------+       +--------------+
|    admins    |       |   mentors    |       |   students   |
+--------------+       +--------------+       +--------------+
| PK  id       |       | PK  id       |       | PK  id       |
| FK  user_id  |       | FK  user_id  |       | FK  user_id  |
+--------------+       |     code     |       |     urn      |
                       +------+-------+       | FK  batch_id |
                              |               +---+---+--+---+
                              | 1:N               |   |  |
                              v                   |   |  | 1:N
                       +--------------+           |   |  v
                       |   batches    |<----------+   | +------------------+
                       +--------------+ 1:N           | | academic_records |
                       | PK  id       |               | +------------------+
                       | FK  mentor_id|               | | PK id            |
                       +------+-------+               | | FK student_id    |
                              |                       | +------------------+
                              | 1:N                   v
                              v                +--------------+
                       +--------------+        |  activities  |
                       |   meetings   |        +--------------+
                       +--------------+        | PK id        |
                       | PK  id       |        | FK student_id|
                       | FK  batch_id |        +--------------+
                       | FK  mentor_id|               v
                       +--------------+        +--------------+
                                               |  complaints  |
                                               +--------------+
                                               | PK id        |
                                               | FK student_id|
                                               +--------------+
```

---

## Schema Definitions

### 1. `users` Table
Central authentication table for all platform users.
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `role` (ENUM: `'ADMIN'`, `'MENTOR'`, `'STUDENT'`)
- `identifier` (VARCHAR(100) UNIQUE) — Admin email, Mentor Code, or Student URN
- `password_hash` (VARCHAR(255)) — Bcrypt hash
- `name` (VARCHAR(100))
- `email` (VARCHAR(100))
- `is_active` (TINYINT(1) DEFAULT 1)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### 2. `admins` Table
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `user_id` (INT UNIQUE FK -> `users(id)` ON DELETE CASCADE)
- `department` (VARCHAR(100))

### 3. `mentors` Table
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `user_id` (INT UNIQUE FK -> `users(id)` ON DELETE CASCADE)
- `mentor_code` (VARCHAR(50) UNIQUE)
- `department` (VARCHAR(100))
- `designation` (VARCHAR(100))
- `phone` (VARCHAR(20))

### 4. `batches` Table
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `name` (VARCHAR(100) UNIQUE)
- `department` (VARCHAR(100))
- `academic_year` (VARCHAR(20))
- `mentor_id` (INT NULL FK -> `mentors(id)` ON DELETE SET NULL)
- `created_at` (TIMESTAMP)

### 5. `students` Table
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `user_id` (INT UNIQUE FK -> `users(id)` ON DELETE CASCADE)
- `urn` (VARCHAR(50) UNIQUE)
- `roll_no` (VARCHAR(50))
- `department` (VARCHAR(100))
- `division` (VARCHAR(10))
- `batch_id` (INT NULL FK -> `batches(id)` ON DELETE SET NULL)
- `ml_risk_level` (ENUM: `'Bright'`, `'Average'`, `'Weak'`, `'Pending'`)

### 6. `academic_records` Table
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `student_id` (INT FK -> `students(id)` ON DELETE CASCADE)
- `semester` (INT)
- `cgpa` (DECIMAL(3,2))
- `attendance_percentage` (DECIMAL(5,2))
- `ise_marks` (DECIMAL(5,2))
- `mse_marks` (DECIMAL(5,2))
- `ese_marks` (DECIMAL(5,2))
- `subjects_failed_count` (INT)
- `defaulter_flag` (TINYINT(1))

### 7. `activities` Table
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `student_id` (INT FK -> `students(id)` ON DELETE CASCADE)
- `title` (VARCHAR(200))
- `category` (VARCHAR(100))
- `description` (TEXT)
- `date_achieved` (DATE)

### 8. `complaints` Table
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `student_id` (INT FK -> `students(id)` ON DELETE CASCADE)
- `title` (VARCHAR(200))
- `description` (TEXT)
- `category` (VARCHAR(100))
- `status` (ENUM: `'Pending'`, `'In Progress'`, `'Resolved'`)
- `created_at` (TIMESTAMP)

### 9. `meetings` Table
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `batch_id` (INT FK -> `batches(id)` ON DELETE CASCADE)
- `mentor_id` (INT FK -> `mentors(id)` ON DELETE CASCADE)
- `meeting_date` (DATETIME)
- `agenda` (TEXT)
- `remarks` (TEXT)
- `created_at` (TIMESTAMP)
