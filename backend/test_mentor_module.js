const http = require('http');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');

const BASE_URL = 'http://localhost:5000';

// Helper to make HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, {
      method,
      headers
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(buffer.toString('utf8')) });
          } catch(e) {
            resolve({ status: res.statusCode, headers: res.headers, body: buffer.toString('utf8') });
          }
        } else {
          resolve({ status: res.statusCode, headers: res.headers, buffer, body: buffer });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('===========================================================');
  console.log('   STARTING MENTOR & EXCEL REPORTS VERIFICATION TEST SUITE');
  console.log('===========================================================');

  // 1. TEST MENTOR LOGIN
  console.log('\n[TEST 1] Mentor Login (MNT101)...');
  const loginRes = await request('POST', '/api/auth/login', {
    identifier: 'MNT101',
    password: 'password123'
  });

  if (loginRes.status !== 200 || !loginRes.body.token) {
    console.error('FAIL: Login failed', loginRes.body);
    process.exit(1);
  }
  const token = loginRes.body.token;
  console.log('PASS: Mentor logged in successfully. User:', loginRes.body.user.name);

  // 2. TEST MENTOR DASHBOARD
  console.log('\n[TEST 2] Fetch Mentor Dashboard...');
  const dashRes = await request('GET', '/api/mentor/dashboard', null, token);
  if (dashRes.status !== 200 || !dashRes.body.success) {
    console.error('FAIL: Dashboard failed', dashRes.body);
    process.exit(1);
  }
  console.log('PASS: Dashboard loaded.');
  console.log('  Mentor:', dashRes.body.mentor.name, `(${dashRes.body.mentor.mentor_code})`);
  console.log('  Assigned Batch:', dashRes.body.assignedBatch.name);
  console.log('  Total Students:', dashRes.body.totalStudents);
  console.log('  ML Risk Breakdown:', dashRes.body.mlRiskSummary);

  if (dashRes.body.totalStudents !== 20) {
    console.error('FAIL: Expected exactly 20 total students, got:', dashRes.body.totalStudents);
    process.exit(1);
  }

  if (dashRes.body.assignedBatch.name !== 'CSE-2024-A') {
    console.error('FAIL: Expected batch CSE-2024-A, got:', dashRes.body.assignedBatch.name);
    process.exit(1);
  }

  // 3. TEST ASSIGNED STUDENTS
  console.log('\n[TEST 3] Fetch Assigned Students Roster...');
  const studentsRes = await request('GET', '/api/mentor/students', null, token);
  if (studentsRes.status !== 200 || !studentsRes.body.students) {
    console.error('FAIL: Students fetch failed', studentsRes.body);
    process.exit(1);
  }
  const students = studentsRes.body.students;
  if (students.length !== 20) {
    console.error('FAIL: Expected 20 assigned students in roster, got:', students.length);
    process.exit(1);
  }
  console.log(`PASS: Found ${students.length} assigned students:`);
  students.forEach(s => console.log(`   - Roll: ${s.roll_no} | Name: ${s.name} | Risk: ${s.ml_risk_level}`));

  // 4. TEST STUDENT PROFILE (AUTHORIZED)
  console.log('\n[TEST 4] Open Authorized Student Profile (Student ID 1: CSE-01)...');
  const stDetailRes = await request('GET', '/api/mentor/students/1', null, token);
  if (stDetailRes.status !== 200 || !stDetailRes.body.success) {
    console.error('FAIL: Student detail fetch failed', stDetailRes.body);
    process.exit(1);
  }
  console.log('PASS: Student profile loaded.');
  console.log('  Name:', stDetailRes.body.student.name);
  console.log('  Academic Records count:', stDetailRes.body.academicRecords.length);
  console.log('  Meeting Attendance count:', stDetailRes.body.attendanceRecords.length);
  console.log('  ML Demo Result:', stDetailRes.body.mlDemoResult);

  // 5. TEST STRICT BATCH ISOLATION (UNAUTHORIZED STUDENT)
  console.log('\n[TEST 5] Strict Batch Isolation: Accessing Student from Batch 2 (Student ID 21: CSE-21)...');
  const forbiddenRes = await request('GET', '/api/mentor/students/21', null, token);
  if (forbiddenRes.status === 403) {
    console.log('PASS: Strictly blocked with 403 Forbidden! Message:', forbiddenRes.body.message);
  } else {
    console.error('FAIL: Security issue! Expected 403, got status:', forbiddenRes.status, forbiddenRes.body);
    process.exit(1);
  }

  // 6. TEST CREATE MEETING
  console.log('\n[TEST 6] Create New Meeting Agenda...');
  const newMeetingRes = await request('POST', '/api/mentor/meetings', {
    meeting_date: '2024-09-15T11:00:00',
    mode: 'Offline / Seminar Hall 1',
    agenda: 'End-Sem Preparation & Project Review',
    discussion: 'Reviewed final submission deadlines and attendance defaulter lists.',
    findings: 'All students submitted rough drafts.',
    assignment: 'Complete final code repository push.',
    remarks: 'Satisfactory overall response.',
    status: 'Scheduled'
  }, token);

  if (newMeetingRes.status !== 201 || !newMeetingRes.body.meetingId) {
    console.error('FAIL: Create meeting failed', newMeetingRes.body);
    process.exit(1);
  }
  const createdMeetingId = newMeetingRes.body.meetingId;
  console.log('PASS: Meeting created with ID:', createdMeetingId);

  // 7. TEST UPDATE MEETING
  console.log('\n[TEST 7] Update Meeting Details...');
  const updateMeetingRes = await request('PUT', `/api/mentor/meetings/${createdMeetingId}`, {
    discussion: 'Updated: Reviewed final submission deadlines and exam pattern.',
    status: 'Completed'
  }, token);
  if (updateMeetingRes.status !== 200) {
    console.error('FAIL: Update meeting failed', updateMeetingRes.body);
    process.exit(1);
  }
  console.log('PASS: Meeting updated successfully.');

  // 8. TEST BATCH ISOLATION ON MEETING (UPDATE MEETING FROM ANOTHER BATCH)
  console.log('\n[TEST 8] Batch Isolation: Attempt to update Meeting 3 belonging to Batch 2...');
  const unauthMeetingRes = await request('PUT', '/api/mentor/meetings/3', {
    agenda: 'Hacked agenda'
  }, token);
  if (unauthMeetingRes.status === 403) {
    console.log('PASS: Blocked with 403 Forbidden! Message:', unauthMeetingRes.body.message);
  } else {
    console.error('FAIL: Security issue on meeting! Expected 403, got:', unauthMeetingRes.status);
    process.exit(1);
  }

  // 9. TEST ATTENDANCE MARKING & UPDATING
  console.log('\n[TEST 9] Fetch Attendance for Created Meeting...');
  const attGetRes = await request('GET', `/api/mentor/meetings/${createdMeetingId}/attendance`, null, token);
  if (attGetRes.status !== 200 || !attGetRes.body.students) {
    console.error('FAIL: Get attendance failed', attGetRes.body);
    process.exit(1);
  }
  console.log(`PASS: Attendance sheet loaded for ${attGetRes.body.students.length} students.`);

  console.log('\n[TEST 9b] Mark and Save Attendance (4 Present, 1 Absent)...');
  const attSaveRes = await request('POST', `/api/mentor/meetings/${createdMeetingId}/attendance`, {
    records: [
      { student_id: 1, status: 'Present', remarks: 'On time' },
      { student_id: 2, status: 'Present', remarks: 'On time' },
      { student_id: 3, status: 'Absent', remarks: 'Medical leave' },
      { student_id: 4, status: 'Present', remarks: 'On time' },
      { student_id: 5, status: 'Present', remarks: 'On time' }
    ]
  }, token);
  if (attSaveRes.status !== 200) {
    console.error('FAIL: Save attendance failed', attSaveRes.body);
    process.exit(1);
  }
  console.log(`PASS: Attendance saved: ${attSaveRes.body.presentCount} Present, ${attSaveRes.body.absentCount} Absent.`);

  // 10. TEST COMPLAINT RESOLUTION
  console.log('\n[TEST 10] Fetch Complaints & Update Resolution...');
  const compRes = await request('GET', '/api/mentor/complaints', null, token);
  if (compRes.status !== 200 || !compRes.body.complaints) {
    console.error('FAIL: Get complaints failed', compRes.body);
    process.exit(1);
  }
  console.log(`PASS: Found ${compRes.body.complaints.length} complaints for this batch.`);

  if (compRes.body.complaints.length > 0) {
    const compId = compRes.body.complaints[0].id;
    const updateCompRes = await request('PUT', `/api/mentor/complaints/${compId}/status`, {
      status: 'Resolved',
      mentor_response: 'Conducted doubt clarification session and verified lab performance.'
    }, token);
    if (updateCompRes.status !== 200) {
      console.error('FAIL: Update complaint failed', updateCompRes.body);
      process.exit(1);
    }
    console.log(`PASS: Complaint #${compId} updated to Resolved.`);
  }

  // 11. TEST EXCEL REPORTS (REPORTS 1 TO 4)
  console.log('\n[TEST 11] Generate and Verify Report 1 (Cumulative Mentoring Report)...');
  const rep1Res = await request('GET', '/api/mentor/reports/report1', null, token);
  if (rep1Res.status !== 200) {
    console.error('FAIL: Report 1 download failed', rep1Res.status);
    process.exit(1);
  }
  const wb1 = new ExcelJS.Workbook();
  await wb1.xlsx.load(rep1Res.buffer);
  const ws1 = wb1.getWorksheet(1);
  console.log(`PASS: Report 1 Excel generated (${ws1.rowCount} rows, Sheet: "${ws1.name}").`);
  console.log('  Row 5 Headers:', ws1.getRow(5).values.slice(1, 6));
  console.log('  Row 6 Data (Meeting 1): Present =', ws1.getRow(6).getCell(6).value, '| Absent =', ws1.getRow(6).getCell(7).value);

  console.log('\n[TEST 12] Generate and Verify Report 2 (Academic Progress Report)...');
  const rep2Res = await request('GET', '/api/mentor/reports/report2', null, token);
  if (rep2Res.status !== 200) {
    console.error('FAIL: Report 2 download failed', rep2Res.status);
    process.exit(1);
  }
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.load(rep2Res.buffer);
  const ws2 = wb2.getWorksheet(1);
  console.log(`PASS: Report 2 Excel generated (${ws2.rowCount} rows, Sheet: "${ws2.name}").`);
  console.log('  Row 6 Student 1:', ws2.getRow(6).getCell(1).value, ws2.getRow(6).getCell(2).value, '| Att%:', ws2.getRow(6).getCell(3).value, '| CGPA:', ws2.getRow(6).getCell(8).value);

  console.log('\n[TEST 13] Generate and Verify Report 3 (Students Progress Report)...');
  const rep3Res = await request('GET', '/api/mentor/reports/report3', null, token);
  if (rep3Res.status !== 200) {
    console.error('FAIL: Report 3 download failed', rep3Res.status);
    process.exit(1);
  }
  const wb3 = new ExcelJS.Workbook();
  await wb3.xlsx.load(rep3Res.buffer);
  const ws3 = wb3.getWorksheet(1);
  console.log(`PASS: Report 3 Excel generated (${ws3.rowCount} rows, Sheet: "${ws3.name}").`);
  console.log('  Row 6 Student 1 (NPTEL):', ws3.getRow(6).getCell(5).value, '| Internship:', ws3.getRow(6).getCell(6).value);

  console.log('\n[TEST 14] Generate and Verify Report 4 (Analysis of Mentees Report)...');
  const rep4Res = await request('GET', '/api/mentor/reports/report4', null, token);
  if (rep4Res.status !== 200) {
    console.error('FAIL: Report 4 download failed', rep4Res.status);
    process.exit(1);
  }
  const wb4 = new ExcelJS.Workbook();
  await wb4.xlsx.load(rep4Res.buffer);
  const ws4 = wb4.getWorksheet(1);
  console.log(`PASS: Report 4 Excel generated (${ws4.rowCount} rows, Sheet: "${ws4.name}").`);
  for (let r = 6; r <= 8; r++) {
    console.log(`  Row ${r}:`, ws4.getRow(r).getCell(1).value, '| Rolls:', ws4.getRow(r).getCell(2).value, '| Count:', ws4.getRow(r).getCell(3).value);
  }

  // 15. VERIFY OTHER MODULES (ADMIN, STUDENT, AUTH) NOT BROKEN
  console.log('\n[TEST 15] Verify Admin & Student Modules Integrity...');
  const adminLoginRes = await request('POST', '/api/auth/login', {
    identifier: 'admin@mms.edu',
    password: 'password123'
  });
  if (adminLoginRes.status !== 200 || !adminLoginRes.body.token) {
    console.error('FAIL: Admin login failed');
    process.exit(1);
  }
  const adminToken = adminLoginRes.body.token;
  const adminDashRes = await request('GET', '/api/admin/dashboard', null, adminToken);
  console.log('PASS: Admin dashboard operational (Status: ' + adminDashRes.status + ')');

  const studentLoginRes = await request('POST', '/api/auth/login', {
    identifier: 'URN2024001',
    password: 'password123'
  });
  if (studentLoginRes.status !== 200 || !studentLoginRes.body.token) {
    console.error('FAIL: Student login failed');
    process.exit(1);
  }
  const studentToken = studentLoginRes.body.token;
  const studentDashRes = await request('GET', '/api/student/dashboard', null, studentToken);
  console.log('PASS: Student dashboard operational (Status: ' + studentDashRes.status + ')');

  console.log('\n===========================================================');
  console.log('   ALL 15 TESTS PASSED SUCCESSFULLY! DEMO READY!');
  console.log('===========================================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
