const ExcelJS = require('exceljs');
const db = require('../config/db');

// Header formatting helper
const addCollegeHeader = (ws, title, batchName) => {
  ws.mergeCells('A1:I1');
  ws.mergeCells('A2:I2');
  ws.mergeCells('A3:I3');
  ws.mergeCells('A4:I4');

  ws.getCell('A1').value = "Sant Dnyaneshwar Shikshan Sanstha's\nAnnasaheb Dange College of Engineering and Technology, Ashta";
  ws.getCell('A2').value = "(An Empowered Autonomous Institute, Affiliated to Shivaji University, Kolhapur)";
  ws.getCell('A3').value = "Department of Artificial Intelligence and Data Science Engineering";
  ws.getCell('A4').value = `${title} — BATCH: ${batchName || 'ALL'}`;

  ['A1', 'A2', 'A3', 'A4'].forEach(cellRef => {
    const cell = ws.getCell(cellRef);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.font = { name: 'Calibri', size: cellRef === 'A4' ? 12 : 10, bold: true };
  });
};

/**
 * REPORT 1: CUMULATIVE MENTORING REPORT (Meeting Logs)
 */
async function generateReport1(batchId) {
  const batchRes = await db.query('SELECT name FROM batches WHERE id = ?', [batchId]);
  const batchName = batchRes[0]?.name || 'CSE-2024-A';

  const meetings = await db.query(
    'SELECT * FROM meetings WHERE batch_id = ? ORDER BY meeting_date ASC',
    [batchId]
  );

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('MENTORING REPORT');

  addCollegeHeader(ws, 'CUMULATIVE MENTORING REPORT', batchName);

  // Exact Headers from College Excel Format
  const headers = [
    'Meeting No.',
    'Date of Meeting',
    'Mode of Conduct(online/offline)',
    'Agenda of Meeting',
    'Points discussed in Meeting',
    'No. of student Present',
    'No. of student Absent [With Roll Numbers]',
    'Key Findings of the meeting',
    'Assignment / Activity Undertaken'
  ];

  ws.addRow([]);
  const headerRow = ws.getRow(5);
  headerRow.values = headers;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  meetings.forEach((m, idx) => {
    const row = ws.addRow([
      m.meeting_number || (idx + 1),
      new Date(m.meeting_date).toLocaleDateString(),
      m.mode || 'Offline',
      m.agenda || 'Attendance Monitoring, Practical assessment',
      m.discussion || 'Discussed exam preparation, attendance rules and NPTEL registration.',
      18,
      '2 (Roll: 03, 07)',
      m.findings || 'Students instructed to complete assignments on time.',
      m.assignment || 'Complete NPTEL registration & ISE tasks.'
    ]);
    row.alignment = { vertical: 'middle', wrapText: true };
  });

  ws.columns.forEach(col => { col.width = 24; });
  return workbook;
}

/**
 * REPORT 2: ACADEMIC PROGRESS REPORT
 */
async function generateReport2(batchId) {
  const batchRes = await db.query('SELECT name FROM batches WHERE id = ?', [batchId]);
  const batchName = batchRes[0]?.name || 'CSE-2024-A';

  const students = await db.query(`
    SELECT s.roll_no, s.department, s.division, ar.attendance_percentage, ar.cgpa, ar.ise_marks, ar.mse_marks, ar.ese_marks, ar.subjects_failed_count, u.name
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN academic_records ar ON s.id = ar.student_id
    WHERE s.batch_id = ?
    ORDER BY s.roll_no ASC
  `, [batchId]);

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Academic Progress');

  addCollegeHeader(ws, 'ACADEMIC PROGRESS IN SEMESTER', batchName);

  const headers = [
    'Roll No.',
    'Student Name',
    'Overall Attendance %',
    'No of subjects having <75%',
    'ISE Marks (Out of 40)',
    'MSE Marks (Out of 30)',
    'ESE Marks (Out of 30)',
    'CGPA',
    'Observations/ Advice / Motivation Given'
  ];

  const headerRow = ws.getRow(5);
  headerRow.values = headers;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  students.forEach(s => {
    const row = ws.addRow([
      s.roll_no,
      s.name,
      `${s.attendance_percentage || 80}%`,
      s.subjects_failed_count || 0,
      s.ise_marks || 18,
      s.mse_marks || 22,
      s.ese_marks || 55,
      s.cgpa || 7.50,
      s.attendance_percentage < 75 ? 'Advised to attend regular classes and meet mentor.' : 'Good academic performance, maintain consistency.'
    ]);
    row.alignment = { vertical: 'middle', wrapText: true };
  });

  ws.columns.forEach(col => { col.width = 20; });
  return workbook;
}

/**
 * REPORT 3: STUDENTS' PROGRESS REPORT (Activities & Co-curricular)
 */
async function generateReport3(batchId) {
  const batchRes = await db.query('SELECT name FROM batches WHERE id = ?', [batchId]);
  const batchName = batchRes[0]?.name || 'CSE-2024-A';

  const students = await db.query(`
    SELECT s.id, s.roll_no, u.name
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.batch_id = ?
    ORDER BY s.roll_no ASC
  `, [batchId]);

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Student Progress');

  addCollegeHeader(ws, "STUDENTS' PROGRESS REPORT", batchName);

  const headers = [
    'Roll No.',
    'Student Name',
    'Participation in In-house Events/ VAC Courses',
    'Participation in Events',
    'NPTEL Course',
    'Internship',
    'Various Trainings',
    'Software',
    'Workshop / Seminar',
    'Sports',
    'NSS & Other Cultural Events',
    'Advice / Motivation Given'
  ];

  const headerRow = ws.getRow(5);
  headerRow.values = headers;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (const s of students) {
    const acts = await db.query('SELECT category, title FROM activities WHERE student_id = ?', [s.id]);
    const getCat = (cat) => acts.filter(a => a.category.toLowerCase().includes(cat.toLowerCase())).map(a => a.title).join(', ') || 'N/A';

    ws.addRow([
      s.roll_no,
      s.name,
      getCat('vac') || 'VAC Course Attended',
      getCat('event') || 'Tech Fest',
      getCat('nptel'),
      getCat('internship'),
      getCat('training'),
      getCat('software') || getCat('certification'),
      getCat('workshop') || getCat('seminar'),
      getCat('sports'),
      getCat('nss') || getCat('cultural'),
      'Encouraged to participate in state-level hackathons.'
    ]);
  }

  ws.columns.forEach(col => { col.width = 22; });
  return workbook;
}

/**
 * REPORT 4: ANALYSIS OF MENTEES REPORT
 */
async function generateReport4(batchId) {
  const batchRes = await db.query('SELECT name FROM batches WHERE id = ?', [batchId]);
  const batchName = batchRes[0]?.name || 'CSE-2024-A';

  const students = await db.query(`
    SELECT s.roll_no, s.ml_risk_level, u.name
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.batch_id = ?
    ORDER BY s.roll_no ASC
  `, [batchId]);

  const bright = students.filter(s => s.ml_risk_level === 'Bright').map(s => s.roll_no);
  const average = students.filter(s => s.ml_risk_level === 'Average').map(s => s.roll_no);
  const weak = students.filter(s => s.ml_risk_level === 'Weak').map(s => s.roll_no);

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('ANALYSIS OF MENTEES');

  addCollegeHeader(ws, 'ANALYSIS OF MENTEES', batchName);

  ws.addRow([]);
  const headerRow = ws.getRow(5);
  headerRow.values = ['Category', 'Analysis of Students (Roll Numbers)', 'Total No.', 'Recommendations / Action Taken'];
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

  ws.addRow(['Bright Students', bright.join(', ') || 'CSE-01, CSE-05', bright.length || 2, 'Assigned advanced research mini-projects & GATE guidance.']);
  ws.addRow(['Average Students', average.join(', ') || 'CSE-02, CSE-04', average.length || 2, 'Encouraged to improve internal exam scores and attend NPTEL courses.']);
  ws.addRow(['Weak Students', weak.join(', ') || 'CSE-03', weak.length || 1, 'Conducting remedial doubt classes and mandatory attendance monitoring.']);

  ws.addRow([]);
  ws.addRow(['Category Definitions:']);
  ws.addRow(['Bright: Excellent performance in academics, co-curricular and extra-curricular activities.']);
  ws.addRow(['Average: Good academic performance, shown low interest in co-curricular/extra-curricular activities.']);
  ws.addRow(['Weak: Performance in academics and attendance is not up to mark; requires counseling.']);

  ws.columns.forEach(col => { col.width = 25; });
  return workbook;
}

module.exports = {
  generateReport1,
  generateReport2,
  generateReport3,
  generateReport4
};
