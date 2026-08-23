# AI-Driven Mentor-Mentee Management System (40% MVP Milestone)

An academic mini-project web application built to streamline faculty-student mentoring, batch allocations, academic tracking, complaint registration, and machine learning-driven risk assessment.

---

## 1. Project Overview
This 40% MVP milestone delivers a fully functional, demonstrable academic platform featuring:
- **Authentication**: JWT authentication with bcrypt password hashing and automatic role routing.
- **Role-Based Portals**:
  - **Admin**: Dashboard, Mentor Management, Student Directory, Batch Creation & Mentor Allocation.
  - **Student**: Profile View, Mentor Contact, Academic Performance Tracking, Activities & Complaint Submission.
  - **Mentor**: Batch Dashboard, Mentee Roster, Student Profiles (with strict batch isolation enforcement), Complaints Tracker, Meeting Logs & ML Risk Assessment Overview.
- **Machine Learning Baseline**: Standalone Python module for synthetic dataset preprocessing, exploratory data analysis (EDA), and Logistic Regression baseline classification.

---

## 2. Technology Stack

### Frontend
- **HTML5** & **Tailwind CSS** (via CDN + custom CSS design tokens)
- **Vanilla JavaScript** & **Fetch API**

### Backend
- **Node.js** & **Express.js**
- **Database**: MySQL 8.0 (with SQLite fallback via `better-sqlite3` in `config/db.js`)
- **Database Access**: `mysql2/promise` with parameterized SQL queries
- **Authentication**: `jsonwebtoken` (JWT) & `bcryptjs`

### Machine Learning
- **Python 3.13**
- `pandas`, `numpy`, `scikit-learn`, `matplotlib`, `seaborn`

---

## 3. Project Folder Structure

```
mentor-mentee-system/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool with SQLite fallback
│   ├── controllers/
│   │   ├── admin.controller.js   # Admin operations & stats
│   │   ├── auth.controller.js    # Authentication & JWT generation
│   │   ├── mentor.controller.js   # Mentor batch operations & isolation
│   │   └── student.controller.js  # Student profile & complaints
│   ├── middleware/
│   │   ├── auth.js               # JWT verification middleware
│   │   └── role.js               # Role authorization middleware
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── mentor.routes.js
│   │   └── student.routes.js
│   ├── utils/
│   │   └── logger.js
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Express server entry point
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
│   │   ├── class_distribution.png
│   │   ├── correlation_heatmap.png
│   │   └── confusion_matrix.png
│   ├── data_preprocessing.py     # Missing value imputation, One-Hot, Scaling, EDA
│   ├── baseline_model.py         # Stratified 80/20 split & Logistic Regression
│   └── README.md
│
├── database/
│   ├── schema.sql                # 9 relational tables
│   └── seed.sql                  # Seed data for Admin, 4 Mentors, 4 Batches, 20 Students
│
├── docs/
│   ├── architecture.md           # Architecture documentation
│   ├── database.md               # ER diagrams & schema documentation
│   └── api.md                    # REST API specifications
│
├── .gitignore
├── implementation_plan_40_percent.md
└── README.md
```

---

## 4. Setup & Installation Instructions

### Step 1: Clone / Open Repository
Navigate to project directory:
```bash
cd "d:/New folder/MMS"
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

### Step 3: Database Setup
If using MySQL locally:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```
*Note: If local MySQL is locked or unconfigured, the backend automatically initializes an embedded SQLite database (`database/mentor_mentee.db`) with schema and seed data so the app runs out-of-the-box.*

### Step 4: Machine Learning Setup
Run data preprocessing and baseline model training:
```bash
python ml/data_preprocessing.py
python ml/baseline_model.py
```

---

## 5. How to Run the Application

### Start Node.js Backend Server:
```bash
cd backend
npm run dev
```

Open web browser to:
[http://localhost:5000/login.html](http://localhost:5000/login.html)

---

## 6. Test Demo Accounts for Viva

All demo accounts use password: `password123`

| Role | Username / Identifier | Password | Access / Scope |
|---|---|---|---|
| **ADMIN** | `admin@mms.edu` | `password123` | Full admin dashboard, mentors, students, batches |
| **MENTOR 1** | `MNT101` | `password123` | Dr. Ramesh Sharma — Batch `CSE-2024-A` (5 students) |
| **MENTOR 2** | `MNT102` | `password123` | Prof. Sunita Patil — Batch `CSE-2024-B` (5 students) |
| **STUDENT 1** | `URN2024001` | `password123` | Aarav Patel — Batch `CSE-2024-A` |
| **STUDENT 3** | `URN2024003` | `password123` | Rohan Mehta — Batch `CSE-2024-A` (Defaulter / Weak risk) |

*Quick-fill buttons on the login page allow single-click login for demonstration.*

---

## 7. Current 40% Milestone Limitations
- Meeting management is basic (view history and schedule date/agenda).
- ML module runs independently; model predictions are displayed via static demo contract placeholders in the mentor portal.
- Complaint status updates are view-only for mentors in this stage.

---

## 8. Next Milestones (Remaining 60%)
- **Random Forest Primary ML Model**, XGBoost & KNN comparison.
- **Model Persistence & Serving** via Flask / Node ML service API.
- **Floating / Common Agenda Automation** for batch meetings.
- **Complete Attendance Tracking & Excel Report Generation**.
- **Automated Recommendation Engine** for weak/defaulter mentees.
