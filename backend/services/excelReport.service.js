const ExcelJS = require('exceljs');
const db = require('../config/db');

// Border styling helper
const thinBorder = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
};

// Header formatting helper matching official college template
const addCollegeHeader = (ws, title, batchName, lastColLetter = 'I') => {
  ws.mergeCells(`A1:${lastColLetter}1`);
  ws.mergeCells(`A2:${lastColLetter}2`);
  ws.mergeCells(`A3:${lastColLetter}3`);
  ws.mergeCells(`A4:${lastColLetter}4`);

  ws.getCell('A1').value = "Sant Dnyaneshwar Shikshan Sanstha's\nAnnasaheb Dange College of Engineering and Technology, Ashta";
  ws.getCell('A2').value = "(An Empowered Autonomous Institute, Affiliated to Shivaji University, Kolhapur)";
  ws.getCell('A3').value = "Department of Artificial Intelligence and Data Science Engineering";
  ws.getCell('A4').value = `${title} — BATCH: ${batchName || 'ALL'}`;

  ['A1', 'A2', 'A3', 'A4'].forEach(cellRef => {
    const cell = ws.getCell(cellRef);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.font = { name: 'Calibri', size: cellRef === 'A4' ? 12 : 10, bold: true };
  });

  ws.getRow(1).height = 28;
  ws.getRow(2).height = 18;
  ws.getRow(3).height = 18;
  ws.getRow(4).height = 24;
};

/**
 * REPORT 1: CUMULATIVE MENTORING REPORT (Meeting & Attendance Logs)
 * Dynamic data from database `meetings` and `attendance` tables.
 */
async function generateReport1(batchId) {
  const batchRes = await db.query('SELECT name FROM batches WHERE id = ?', [batchId]);
  const batchName = batchRes[0]?.name || 'N/A';

  const meetings = await db.query(
    'SELECT * FROM meetings WHERE batch_id = ? ORDER BY meeting_date ASC',
    [batchId]
  );

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('MENTORING REPORT');

  addCollegeHeader(ws, 'CUMULATIVE MENTORING REPORT', batchName, 'I');

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
  headerRow.height = 30;
  headerRow.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let i = 1; i <= headers.length; i++) {
    headerRow.getCell(i).border = thinBorder;
  }

  if (meetings.length === 0) {
    const emptyRow = ws.addRow(['No meetings recorded for this batch', '', '', '', '', '', '', '', '']);
    emptyRow.alignment = { horizontal: 'center', vertical: 'middle' };
  } else {
    for (let idx = 0; idx < meetings.length; idx++) {
      const m = meetings[idx];

      // Query actual attendance for this specific meeting
      const attRecords = await db.query(`
        SELECT a.status, s.roll_no
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE a.meeting_id = ?
        ORDER BY s.roll_no ASC
      `, [m.id]);

      let presentCount = 0;
      let absentText = '0';

      if (attRecords.length > 0) {
        presentCount = attRecords.filter(a => a.status === 'Present').length;
        const absentList = attRecords.filter(a => a.status === 'Absent');
        if (absentList.length > 0) {
          absentText = `${absentList.length} (Roll: ${absentList.map(a => a.roll_no).join(', ')})`;
        } else {
          absentText = '0';
        }
      } else {
        presentCount = 0;
        absentText = 'N/A (Not marked)';
      }

      const meetingDateStr = m.meeting_date ? new Date(m.meeting_date).toLocaleDateString('en-GB') : 'N/A';

      const row = ws.addRow([
        m.meeting_number || (idx + 1),
        meetingDateStr,
        m.mode || 'Offline',
        m.agenda || 'N/A',
        m.discussion || 'N/A',
        presentCount,
        absentText,
        m.findings || 'N/A',
        m.assignment || 'N/A'
      ]);

      row.height = 28;
      row.alignment = { vertical: 'middle', wrapText: true };

      // Align specific columns
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      for (let c = 1; c <= headers.length; c++) {
        row.getCell(c).border = thinBorder;
      }
    }
  }

  // Column widths
  ws.columns = [
    { width: 14 }, // Meeting No.
    { width: 16 }, // Date
    { width: 22 }, // Mode
    { width: 32 }, // Agenda
    { width: 35 }, // Discussion
    { width: 16 }, // Present
    { width: 26 }, // Absent
    { width: 32 }, // Findings
    { width: 32 }  // Assignment
  ];

  return workbook;
}

/**
 * REPORT 2: ACADEMIC PROGRESS REPORT
 * Dynamic data from database `academic_records` and `students` tables.
 */
async function generateReport2(batchId) {
  const batchRes = await db.query('SELECT name FROM batches WHERE id = ?', [batchId]);
  const batchName = batchRes[0]?.name || 'N/A';

  const students = await db.query(`
    SELECT s.roll_no, u.name,
           ar.attendance_percentage, ar.cgpa, ar.ise_marks, ar.mse_marks, ar.ese_marks,
           ar.subjects_failed_count, ar.defaulter_flag
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN academic_records ar ON s.id = ar.student_id
    WHERE s.batch_id = ?
    ORDER BY s.roll_no ASC
  `, [batchId]);

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Academic Progress');

  addCollegeHeader(ws, 'ACADEMIC PROGRESS IN SEMESTER', batchName, 'I');

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

  ws.addRow([]);
  const headerRow = ws.getRow(5);
  headerRow.values = headers;
  headerRow.height = 30;
  headerRow.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let i = 1; i <= headers.length; i++) {
    headerRow.getCell(i).border = thinBorder;
  }

  if (students.length === 0) {
    const emptyRow = ws.addRow(['No students found in assigned batch', '', '', '', '', '', '', '', '']);
    emptyRow.alignment = { horizontal: 'center', vertical: 'middle' };
  } else {
    students.forEach(s => {
      let advice = 'Satisfactory academic progress. Advised to maintain consistency.';
      if (s.attendance_percentage === null || s.attendance_percentage === undefined) {
        advice = 'Academic records pending entry.';
      } else if (Number(s.attendance_percentage) < 75) {
        advice = `Attendance below 75% (${s.attendance_percentage}%). Advised to attend classes regularly to prevent defaulter penalty.`;
      } else if (s.subjects_failed_count > 0) {
        advice = `Has ${s.subjects_failed_count} subject backlog(s). Remedial tutoring recommended.`;
      } else if (Number(s.cgpa) >= 8.5) {
        advice = `Excellent performance (CGPA ${s.cgpa}). Advised to pursue advanced technical certifications & GATE.`;
      }

      const row = ws.addRow([
        s.roll_no || 'N/A',
        s.name || 'N/A',
        s.attendance_percentage !== null && s.attendance_percentage !== undefined ? `${s.attendance_percentage}%` : 'N/A',
        s.subjects_failed_count !== null && s.subjects_failed_count !== undefined ? s.subjects_failed_count : 0,
        s.ise_marks !== null && s.ise_marks !== undefined ? s.ise_marks : 'N/A',
        s.mse_marks !== null && s.mse_marks !== undefined ? s.mse_marks : 'N/A',
        s.ese_marks !== null && s.ese_marks !== undefined ? s.ese_marks : 'N/A',
        s.cgpa !== null && s.cgpa !== undefined ? Number(s.cgpa).toFixed(2) : 'N/A',
        advice
      ]);

      row.height = 25;
      row.alignment = { vertical: 'middle', wrapText: true };

      // Align columns
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

      for (let c = 1; c <= headers.length; c++) {
        row.getCell(c).border = thinBorder;
      }
    });
  }

  ws.columns = [
    { width: 14 }, // Roll No
    { width: 25 }, // Name
    { width: 20 }, // Attendance %
    { width: 22 }, // Subjects < 75%
    { width: 18 }, // ISE
    { width: 18 }, // MSE
    { width: 18 }, // ESE
    { width: 14 }, // CGPA
    { width: 42 }  // Advice
  ];

  return workbook;
}

/**
 * REPORT 3: STUDENTS' PROGRESS REPORT (Activities & Co-curricular)
 * Dynamic data from database `activities` table categorized cleanly.
 */
async function generateReport3(batchId) {
  const batchRes = await db.query('SELECT name FROM batches WHERE id = ?', [batchId]);
  const batchName = batchRes[0]?.name || 'N/A';

  const students = await db.query(`
    SELECT s.id, s.roll_no, u.name
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.batch_id = ?
    ORDER BY s.roll_no ASC
  `, [batchId]);

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Student Progress');

  addCollegeHeader(ws, "STUDENTS' PROGRESS REPORT", batchName, 'L');

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

  ws.addRow([]);
  const headerRow = ws.getRow(5);
  headerRow.values = headers;
  headerRow.height = 32;
  headerRow.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let i = 1; i <= headers.length; i++) {
    headerRow.getCell(i).border = thinBorder;
  }

  if (students.length === 0) {
    const emptyRow = ws.addRow(['No students found in assigned batch', '', '', '', '', '', '', '', '', '', '', '']);
    emptyRow.alignment = { horizontal: 'center', vertical: 'middle' };
  } else {
    for (const s of students) {
      const acts = await db.query(
        'SELECT category, title FROM activities WHERE student_id = ?',
        [s.id]
      );

      // Clean category matching from actual activity data
      const getCat = (keywords) => {
        const matches = acts.filter(a => {
          const cat = (a.category || '').toLowerCase();
          const title = (a.title || '').toLowerCase();
          return keywords.some(k => cat.includes(k) || title.includes(k));
        });
        return matches.length > 0 ? matches.map(m => m.title).join('; ') : 'N/A';
      };

      const inHouseVac = getCat(['vac', 'in-house', 'in house']);
      const events = getCat(['event', 'hackathon', 'competition', 'fest']);
      const nptel = getCat(['nptel', 'swayam', 'mooc']);
      const internship = getCat(['internship', 'intern']);
      const trainings = getCat(['training', 'course']);
      const software = getCat(['software', 'certification', 'certificate']);
      const workshop = getCat(['workshop', 'seminar', 'webinar']);
      const sports = getCat(['sport', 'cricket', 'football', 'athletics', 'badminton']);
      const nssCultural = getCat(['nss', 'cultural', 'gathering', 'lakshya', 'drama', 'dance']);

      let advice = 'Encouraged to enroll in NPTEL certifications and department workshops.';
      if (acts.length > 0) {
        advice = 'Commended for active co-curricular engagement. Encouraged to aim for national competitions.';
      }

      const row = ws.addRow([
        s.roll_no || 'N/A',
        s.name || 'N/A',
        inHouseVac,
        events,
        nptel,
        internship,
        trainings,
        software,
        workshop,
        sports,
        nssCultural,
        advice
      ]);

      row.height = 28;
      row.alignment = { vertical: 'middle', wrapText: true };
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      for (let c = 1; c <= headers.length; c++) {
        row.getCell(c).border = thinBorder;
      }
    }
  }

  ws.columns = [
    { width: 14 }, // Roll No
    { width: 22 }, // Name
    { width: 25 }, // In-house / VAC
    { width: 22 }, // Events
    { width: 22 }, // NPTEL
    { width: 22 }, // Internship
    { width: 20 }, // Trainings
    { width: 22 }, // Software
    { width: 24 }, // Workshop
    { width: 20 }, // Sports
    { width: 24 }, // NSS/Cultural
    { width: 35 }  // Advice
  ];

  return workbook;
}

/**
 * REPORT 4: ANALYSIS OF MENTEES REPORT
 * Dynamic classification based on ML risk level from database.
 */
async function generateReport4(batchId) {
  const batchRes = await db.query('SELECT name FROM batches WHERE id = ?', [batchId]);
  const batchName = batchRes[0]?.name || 'N/A';

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
  const pending = students.filter(s => s.ml_risk_level === 'Pending' || !s.ml_risk_level).map(s => s.roll_no);

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('ANALYSIS OF MENTEES');

  addCollegeHeader(ws, 'ANALYSIS OF MENTEES', batchName, 'D');

  ws.addRow([]);
  const headerRow = ws.getRow(5);
  headerRow.values = [
    'Category',
    'Analysis of Students (Roll Numbers)',
    'Total No.',
    'Recommendations / Action Taken'
  ];
  headerRow.height = 28;
  headerRow.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let i = 1; i <= 4; i++) {
    headerRow.getCell(i).border = thinBorder;
  }

  // Data rows with real student counts and roll numbers
  const categoriesData = [
    {
      category: 'Bright Students',
      rolls: bright.length > 0 ? bright.join(', ') : 'None',
      count: bright.length,
      action: 'Assigned advanced research mini-projects, competitive coding guidance, and GATE preparation.'
    },
    {
      category: 'Average Students',
      rolls: average.length > 0 ? average.join(', ') : 'None',
      count: average.length,
      action: 'Encouraged to improve internal exam scores, clarify doubt concepts, and complete NPTEL certifications.'
    },
    {
      category: 'Weak Students',
      rolls: weak.length > 0 ? weak.join(', ') : 'None',
      count: weak.length,
      action: 'Conducting remedial doubt classes, mandatory weekly attendance monitoring, and parent communication.'
    }
  ];

  if (pending.length > 0) {
    categoriesData.push({
      category: 'Pending Assessment',
      rolls: pending.join(', '),
      count: pending.length,
      action: 'Academic and attendance data under review; classification pending semester evaluation.'
    });
  }

  categoriesData.forEach(cat => {
    const row = ws.addRow([
      cat.category,
      cat.rolls,
      cat.count,
      cat.action
    ]);
    row.height = 25;
    row.alignment = { vertical: 'middle', wrapText: true };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

    for (let c = 1; c <= 4; c++) {
      row.getCell(c).border = thinBorder;
    }
  });

  // Category Definitions Section
  ws.addRow([]);
  const defHeaderRow = ws.addRow(['Category Definitions:']);
  defHeaderRow.font = { name: 'Calibri', bold: true, size: 10 };

  const defs = [
    'Bright: Excellent performance in academics, co-curricular and extra-curricular activities.',
    'Average: Good academic performance, shown low interest in co-curricular/extra-curricular activities.',
    'Weak: Performance in academics and attendance is not up to mark; requires counseling and remedial support.'
  ];
  if (pending.length > 0) {
    defs.push('Pending: Freshly enrolled or incomplete performance metrics awaiting model assessment.');
  }

  defs.forEach(d => {
    const r = ws.addRow([d]);
    r.font = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF4B5563' } };
  });

  ws.columns = [
    { width: 22 }, // Category
    { width: 45 }, // Roll Numbers
    { width: 14 }, // Total No.
    { width: 60 }  // Recommendations
  ];

  return workbook;
}

module.exports = {
  generateReport1,
  generateReport2,
  generateReport3,
  generateReport4
};
