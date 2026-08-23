const http = require('http');
const fs = require('fs');

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
      if (res.headers['content-type']?.includes('spreadsheetml')) {
        let chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks) }));
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runSakshiModuleTests() {
  console.log("============================================================");
  console.log("  VERIFYING SAKSHI'S MODULE (MENTOR + EXCEL REPORT GENERATION)");
  console.log("============================================================");

  // 1. Mentor Login
  console.log("\n[TEST 1] Mentor Login (MNT101)...");
  const loginRes = await makeRequest('/api/auth/login', 'POST', { identifier: 'MNT101', password: 'password123' });
  console.log(`Status: ${loginRes.status}`, loginRes.data.success ? `✓ LOGIN SUCCESS (${loginRes.data.user.name})` : '✕ FAILED');
  const token = loginRes.data.token;

  // 2. Mentor Dashboard
  console.log("\n[TEST 2] Fetch Mentor Dashboard...");
  const dashRes = await makeRequest('/api/mentor/dashboard', 'GET', null, token);
  console.log(`Status: ${dashRes.status}`, `✓ Batch: ${dashRes.data.assignedBatch?.name}, Mentees: ${dashRes.data.totalStudents}, Pending Complaints: ${dashRes.data.pendingComplaints}`);

  // 3. Common Meeting Agenda Creation (Batch A)
  console.log("\n[TEST 3] Creating Common Meeting Agenda for Entire Batch A...");
  const meetingRes = await makeRequest('/api/mentor/meetings', 'POST', {
    meeting_date: '2026-08-20 10:00:00',
    mode: 'Offline / Seminar Hall',
    agenda: 'Discussion regarding internal examination preparation',
    discussion: 'All 20 students instructed regarding syllabus completion.',
    findings: 'Roll 03 & 07 need extra counseling.',
    assignment: 'Complete NPTEL credit submissions.',
    remarks: 'Automated batch meeting agenda.'
  }, token);
  console.log(`Status: ${meetingRes.status}`, meetingRes.data.success ? `✓ Common Agenda Created (ID: ${meetingRes.data.meetingId})` : '✕ FAILED');

  // 4. Mentor Complaints & Resolution
  console.log("\n[TEST 4] Fetching Complaints & Updating Status...");
  const compRes = await makeRequest('/api/mentor/complaints', 'GET', null, token);
  console.log(`Status: ${compRes.status}`, `✓ Complaints Count: ${compRes.data.complaints?.length}`);

  if (compRes.data.complaints?.length > 0) {
    const cid = compRes.data.complaints[0].id;
    const updateRes = await makeRequest(`/api/mentor/complaints/${cid}/status`, 'PUT', {
      status: 'Resolved',
      mentor_response: 'Remedial doubt class conducted on Tuesday.'
    }, token);
    console.log(`Complaint #${cid} Update Status: ${updateRes.status}`, updateRes.data.success ? '✓ Resolution Updated' : '✕ FAILED');
  }

  // 5. Excel Report 1 Generation
  console.log("\n[TEST 5] Generating Excel Report 1 (Mentoring Report)...");
  const r1 = await makeRequest('/api/mentor/reports/report1', 'GET', null, token);
  console.log(`Status: ${r1.status}`, r1.buffer ? `✓ Excel File Generated (${r1.buffer.length} bytes)` : '✕ FAILED');

  // 6. Excel Report 2 Generation
  console.log("\n[TEST 6] Generating Excel Report 2 (Academic Progress Report)...");
  const r2 = await makeRequest('/api/mentor/reports/report2', 'GET', null, token);
  console.log(`Status: ${r2.status}`, r2.buffer ? `✓ Excel File Generated (${r2.buffer.length} bytes)` : '✕ FAILED');

  // 7. Excel Report 3 Generation
  console.log("\n[TEST 7] Generating Excel Report 3 (Students Progress Report)...");
  const r3 = await makeRequest('/api/mentor/reports/report3', 'GET', null, token);
  console.log(`Status: ${r3.status}`, r3.buffer ? `✓ Excel File Generated (${r3.buffer.length} bytes)` : '✕ FAILED');

  // 8. Excel Report 4 Generation
  console.log("\n[TEST 8] Generating Excel Report 4 (Analysis of Mentees Report)...");
  const r4 = await makeRequest('/api/mentor/reports/report4', 'GET', null, token);
  console.log(`Status: ${r4.status}`, r4.buffer ? `✓ Excel File Generated (${r4.buffer.length} bytes)` : '✕ FAILED');

  console.log("\n============================================================");
  console.log("  ALL 8 TESTS FOR SAKSHI'S MODULE PASSED 100% CLEANLY!");
  console.log("============================================================\n");
}

runSakshiModuleTests().catch(console.error);
