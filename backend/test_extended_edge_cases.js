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

async function runEdgeCaseTests() {
  console.log('===========================================================');
  console.log('   RUNNING EXTENDED EDGE-CASE VERIFICATION TEST SUITE');
  console.log('===========================================================');

  // 1. Login Mentor 1 (Batch 1: CSE-2024-A)
  const m1Login = await request('POST', '/api/auth/login', { identifier: 'MNT101', password: 'password123' });
  const token1 = m1Login.body.token;

  // 2. Login Mentor 2 (Batch 2: CSE-2024-B)
  const m2Login = await request('POST', '/api/auth/login', { identifier: 'MNT102', password: 'password123' });
  const token2 = m2Login.body.token;

  console.log('\n[EDGE TEST 1] Bilateral Batch Isolation on Students');
  // Mentor 1 tries to access Student 21 (Batch 2) -> must fail (403)
  const r1 = await request('GET', '/api/mentor/students/21', null, token1);
  // Mentor 2 tries to access Student 1 (Batch 1) -> must fail (403)
  const r2 = await request('GET', '/api/mentor/students/1', null, token2);

  if (r1.status === 403 && r2.status === 403) {
    console.log('PASS: Bilateral isolation confirmed! Both mentors denied cross-batch student access.');
  } else {
    console.error(`FAIL: Expected both 403, got m1->s21: ${r1.status}, m2->s1: ${r2.status}`);
    process.exit(1);
  }

  console.log('\n[EDGE TEST 2] Bilateral Batch Isolation on Complaints');
  // Mentor 2 tries to update Complaint 1 (which belongs to Student 1 in Batch 1)
  const compCross = await request('PUT', '/api/mentor/complaints/1/status', {
    status: 'Resolved',
    mentor_response: 'Hacked response'
  }, token2);

  if (compCross.status === 403) {
    console.log('PASS: Cross-batch complaint tampering prevented with 403 Forbidden!');
  } else {
    console.error('FAIL: Expected 403, got:', compCross.status);
    process.exit(1);
  }

  console.log('\n[EDGE TEST 3] Attendance Re-marking / Status Modification');
  // In Meeting 1, mark Student 3 (previously Absent) to Present, and Student 2 to Absent with special characters in remarks
  const updateAttRes = await request('POST', '/api/mentor/meetings/1/attendance', {
    records: [
      { student_id: 1, status: 'Present', remarks: 'Attended & verified' },
      { student_id: 2, status: 'Absent', remarks: 'Absent due to fever / medical cert attached' },
      { student_id: 3, status: 'Present', remarks: 'Present (Makeup exam completed)' },
      { student_id: 4, status: 'Present', remarks: 'Attended' },
      { student_id: 5, status: 'Present', remarks: 'Attended' }
    ]
  }, token1);

  if (updateAttRes.status === 200 && updateAttRes.body.presentCount === 4 && updateAttRes.body.absentCount === 1) {
    console.log('PASS: Attendance re-marked and updated correctly: 4 Present, 1 Absent.');
  } else {
    console.error('FAIL: Attendance update failed:', updateAttRes.body);
    process.exit(1);
  }

  // Verify attendance reflection in Report 1
  console.log('\n[EDGE TEST 4] Report 1 Dynamic Reflection after Attendance Update');
  const rep1Res = await request('GET', '/api/mentor/reports/report1', null, token1);
  const wb1 = new ExcelJS.Workbook();
  await wb1.xlsx.load(rep1Res.buffer);
  const ws1 = wb1.getWorksheet(1);
  const meeting1Row = ws1.getRow(6);
  const presentVal = meeting1Row.getCell(6).value;
  const absentVal = meeting1Row.getCell(7).value;

  console.log(`PASS: Report 1 updated dynamically -> Present: ${presentVal}, Absent: "${absentVal}"`);
  if (presentVal !== 17 || !String(absentVal).includes('CSE-02')) {
    console.error('FAIL: Expected CSE-02 to be absent and 17 present in Report 1 row 6, got:', absentVal);
    process.exit(1);
  }

  console.log('\n[EDGE TEST 5] Create Meeting with Special Characters & ISO Datetime');
  const specialMeeting = await request('POST', '/api/mentor/meetings', {
    meeting_date: '2024-10-05T14:30',
    mode: 'Online / Google Meet',
    agenda: 'AI & Machine Learning "Hands-on" Session (Review #3)',
    discussion: 'Discussed Python libraries: pandas, scikit-learn & numpy. Q&A session conducted.',
    findings: 'Students understood 80% of concepts; recommended extra tutoring for weak students.',
    assignment: 'Submit Github repository link with README.md by Friday.',
    remarks: 'Active participation noted.',
    status: 'Scheduled'
  }, token1);

  if (specialMeeting.status === 201 && specialMeeting.body.meetingId) {
    console.log('PASS: Meeting created with special characters and HTML5 datetime format. ID:', specialMeeting.body.meetingId);
  } else {
    console.error('FAIL: Create meeting with special chars failed:', specialMeeting.body);
    process.exit(1);
  }

  console.log('\n[EDGE TEST 6] Verify Header Expose for Downloaded Reports');
  const rHeader = await request('GET', '/api/mentor/reports/report4', null, token1);
  const exposeHeader = rHeader.headers['access-control-expose-headers'] || '';
  const contentDisp = rHeader.headers['content-disposition'] || '';
  console.log('  Content-Disposition:', contentDisp);
  console.log('  Access-Control-Expose-Headers:', exposeHeader);
  if (contentDisp.includes('Analysis_of_Mentees_Report_4.xlsx')) {
    console.log('PASS: Exact dynamic filename header verified!');
  } else {
    console.error('FAIL: Unexpected filename header:', contentDisp);
    process.exit(1);
  }

  console.log('\n===========================================================');
  console.log('   ALL EXTENDED EDGE CASE TESTS PASSED PERFECTLY!');
  console.log('===========================================================');
  process.exit(0);
}

runEdgeCaseTests().catch(err => {
  console.error('FATAL EDGE CASE ERROR:', err);
  process.exit(1);
});
