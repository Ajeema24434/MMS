# AI-Driven Mentor-Mentee Management System (MMS)

An academic mini-project web application built to streamline faculty-student mentoring, batch allocations, academic tracking, complaint registration, automatic Excel report generation, and machine learning-driven risk assessment.

---

## 1. Project Overview
This project delivers a fully functional, demonstrable academic platform featuring:
- **Authentication**: JWT authentication with bcrypt password hashing, 3-role switcher tabs (Student, Mentor, Admin), and Forgot Password OTP flow.
- **Role-Based Portals**:
  - **Admin**: Dashboard, Mentor Management, Student Directory, Batch Creation & Mentor Allocation.
  - **Student**: Profile View, Mentor Contact, Academic Performance Tracking, Co-curricular Activities Submission, Complaint Registration, and Complete Printable Report.
  - **Mentor**: Batch Dashboard, Mentee Roster (with strict batch isolation enforcement), Common Meeting Agenda Creation (applies to all mentees in batch), Complaints Resolution Tracker, and Performance Risk Classification.
  - **Automatic Excel Reports (Sakshi Module)**: Streams 4 official college Excel `.xlsx` reports matching exact college formats (`MENTORING REPORT`, `Academic Progress`, `Students Progress Report`, `ANALYSIS OF MENTEES`).
- **Machine Learning Baseline**: Standalone Python module for synthetic dataset preprocessing, exploratory data analysis (EDA), and Logistic Regression baseline classification.

---

## 2. Technology Stack

### Frontend
- **HTML5** & **Tailwind CSS** (via CDN + custom CSS design tokens)
- **Vanilla JavaScript** & **Fetch API**

### Backend
- **Node.js** & **Express.js**
- **Database**: MySQL 8.0 (with automatic SQLite fallback via `better-sqlite3` in `config/db.js`)
- **Excel Engine**: `exceljs` for streaming binary `.xlsx` reports
- **Authentication**: `jsonwebtoken` (JWT) & `bcryptjs`

### Machine Learning
- **Python 3.13**
- `pandas`, `numpy`, `scikit-learn`, `matplotlib`, `seaborn`

---

## 3. Project Folder Structure

```
MMS/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool with SQLite fallback
│   ├── controllers/
│   │   ├── admin.controller.js   # Admin operations & stats
│   │   ├── auth.controller.js    # Authentication & JWT generation
│   │   ├── mentor.controller.js   # Mentor batch operations & Excel report streaming
│   │   └── student.controller.js  # Student profile, activities & complete report
│   ├── middleware/
│   │   ├── auth.js               # JWT verification middleware
│   │   └── role.js               # Role authorization middleware
│   ├── services/
│   │   └── excelReport.service.js # ExcelJS generation for Reports 1-4
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── mentor.routes.js
│   │   └── student.routes.js
│   ├── server.js                 # Express server entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── mentors.html
│   │   ├── students.html
│   │   └── batches.html
│   ├── student/
│   │   └── dashboard.html
│   ├── mentor/
│   │   ├── dashboard.html
│   │   └── student.html
│   └── assets/
│       ├── css/style.css
│       └── js/
│           ├── api.js
│           ├── auth.js
│           ├── admin.js
│           ├── student.js
│           └── mentor.js
│
├── ml/
│   ├── data/
│   │   ├── student_risk_dataset.csv
│   │   └── processed_student_dataset.csv
│   ├── plots/
│   ├── data_preprocessing.py     # Missing value imputation, One-Hot, Scaling, EDA
│   ├── baseline_model.py         # Stratified 80/20 split & Logistic Regression
│   └── README.md
│
├── database/
│   ├── schema.sql                # 9 relational tables
│   └── seed.sql                  # Seed data for Admin, Mentors, Batches, Students
│
├── SRS/                          # Software Requirements & College Excel Formats
│   └── Mentoring_Reports 2025 Even sem.xlsx
└── README.md
```

---

## 4. Setup & Installation Instructions

### Step 1: Clone Repository
```bash
git clone https://github.com/Ajeema24434/MMS.git
cd MMS
```

### Step 2: Backend Setup
Install Node dependencies:
```bash
cd backend
npm install
```

Create `.env` file (copied from `.env.example`):
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=mentor_mentee
JWT_SECRET=mms_super_secret_jwt_key_2026_academic_mvp
```

### Step 3: Run Application
Start Node backend server:
```bash
npm start
```

Open web browser to:
[http://localhost:5000/login.html](http://localhost:5000/login.html)

---

## 5. Demo Accounts

All demo accounts use password: `password123`

| Role | Username / Identifier | Password | Access / Scope |
|---|---|---|---|
| **ADMIN** | `admin@mms.edu` | `password123` | Full admin dashboard, mentors, students, batches |
| **MENTOR 1** | `MNT101` | `password123` | Dr. Ramesh Sharma — Batch `CSE-2024-A` (5 students) |
| **MENTOR 2** | `MNT102` | `password123` | Prof. Sunita Patil — Batch `CSE-2024-B` (5 students) |
| **STUDENT 1** | `CSE-01` or `URN2024001` | `password123` | Aarav Patel — Batch `CSE-2024-A` |
| **STUDENT 3** | `CSE-03` or `URN2024003` | `password123` | Rohan Mehta — Batch `CSE-2024-A` (Defaulter / Weak risk) |
