# System Architecture - AI-Driven Mentor-Mentee Management System (40% MVP)

## Architectural Design Overview
The system follows a standard 3-tier monolithic Web Application Architecture designed for academic simplicity, high maintainability, and clear viva explanations.

```
+-----------------------------------------------------------------------+
|                             PRESENTATION LAYER                        |
|                       (Frontend - HTML5 + Tailwind CSS + JS)          |
|  - login.html                                                         |
|  - admin/ (dashboard.html, mentors.html, students.html, batches.html) |
|  - student/ (dashboard.html)                                          |
|  - mentor/ (dashboard.html, student.html)                             |
+-----------------------------------+-----------------------------------+
                                    | REST APIs (JSON over HTTP)
                                    | JWT Bearer Token Header
                                    v
+-----------------------------------------------------------------------+
|                             APPLICATION LAYER                         |
|                         (Backend - Node.js & Express.js)              |
|  - middleware/auth.js (JWT Token Validator)                           |
|  - middleware/role.js (RBAC Authorization)                            |
|  - controllers/ (auth, admin, student, mentor)                        |
|  - Strict batch isolation logic for Mentors                           |
+-----------------------------------+-----------------------------------+
                                    | SQL Queries (mysql2 / sqlite3)
                                    v
+-----------------------------------------------------------------------+
|                              DATA LAYER                               |
|                         (MySQL / Relational Database)                 |
|  - users, admins, mentors, students, batches, academic_records,       |
|    activities, complaints, meetings                                   |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
|                         INDEPENDENT ML MODULE                         |
|                    (Python 3.13 + scikit-learn + pandas)              |
|  - Data preprocessing pipeline & Imputation                           |
|  - Exploratory Data Analysis & Plots Generation                       |
|  - Logistic Regression Baseline Model Evaluation                      |
+-----------------------------------------------------------------------+
```

---

## Component Specifications

### 1. Presentation Layer (Frontend)
- **Tech Stack**: HTML5, Tailwind CSS, Vanilla JavaScript, Fetch API.
- **Design Pattern**: Client-Side Rendering with asynchronous Fetch API calls.
- **Authentication Guard**: `assets/js/auth.js` verifies JWT presence and role permissions before rendering protected pages.

### 2. Application Layer (Backend)
- **Tech Stack**: Node.js, Express.js.
- **Security & Authorization**:
  - `bcryptjs`: Password hashing with 10 salt rounds.
  - `jsonwebtoken`: 24-hour expiring JWT tokens carrying user identity and role.
  - `middleware/role.js`: Strict Role-Based Access Control (RBAC).
  - **Batch Isolation**: Mentors are restricted to viewing students in their assigned batch. Cross-batch queries return `403 Forbidden`.

### 3. Data Layer (Database)
- **Tech Stack**: MySQL 8.0 / SQLite fallback (`config/db.js`).
- **Access Pattern**: Raw parameterized SQL queries preventing SQL injection vulnerabilities.

### 4. Machine Learning Module
- **Tech Stack**: Python 3.13, pandas, numpy, scikit-learn, matplotlib, seaborn.
- **Scope for 40% MVP**: Standalone execution (`ml/data_preprocessing.py`, `ml/baseline_model.py`) generating preprocessing summaries and baseline accuracy/confusion matrix plots.
