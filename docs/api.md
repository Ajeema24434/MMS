# REST API Documentation - AI-Driven Mentor-Mentee Management System

## Base URL
`http://localhost:5000/api`

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT token.
- **Request Body**:
```json
{
  "identifier": "admin@mms.edu",
  "password": "password123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "System Administrator",
    "email": "admin@mms.edu",
    "role": "ADMIN",
    "identifier": "admin@mms.edu"
  }
}
```
- **Errors**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`.

---

## 2. Admin Endpoints (`/api/admin`)
*Requires Header: `Authorization: Bearer <token>` with `ADMIN` role.*

- `GET /api/admin/dashboard`: Returns aggregate statistics (total students, total mentors, total batches, batch list).
- `GET /api/admin/mentors`: Lists all registered mentors.
- `POST /api/admin/mentors`: Registers a new faculty mentor.
- `GET /api/admin/mentors/:id`: Retrieves mentor details by ID.
- `PUT /api/admin/mentors/:id`: Updates mentor details.
- `GET /api/admin/students`: Lists all students with batch and academic info.
- `POST /api/admin/students`: Registers a new student.
- `GET /api/admin/students/:id`: Retrieves student details by ID.
- `PUT /api/admin/students/:id`: Updates student information.
- `PATCH /api/admin/students/:id/batch`: Assigns or updates a student's batch.
- `GET /api/admin/batches`: Lists all academic batches.
- `POST /api/admin/batches`: Creates a new academic batch.
- `PUT /api/admin/batches/:id`: Updates batch details.
- `POST /api/admin/batches/:id/assign-mentor`: Assigns a mentor to a batch.

---

## 3. Student Endpoints (`/api/student`)
*Requires Header: `Authorization: Bearer <token>` with `STUDENT` role.*

- `GET /api/student/dashboard`: Returns student profile, assigned mentor details, academic summary, activities, and complaints.
- `GET /api/student/profile`: Returns student profile.
- `GET /api/student/academic`: Returns semester academic records.
- `GET /api/student/activities`: Returns co-curricular achievements.
- `GET /api/student/complaints`: Returns complaints submitted by the student.
- `POST /api/student/complaints`: Submits a new complaint or query.

---

## 4. Mentor Endpoints (`/api/mentor`)
*Requires Header: `Authorization: Bearer <token>` with `MENTOR` role.*

- `GET /api/mentor/dashboard`: Returns assigned batch info, student roster, pending complaints count, meeting history, and ML risk summary.
- `GET /api/mentor/students`: Lists students strictly in the mentor's assigned batch.
- `GET /api/mentor/students/:id`: Returns details of a specific mentee. Returns `403 Forbidden` if student belongs to another batch.
- `GET /api/mentor/complaints`: Returns complaints submitted by students in mentor's batch.
- `GET /api/mentor/meetings`: Returns mentoring meeting history for mentor's batch.
- `POST /api/mentor/meetings`: Schedules a new mentoring meeting.
- `GET /api/mentor/ml-summary`: Returns ML risk classification breakdown for mentor's batch.
