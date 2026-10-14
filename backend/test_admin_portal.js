const http = require('http');

function makeRequest(path, method, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("============================================================");
  console.log("  VERIFYING ADMIN PORTAL & ROLE-BASED ACCESS CONTROL");
  console.log("============================================================");

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // 1. Authentication Tests
  console.log("\n--- SECTION 1: ADMIN LOGIN & AUTHENTICATION ---");
  
  // 1.1 Invalid credentials
  const badLogin = await makeRequest('/api/auth/login', 'POST', { identifier: 'admin@mms.edu', password: 'wrongpassword' });
  assert(badLogin.status === 401 && badLogin.data.success === false, "1.1 Invalid password rejected with HTTP 401");

  // 1.2 Missing fields
  const missingLogin = await makeRequest('/api/auth/login', 'POST', { identifier: 'admin@mms.edu' });
  assert(missingLogin.status === 400 && missingLogin.data.success === false, "1.2 Missing password rejected with HTTP 400");

  // 1.3 Successful Admin Login
  const adminLogin = await makeRequest('/api/auth/login', 'POST', { identifier: 'admin@mms.edu', password: 'password123' });
  assert(adminLogin.status === 200 && adminLogin.data.success === true && adminLogin.data.token, "1.3 Admin login succeeds with JWT token");
  const adminToken = adminLogin.data.token;

  // 1.4 Student login (to test RBAC) - using URN User ID
  const studentLogin = await makeRequest('/api/auth/login', 'POST', { identifier: '1026091001', password: 'Pass@1026091001' });
  const studentToken = studentLogin.data.token;

  // 1.5 Mentor login (to test RBAC)
  const mentorLogin = await makeRequest('/api/auth/login', 'POST', { identifier: 'MNT101', password: 'password123' });
  const mentorToken = mentorLogin.data.token;

  // 2. Authorization & RBAC Tests
  console.log("\n--- SECTION 2: SERVER-SIDE ROLE-BASED ACCESS CONTROL ---");

  // 2.1 Unauthenticated access to Admin API
  const unauthRes = await makeRequest('/api/admin/dashboard', 'GET');
  assert(unauthRes.status === 401 && unauthRes.data.success === false, "2.1 Unauthenticated request rejected with HTTP 401");

  // 2.2 Student access to Admin API
  const studentForbidden = await makeRequest('/api/admin/dashboard', 'GET', null, studentToken);
  assert(studentForbidden.status === 403 && studentForbidden.data.success === false, "2.2 Student access to Admin API rejected with HTTP 403");

  // 2.3 Mentor access to Admin API
  const mentorForbidden = await makeRequest('/api/admin/dashboard', 'GET', null, mentorToken);
  assert(mentorForbidden.status === 403 && mentorForbidden.data.success === false, "2.3 Mentor access to Admin API rejected with HTTP 403");

  // 2.4 Admin access to Admin API
  const adminDash = await makeRequest('/api/admin/dashboard', 'GET', null, adminToken);
  assert(adminDash.status === 200 && adminDash.data.success === true && adminDash.data.stats, "2.4 Admin accesses Admin Dashboard with HTTP 200");

  // 3. Mentor Master-Data Management Tests
  console.log("\n--- SECTION 3: MENTOR MASTER-DATA MANAGEMENT ---");

  // 3.1 Get mentors list
  const mentorsList = await makeRequest('/api/admin/mentors', 'GET', null, adminToken);
  assert(mentorsList.status === 200 && Array.isArray(mentorsList.data.mentors), "3.1 Fetch mentors directory");

  // 3.2 Create new mentor
  const testMentorCode = `MNT_TEST_${Date.now() % 10000}`;
  const testMentorEmail = `test.mentor.${Date.now() % 10000}@mms.edu`;
  const createMentorRes = await makeRequest('/api/admin/mentors', 'POST', {
    name: 'Dr. Automated Tester',
    email: testMentorEmail,
    mentor_code: testMentorCode,
    department: 'Computer Engineering',
    designation: 'Associate Professor',
    phone: '9898989898',
    password: 'password123'
  }, adminToken);
  assert(createMentorRes.status === 201 && createMentorRes.data.success === true, "3.2 Create new mentor record (HTTP 201)");
  const newMentorId = createMentorRes.data.mentorId;

  // 3.3 Duplicate mentor code validation
  const dupMentorCode = await makeRequest('/api/admin/mentors', 'POST', {
    name: 'Duplicate Code Tester',
    email: `unique.${Date.now()}@mms.edu`,
    mentor_code: testMentorCode,
    department: 'Computer Engineering'
  }, adminToken);
  assert(dupMentorCode.status === 409 && dupMentorCode.data.success === false, "3.3 Duplicate mentor code rejected with HTTP 409 Conflict");

  // 3.4 Duplicate mentor email validation
  const dupMentorEmail = await makeRequest('/api/admin/mentors', 'POST', {
    name: 'Duplicate Email Tester',
    email: testMentorEmail,
    mentor_code: `MNT_DIFF_${Date.now() % 10000}`,
    department: 'Computer Engineering'
  }, adminToken);
  assert(dupMentorEmail.status === 409 && dupMentorEmail.data.success === false, "3.4 Duplicate mentor email rejected with HTTP 409 Conflict");

  // 3.5 Update mentor
  const updateMentorRes = await makeRequest(`/api/admin/mentors/${newMentorId}`, 'PUT', {
    designation: 'Professor & Head',
    phone: '9111111111'
  }, adminToken);
  assert(updateMentorRes.status === 200 && updateMentorRes.data.success === true, "3.5 Update mentor record (HTTP 200)");

  // 4. Batch Management & Mentor Assignment Tests
  console.log("\n--- SECTION 4: BATCH MANAGEMENT & MENTOR ASSIGNMENT ---");

  // 4.1 Fetch Batches
  const batchesRes = await makeRequest('/api/admin/batches', 'GET', null, adminToken);
  assert(batchesRes.status === 200 && Array.isArray(batchesRes.data.batches), "4.1 Fetch active batches list");

  // 4.2 Create Batch
  const testBatchName = `BATCH_TEST_${Date.now() % 10000}`;
  const createBatchRes = await makeRequest('/api/admin/batches', 'POST', {
    name: testBatchName,
    department: 'Computer Engineering',
    academic_year: '2025-2026'
  }, adminToken);
  assert(createBatchRes.status === 201 && createBatchRes.data.success === true, "4.2 Create new batch (HTTP 201)");
  const newBatchId = createBatchRes.data.batchId;

  // 4.3 Duplicate Batch Name Validation
  const dupBatchRes = await makeRequest('/api/admin/batches', 'POST', {
    name: testBatchName,
    department: 'Computer Engineering',
    academic_year: '2025-2026'
  }, adminToken);
  assert(dupBatchRes.status === 409 && dupBatchRes.data.success === false, "4.3 Duplicate batch name rejected with HTTP 409 Conflict");

  // 4.4 Assign Mentor to Batch
  const assignMentorRes = await makeRequest(`/api/admin/batches/${newBatchId}/assign-mentor`, 'POST', {
    mentor_id: newMentorId
  }, adminToken);
  assert(assignMentorRes.status === 200 && assignMentorRes.data.success === true, "4.4 Assign mentor to batch (HTTP 200)");

  // 4.5 Update Batch
  const updateBatchRes = await makeRequest(`/api/admin/batches/${newBatchId}`, 'PUT', {
    academic_year: '2026-2027'
  }, adminToken);
  assert(updateBatchRes.status === 200 && updateBatchRes.data.success === true, "4.5 Update batch details (HTTP 200)");

  // 5. Student Master-Data Management Tests
  console.log("\n--- SECTION 5: STUDENT MASTER-DATA MANAGEMENT ---");

  // 5.1 Fetch Students List
  const studentsList = await makeRequest('/api/admin/students', 'GET', null, adminToken);
  assert(studentsList.status === 200 && Array.isArray(studentsList.data.students), "5.1 Fetch student directory");

  // 5.2 Create new student
  const testUrn = `URN_TEST_${Date.now() % 10000}`;
  const testRoll = `ROLL_T_${Date.now() % 10000}`;
  const testStudentEmail = `test.student.${Date.now() % 10000}@student.mms.edu`;
  const createStudentRes = await makeRequest('/api/admin/students', 'POST', {
    name: 'Automated Student Mentee',
    email: testStudentEmail,
    urn: testUrn,
    roll_no: testRoll,
    department: 'Computer Engineering',
    division: 'A',
    batch_id: newBatchId,
    password: 'password123'
  }, adminToken);
  assert(createStudentRes.status === 201 && createStudentRes.data.success === true, "5.2 Create new student record with batch allocation (HTTP 201)");
  const newStudentId = createStudentRes.data.studentId;

  // 5.3 Duplicate Student URN validation
  const dupUrnRes = await makeRequest('/api/admin/students', 'POST', {
    name: 'Duplicate URN Student',
    email: `other.${Date.now()}@student.mms.edu`,
    urn: testUrn,
    roll_no: `DIFF_${Date.now() % 1000}`,
    department: 'Computer Engineering',
    division: 'A'
  }, adminToken);
  assert(dupUrnRes.status === 409 && dupUrnRes.data.success === false, "5.3 Duplicate student URN rejected with HTTP 409 Conflict");

  // 5.4 Duplicate Roll No in Department validation
  const dupRollRes = await makeRequest('/api/admin/students', 'POST', {
    name: 'Duplicate Roll Student',
    email: `other2.${Date.now()}@student.mms.edu`,
    urn: `URN_DIFF_${Date.now() % 10000}`,
    roll_no: testRoll,
    department: 'Computer Engineering',
    division: 'A'
  }, adminToken);
  assert(dupRollRes.status === 409 && dupRollRes.data.success === false, "5.4 Duplicate roll number rejected with HTTP 409 Conflict");

  // 5.5 Update Student
  const updateStudentRes = await makeRequest(`/api/admin/students/${newStudentId}`, 'PUT', {
    division: 'B'
  }, adminToken);
  assert(updateStudentRes.status === 200 && updateStudentRes.data.success === true, "5.5 Update student record (HTTP 200)");

  // 5.6 Assign student to another batch or unassign
  const patchBatchRes = await makeRequest(`/api/admin/students/${newStudentId}/batch`, 'PATCH', {
    batch_id: null
  }, adminToken);
  assert(patchBatchRes.status === 200 && patchBatchRes.data.success === true, "5.6 Patch student batch assignment (HTTP 200)");

  // 6. Cleanup & Deletion Tests
  console.log("\n--- SECTION 6: RECORD REMOVAL & TEARDOWN ---");

  // 6.1 Delete student
  const delStudentRes = await makeRequest(`/api/admin/students/${newStudentId}`, 'DELETE', null, adminToken);
  assert(delStudentRes.status === 200 && delStudentRes.data.success === true, "6.1 Delete student record (HTTP 200)");

  // 6.2 Delete batch
  const delBatchRes = await makeRequest(`/api/admin/batches/${newBatchId}`, 'DELETE', null, adminToken);
  assert(delBatchRes.status === 200 && delBatchRes.data.success === true, "6.2 Delete batch record (HTTP 200)");

  // 6.3 Delete mentor
  const delMentorRes = await makeRequest(`/api/admin/mentors/${newMentorId}`, 'DELETE', null, adminToken);
  assert(delMentorRes.status === 200 && delMentorRes.data.success === true, "6.3 Delete mentor record (HTTP 200)");

  console.log("\n============================================================");
  console.log(`  SUMMARY: ${passed} / ${total} TESTS PASSED CLEANLY (${Math.round((passed/total)*100)}%)`);
  console.log("============================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
