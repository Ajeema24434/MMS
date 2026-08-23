# 40% MVP IMPLEMENTATION PLAN
## AI-DRIVEN MENTOR-MENTEE MANAGEMENT SYSTEM

### 1. Existing Repository Audit
- **Workspace**: `d:\New folder\MMS`
- **Existing files**: `SRS/` folder containing reference images, Word documentation (`Mentor_Mentee_System_Report.docx`), and Excel mentee reports.
- **Node.js**: Installed (`v24.11.1`)
- **Python**: Installed (`3.13.5`) with pandas, numpy, scikit-learn, matplotlib, seaborn available.
- **MySQL**: Installed (`8.0.45`)

### 2. Architecture & Components
- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0 with `mysql2/promise` pool
- **Auth**: JWT + bcryptjs hashing
- **Frontend**: HTML5 + Tailwind CSS + Vanilla JS Fetch API
- **ML**: Standalone Python module (Preprocessing, EDA, Logistic Regression baseline)

### 3. Database Schema
- `users`: id, role (ADMIN, MENTOR, STUDENT), identifier, password_hash, name, email, is_active, created_at
- `admins`: id, user_id, department
- `mentors`: id, user_id, mentor_code, department, designation, phone
- `batches`: id, name, department, academic_year, mentor_id, created_at
- `students`: id, user_id, urn, roll_no, department, division, batch_id, ml_risk_level
- `academic_records`: id, student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag
- `activities`: id, student_id, title, category, description, date_achieved
- `complaints`: id, student_id, title, description, category, status, created_at
- `meetings`: id, batch_id, mentor_id, meeting_date, agenda, remarks, created_at

### 4. API Endpoints
- **Auth**: `POST /api/auth/login`
- **Admin**:
  - `GET /api/admin/dashboard`
  - `GET /api/admin/mentors`, `POST /api/admin/mentors`, `GET /api/admin/mentors/:id`, `PUT /api/admin/mentors/:id`
  - `GET /api/admin/students`, `POST /api/admin/students`, `GET /api/admin/students/:id`, `PUT /api/admin/students/:id`, `PATCH /api/admin/students/:id/batch`
  - `GET /api/admin/batches`, `POST /api/admin/batches`, `PUT /api/admin/batches/:id`, `POST /api/admin/batches/:id/assign-mentor`
- **Student**:
  - `GET /api/student/dashboard`, `GET /api/student/profile`, `GET /api/student/academic`, `GET /api/student/activities`, `GET /api/student/complaints`, `POST /api/student/complaints`
- **Mentor**:
  - `GET /api/mentor/dashboard`, `GET /api/mentor/students`, `GET /api/mentor/students/:id`, `GET /api/mentor/complaints`, `GET /api/mentor/meetings`, `POST /api/mentor/meetings`, `GET /api/mentor/ml-summary`

### 5. Machine Learning baseline
- Dataset: `ml/data/student_risk_dataset.csv` (18 mock records)
- Scripts: `ml/data_preprocessing.py`, `ml/baseline_model.py`
- Visualizations: `ml/plots/class_distribution.png`, `ml/plots/correlation_heatmap.png`, `ml/plots/confusion_matrix.png`
- Rationale: Decoupled Logistic Regression baseline for 40% stage demonstration.

### 6. File Structure To Be Built
```
d:\New folder\MMS\
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── mentor.controller.js
│   │   └── student.controller.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── role.js
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── mentor.routes.js
│   │   └── student.routes.js
│   ├── utils/logger.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   ├── api.md
│   ├── architecture.md
│   └── database.md
├── frontend/
│   ├── admin/
│   │   ├── batches.html
│   │   ├── dashboard.html
│   │   ├── mentors.html
│   │   └── students.html
│   ├── assets/
│   │   ├── css/style.css
│   │   └── js/
│   │       ├── admin.js
│   │       ├── api.js
│   │       ├── auth.js
│   │       ├── mentor.js
│   │       └── student.js
│   ├── mentor/
│   │   ├── dashboard.html
│   │   └── student.html
│   ├── student/
│   │   └── dashboard.html
│   ├── index.html
│   └── login.html
├── ml/
│   ├── data/student_risk_dataset.csv
│   ├── plots/
│   ├── baseline_model.py
│   ├── data_preprocessing.py
│   └── README.md
├── .gitignore
├── implementation_plan_40_percent.md
└── README.md
```
