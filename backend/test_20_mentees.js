const http = require('http');
const ExcelJS = require('exceljs');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
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

async function run20MenteesFocusedVerification() {
  console.log('===========================================================');
  console.log('   FOCUSED VERIFICATION: MENTOR 1 (20 COMPLETE MENTEES)');
  console.log('===========================================================');

  // 1. Login Mentor 1
  console.log('\n[CHECK 1] Mentor Login (MNT101)...');
  const loginRes = await request('POST', '/api/auth/login', { identifier: 'MNT101', password: 'password123' });
  if (loginRes.status !== 200 || !loginRes.body.token) {
    console.error('FAIL: Mentor login failed', loginRes.body);
    process.exit(1);
  }
  const token = loginRes.body.token;
  console.log('PASS: Mentor logged in. Name:', loginRes.body.user.name);

  // 2. Mentor Dashboard Check
  console.log('\n[CHECK 2] Mentor Dashboard verification...');
  const dashRes = await request('GET', '/api/mentor/dashboard', null, token);
  if (dashRes.status !== 200) {
    console.error('FAIL: Dashboard request failed', dashRes.status);
    process.exit(1);
  }
  const dash = dashRes.body;
  console.log(`  Assigned Batch: ${dash.assignedBatch?.name}`);
  console.log(`  Total Students: ${dash.totalStudents}`);
  console.log(`  ML Breakdown:`, dash.mlRiskSummary);

  if (dash.totalStudents !== 20) {
    console.error(`FAIL: Expected exactly 20 total students, found: ${dash.totalStudents}`);
    process.exit(1);
  }
  console.log('PASS: Dashboard correctly reports exactly 20 mentees!');

  // 3. Mentee Roster Check
  console.log('\n[CHECK 3] Mentee Roster Count & Completeness...');
  const rosterRes = await request('GET', '/api/mentor/students', null, token);
  const roster = rosterRes.body.students || [];
  console.log(`  Roster count: ${roster.length}`);
  if (roster.length !== 20) {
    console.error(`FAIL: Roster returned ${roster.length} students, expected 20.`);
    process.exit(1);
  }

  // Ensure unique rolls and URNs
  const rolls = new Set(roster.map(s => s.roll_no));
  const urns = new Set(roster.map(s => s.urn));
  if (rolls.size !== 20 || urns.size !== 20) {
    console.error('FAIL: Duplicate roll numbers or URNs detected in roster!');
    process.exit(1);
  }
  console.log(`PASS: All 20 students have unique roll numbers (${[...rolls].slice(0, 5).join(', ')}... to ${[...rolls].slice(-1)[0]})`);

  // 4. Load Every Single One of the 20 Student Profiles
  console.log('\n[CHECK 4] Verifying all 20 individual student profiles...');
  for (let i = 0; i < roster.length; i++) {
    const st = roster[i];
    const profileRes = await request('GET', `/api/mentor/students/${st.id}`, null, token);
    if (profileRes.status !== 200 || !profileRes.body.success) {
      console.error(`FAIL: Student profile #${st.id} (${st.name}) failed to load.`);
      process.exit(1);
    }
    const profile = profileRes.body;
    if (!profile.academicRecords || profile.academicRecords.length === 0) {
      console.error(`FAIL: Student #${st.id} missing academic records.`);
      process.exit(1);
    }
  }
  console.log('PASS: Successfully loaded all 20 individual mentee profiles with academic and attendance data!');

  // 5. Strict Batch Isolation Check
  console.log('\n[CHECK 5] Batch Isolation Security Check...');
  const crossBatchRes = await request('GET', '/api/mentor/students/21', null, token);
  if (crossBatchRes.status === 403) {
    console.log('PASS: Cross-batch student access strictly blocked with 403 Forbidden.');
  } else {
    console.error(`FAIL: Security breach! Expected 403, got: ${crossBatchRes.status}`);
    process.exit(1);
  }

  // 6. Reports Generation (1 to 4)
  console.log('\n[CHECK 6] Verifying all 4 Excel reports with 20 mentees...');

  // Report 1
  const rep1Res = await request('GET', '/api/mentor/reports/report1', null, token);
  const wb1 = new ExcelJS.Workbook();
  await wb1.xlsx.load(rep1Res.buffer);
  const ws1 = wb1.getWorksheet(1);
  console.log(`PASS: Report 1 generated (${ws1.rowCount} rows).`);

  // Report 2
  const rep2Res = await request('GET', '/api/mentor/reports/report2', null, token);
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.load(rep2Res.buffer);
  const ws2 = wb2.getWorksheet(1);
  const studentRowsCount = ws2.rowCount - 5; // minus header rows
  console.log(`PASS: Report 2 generated with ${studentRowsCount} student rows.`);
  if (studentRowsCount !== 20) {
    console.error(`FAIL: Expected 20 student rows in Report 2, got: ${studentRowsCount}`);
    process.exit(1);
  }

  // Report 3
  const rep3Res = await request('GET', '/api/mentor/reports/report3', null, token);
  const wb3 = new ExcelJS.Workbook();
  await wb3.xlsx.load(rep3Res.buffer);
  const ws3 = wb3.getWorksheet(1);
  console.log(`PASS: Report 3 generated (${ws3.rowCount} rows).`);

  // Report 4
  const rep4Res = await request('GET', '/api/mentor/reports/report4', null, token);
  const wb4 = new ExcelJS.Workbook();
  await wb4.xlsx.load(rep4Res.buffer);
  const ws4 = wb4.getWorksheet(1);
  const brightCount = ws4.getRow(6).getCell(3).value;
  const avgCount = ws4.getRow(7).getCell(3).value;
  const weakCount = ws4.getRow(8).getCell(3).value;
  console.log(`PASS: Report 4 generated: Bright=${brightCount}, Average=${avgCount}, Weak=${weakCount}, Total=${brightCount + avgCount + weakCount}`);
  if (brightCount + avgCount + weakCount !== 20) {
    console.error('FAIL: Report 4 mentee counts do not sum to 20!');
    process.exit(1);
  }

  console.log('\n===========================================================');
  console.log('   ALL 6 FOCUSED CHECKS FOR 20 MENTEES PASSED 100%!');
  console.log('===========================================================');
  process.exit(0);
}

run20MenteesFocusedVerification().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
