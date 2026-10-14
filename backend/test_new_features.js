const http = require('http');

function postJSON(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d || '{}') }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJSON(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'GET',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d || '{}') }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  console.log('============================================================');
  console.log('  TESTING NEW FEATURES: 1:1 MENTORS, REPORTS, ACADEMICS');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. ADMIN TEST: Mentors have strictly 1 assigned batch & 20 total
  const adminLogin = await postJSON('http://localhost:5000/api/auth/login', {
    identifier: 'admin@mms.edu',
    password: 'password123'
  });
  assert(adminLogin.status === 200, 'Admin login succeeds');

  const mentorCreds = await getJSON('http://localhost:5000/api/admin/credentials/mentors', adminLogin.data.token);
  assert(mentorCreds.status === 200, 'Fetch mentor credentials succeeds');
  assert(mentorCreds.data.count === 20, `Total mentors is 20 (got ${mentorCreds.data.count})`);

  // Verify all mentors have 1 batch
  const multiBatchMentors = mentorCreds.data.mentors.filter(m => m.batches.length !== 1);
  assert(multiBatchMentors.length === 0, 'Every mentor has strictly 1 assigned batch');

  // Verify TY mentors match PDF
  const tyMentors = mentorCreds.data.mentors.filter(m => ['MNT113', 'MNT114', 'MNT115', 'MNT116'].includes(m.mentor_code));
  assert(tyMentors.length === 4, 'Found all 4 TY mentors');

  const m13 = tyMentors.find(m => m.mentor_code === 'MNT113');
  assert(m13 && m13.name === 'Prof. Vikas Honmane' && m13.email === 'vh_aids@adcet.in' && m13.assigned_batches === 'TY-AIDS-A-B1', 'TY Batch 1 mentor is Prof. Vikas Honmane');

  const m14 = tyMentors.find(m => m.mentor_code === 'MNT114');
  assert(m14 && m14.name === 'Prof. Priyanka S. Patil' && m14.email === 'psp_aids@adcet.in' && m14.assigned_batches === 'TY-AIDS-A-B2', 'TY Batch 2 mentor is Prof. Priyanka S. Patil');

  const m15 = tyMentors.find(m => m.mentor_code === 'MNT115');
  assert(m15 && m15.name === 'Prof. Krishnkumar L' && m15.email === 'krishnakumar@adcet.in' && m15.assigned_batches === 'TY-AIDS-A-B3', 'TY Batch 3 mentor is Prof. Krishnkumar L');

  const m16 = tyMentors.find(m => m.mentor_code === 'MNT116');
  assert(m16 && m16.name === 'Prof. Priyanka C Patil' && m16.email === 'pcp_aids@adcet.in' && m16.assigned_batches === 'TY-AIDS-A-B4', 'TY Batch 4 mentor is Prof. Priyanka C Patil');

  // 2. MENTOR REPORT TEST
  const m13Login = await postJSON('http://localhost:5000/api/auth/login', {
    identifier: 'MNT113',
    password: 'Pass@MNT113'
  });
  assert(m13Login.status === 200, 'Mentor MNT113 (Prof. Vikas Honmane) logs in');

  const m13Dash = await getJSON('http://localhost:5000/api/mentor/dashboard', m13Login.data.token);
  assert(m13Dash.status === 200 && m13Dash.data.students.length > 0, `Mentor dashboard loaded (${m13Dash.data.students?.length} students)`);

  const mentee = m13Dash.data.students[0];
  const reportRes = await getJSON(`http://localhost:5000/api/mentor/students/${mentee.id}/report`, m13Login.data.token);
  assert(reportRes.status === 200, `Generate report for mentee ${mentee.name} returns 200`);
  assert(reportRes.data.report?.student?.urn === mentee.urn, 'Report contains matching student URN');
  assert(reportRes.data.report?.mentor?.name === 'Prof. Vikas Honmane', 'Report contains mentor name');
  assert(Array.isArray(reportRes.data.report?.academicRecords), 'Report contains academic records array');
  assert(reportRes.data.report?.mlAnalysis?.risk_level !== undefined, 'Report contains ML risk analysis');

  // Verify batch isolation: MNT113 cannot generate report for a student in Batch 1
  const m1Login = await postJSON('http://localhost:5000/api/auth/login', {
    identifier: 'MNT101',
    password: 'Pass@MNT101'
  });
  const m1Dash = await getJSON('http://localhost:5000/api/mentor/dashboard', m1Login.data.token);
  const foreignStudent = m1Dash.data.students[0];
  const crossReport = await getJSON(`http://localhost:5000/api/mentor/students/${foreignStudent.id}/report`, m13Login.data.token);
  assert(crossReport.status === 403, 'Cross-batch report generation rejected with HTTP 403');

  // 3. STUDENT ACADEMIC ENTRY TEST (CURRENT & PREVIOUS SEMESTERS)
  const db = require(require('path').join(__dirname, 'config/db'));
  const testStudentUser = (await db.query(`
    SELECT u.identifier, u.initial_password 
    FROM users u 
    JOIN students s ON s.user_id = u.id 
    LIMIT 1
  `))[0];

  const stLogin = await postJSON('http://localhost:5000/api/auth/login', {
    identifier: testStudentUser.identifier,
    password: testStudentUser.initial_password
  });
  assert(stLogin.status === 200, `Student ${testStudentUser.identifier} logged in successfully`);

  // Add previous semester (Semester 2)
  const addSem2 = await postJSON('http://localhost:5000/api/student/academic', {
    semester: 2,
    cgpa: 8.92,
    attendance_percentage: 94.0,
    ise_marks: 26,
    mse_marks: 28.5,
    ese_marks: 88,
    subjects_failed_count: 0
  }, stLogin.data.token);
  assert(addSem2.status === 200, 'Student adds previous semester (Sem 2) academic record');

  // Add current semester (Semester 5)
  const addSem5 = await postJSON('http://localhost:5000/api/student/academic', {
    semester: 5,
    cgpa: 8.40,
    attendance_percentage: 82.5,
    ise_marks: 22,
    mse_marks: 25,
    ese_marks: 72,
    subjects_failed_count: 0
  }, stLogin.data.token);
  assert(addSem5.status === 200, 'Student adds current semester (Sem 5) academic record');

  // Retrieve academic records
  const acadRecords = await getJSON('http://localhost:5000/api/student/academic', stLogin.data.token);
  assert(acadRecords.status === 200, 'Student retrieves academic records');
  const sem2Rec = acadRecords.data.records.find(r => r.semester === 2);
  assert(sem2Rec && sem2Rec.cgpa === 8.92, 'Semester 2 CGPA saved correctly as 8.92');

  const sem5Rec = acadRecords.data.records.find(r => r.semester === 5);
  assert(sem5Rec && sem5Rec.cgpa === 8.40, 'Semester 5 CGPA saved correctly as 8.40');

  console.log(`\n============================================================`);
  console.log(`  SUMMARY: ${passed} / ${total} TESTS PASSED CLEANLY (${Math.round(passed/total*100)}%)`);
  console.log(`============================================================\n`);
  process.exit(0);
})();
