# Student Profile Module

**Module Name:** Student Profile & Mentee Management  
**Branch:** eature/student-profile  
**Parent Repository:** [Ajeema24434/MMS](https://github.com/Ajeema24434/MMS)

---

## 1. Overview

The **Student Profile Module** provides a comprehensive portal for students in the AI-Driven Mentor-Mentee Management System (MMS). It enables students to manage personal profile information, review verified academic performance, submit co-curricular activities with certificate proof, log grievances/complaints, view meeting schedules, interact with real-time notifications, and export full mentoring reports.

This module is completely isolated in the student-profile/ directory to ensure that no other team member's existing code or files are modified or overwritten.

---

## 2. Directory Structure

`
student-profile/
├── README.md                           # Comprehensive documentation & integration guide
├── components/
│   └── dashboard.html                  # Full interactive Student Portal & Profile interface
├── styles/
│   └── style.css                       # Student portal UI styling & custom utilities
├── assets/
│   └── js/
│       └── student.js                  # Client-side controller, chart rendering & API bindings
├── backend/
│   ├── controllers/
│   │   └── student.controller.js       # Student profile, academic, activities & report controller
│   ├── routes/
│   │   └── student.routes.js           # Protected Express API routes with JWT & role verification
│   └── middleware/
│       └── upload.js                   # Secure certificate upload middleware (magic-byte validation)
└── database/
    └── student_profile_schema.sql      # Schema additions (subject_marks table & activity fields)
`

---

## 3. Key Features

### 3.1. Profile Management
- **Personal Details**: View student identity (Name, Roll No, URN, Department, Division, Semester, Assigned Mentor, Batch).
- **Controlled Updates**: Securely update contact fields (email, phone number) with strict format validation.

### 3.2. Academic Records & Subject Performance
- Real-time academic tracking (CGPA, Attendance percentage, Internal & External marks).
- Subject-wise breakdown displaying internal scores, semester exam scores, total marks, and grades from subject_marks.
- Visual progress bar overview and academic standing indicators.

### 3.3. Co-Curricular & Extra-Curricular Activities
- Activity submission form with title, category, date, and description.
- **Certificate Evidence Upload**: Supports secure uploads of certificates (PDF, PNG, JPG, JPEG) up to 5 MB.
- **Secure File Validation**: Validates file headers/magic bytes to prevent disguised executable uploads.
- Download verified activity certificates directly from the dashboard.

### 3.4. Mentor Meetings & Observations
- View scheduled, upcoming, and completed mentor-mentee meetings.
- Review real faculty advice, guidance remarks, and action items.

### 3.5. Complaints & Grievance Tracking
- Submit complaints/queries with category classification.
- Real-time status tracking (Pending, In Review, Resolved) with faculty responses.

### 3.6. Notifications Feed
- Activity alerts, meeting announcements, and complaint resolution updates.
- Interactive **Mark as Read** and **Mark All as Read** endpoints.

### 3.7. Complete Performance Report
- Single-click comprehensive report generator synthesizing academic records, subject grades, mentor observations, meetings, and activity achievements.

---

## 4. API Endpoints Reference

All endpoints require JWT Bearer Authentication and STUDENT role:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | /api/student/dashboard | Fetch student dashboard metrics, attendance, subject marks, and summary |
| GET | /api/student/profile | Fetch detailed student personal profile |
| PUT | /api/student/profile | Update permitted personal contact fields (email, phone) |
| GET | /api/student/academic | Fetch semester-wise academic records and subject scores |
| GET | /api/student/activities | Fetch student co-curricular activities and certificates |
| POST | /api/student/activities | Submit new activity with optional multipart certificate upload |
| GET | /api/student/activities/:id/certificate | Download uploaded activity certificate securely |
| GET | /api/student/meetings | Fetch scheduled and completed meetings with assigned mentor |
| GET | /api/student/complaints | Fetch list of student grievances and resolutions |
| POST | /api/student/complaints | Submit a new grievance/complaint |
| GET | /api/student/notifications | Fetch student notifications and unread count |
| PATCH| /api/student/notifications/:id/read | Mark individual notification as read |
| POST | /api/student/notifications/read-all | Mark all notifications as read |
| GET | /api/student/report | Generate complete student evaluation and mentoring report |

---

## 5. Integration Guide for Team Members

To integrate this module into the main application:

1. **Install Multer Dependency** (for file uploads):
   `ash
   cd backend
   npm install multer
   `

2. **Run Database Schema Additions**:
   Execute student-profile/database/student_profile_schema.sql on the MySQL database to create the subject_marks table and add certificate metadata columns.

3. **Mount Routes in Backend**:
   Copy or link student-profile/backend/controllers/student.controller.js, student-profile/backend/routes/student.routes.js, and student-profile/backend/middleware/upload.js into ackend/, and mount in ackend/server.js:
   `javascript
   const studentRoutes = require('./routes/student.routes');
   app.use('/api/student', studentRoutes);
   `

4. **Serve Frontend**:
   Deploy student-profile/components/dashboard.html as the student portal view with student-profile/assets/js/student.js.

---

## 6. Isolation & Team Safety Guarantee

- **Zero Overwrites**: No existing project files, authentication modules, admin panels, mentor features, or machine learning code were altered.
- **Independent Staging**: Only the files within student-profile/ are staged and committed in this branch.