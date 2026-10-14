/**
 * Enriches academic_records table with preceding semester records for all students:
 * - FY: Sem 1
 * - SY: Sem 1, Sem 2, Sem 3
 * - TY: Sem 1, Sem 2, Sem 3, Sem 4, Sem 5
 * - BTECH: Sem 1, Sem 2, Sem 3, Sem 4, Sem 5, Sem 6, Sem 7
 */

const path = require('path');
const Database = require(path.join(__dirname, '../../backend/node_modules/better-sqlite3'));
const db = new Database(path.join(__dirname, '../../database/mentor_mentee.db'));

console.log('Generating comprehensive semester records for all students...');

const students = db.prepare(`
  SELECT s.id, s.year, s.semester, s.ml_risk_level, ar.cgpa, ar.attendance_percentage, ar.ise_marks, ar.mse_marks, ar.ese_marks, ar.subjects_failed_count
  FROM students s
  LEFT JOIN academic_records ar ON s.id = ar.student_id AND ar.semester = s.semester
  ORDER BY s.id
`).all();

const insertRecord = db.prepare(`
  INSERT INTO academic_records (student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const checkExisting = db.prepare(`
  SELECT id FROM academic_records WHERE student_id = ? AND semester = ?
`);

let insertedCount = 0;

const run = db.transaction(() => {
  for (const st of students) {
    const currentSem = st.semester || (st.year === 1 ? 1 : (st.year === 2 ? 3 : (st.year === 3 ? 5 : 7)));
    const baseCgpa = st.cgpa || (st.ml_risk_level === 'Bright' ? 8.4 : (st.ml_risk_level === 'Weak' ? 5.8 : 7.2));
    const baseAtt = st.attendance_percentage || (st.ml_risk_level === 'Bright' ? 88.0 : (st.ml_risk_level === 'Weak' ? 66.0 : 81.0));
    const baseIse = st.ise_marks || (st.ml_risk_level === 'Bright' ? 18.5 : (st.ml_risk_level === 'Weak' ? 12.0 : 15.5));
    const baseMse = st.mse_marks || (st.ml_risk_level === 'Bright' ? 26.0 : (st.ml_risk_level === 'Weak' ? 17.5 : 22.0));
    const baseEse = st.ese_marks || (st.ml_risk_level === 'Bright' ? 62.0 : (st.ml_risk_level === 'Weak' ? 44.0 : 54.0));

    // Ensure all preceding semesters exist up to currentSem
    for (let sem = 1; sem <= currentSem; sem++) {
      const exists = checkExisting.get(st.id, sem);
      if (!exists) {
        // Deterministic variation based on student id and semester
        const seed = (st.id * 13 + sem * 17) % 100;
        const cgpaDelta = ((seed % 11) - 5) * 0.05; // -0.25 to +0.25
        const semCgpa = Math.min(9.8, Math.max(4.5, Number((baseCgpa + cgpaDelta).toFixed(2))));

        const attDelta = ((seed % 9) - 4) * 0.8; // -3.2% to +3.2%
        const semAtt = Math.min(96.0, Math.max(58.0, Number((baseAtt + attDelta).toFixed(1))));

        const iseDelta = ((seed % 7) - 3) * 0.3;
        const semIse = Math.min(20.0, Math.max(8.0, Number((baseIse + iseDelta).toFixed(1))));

        const mseDelta = ((seed % 7) - 3) * 0.5;
        const semMse = Math.min(30.0, Math.max(12.0, Number((baseMse + mseDelta).toFixed(1))));

        const eseDelta = ((seed % 7) - 3) * 1.0;
        const semEse = Math.min(70.0, Math.max(30.0, Number((baseEse + eseDelta).toFixed(1))));

        const fails = (st.ml_risk_level === 'Weak' && sem === 2) ? 1 : 0;
        const defaulter = semAtt < 75 ? 1 : 0;

        insertRecord.run(st.id, sem, semCgpa, semAtt, semIse, semMse, semEse, fails, defaulter);
        insertedCount++;
      }
    }
  }
});

run();
console.log(`Successfully inserted ${insertedCount} historical semester academic records!`);

const totalRecords = db.prepare('SELECT count(*) as count FROM academic_records').get();
console.log(`Total academic records now: ${totalRecords.count}`);
