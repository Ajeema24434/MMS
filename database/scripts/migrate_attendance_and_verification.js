const path = require('path');
const Database = require(path.join(__dirname, '../../backend/node_modules/better-sqlite3'));

const dbPath = path.join(__dirname, '../../database/mentor_mentee.db');
const db = new Database(dbPath);

console.log('Connecting to SQLite DB:', dbPath);

// 1. ALTER ACTIVITIES TABLE IF NEEDED
const actCols = db.prepare('PRAGMA table_info(activities)').all().map(c => c.name);
if (!actCols.includes('status')) {
  db.exec("ALTER TABLE activities ADD COLUMN status VARCHAR(50) DEFAULT 'Approved'");
  console.log('Added status column to activities');
}
if (!actCols.includes('evidence_url')) {
  db.exec("ALTER TABLE activities ADD COLUMN evidence_url VARCHAR(255) DEFAULT 'certificate.pdf'");
  console.log('Added evidence_url column to activities');
}
if (!actCols.includes('mentor_remarks')) {
  db.exec("ALTER TABLE activities ADD COLUMN mentor_remarks TEXT");
  console.log('Added mentor_remarks column to activities');
}

// 2. CREATE MEETING_ATTENDEES TABLE
db.exec(`
  CREATE TABLE IF NOT EXISTS meeting_attendees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INT NOT NULL,
    student_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Present',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meeting_id, student_id)
  )
`);
console.log('Ensured meeting_attendees table exists');

// 3. OFFICIAL AUGUST 2026 ATTENDANCE DATA FOR TY B.TECH (AI & DS)
// 14 Defaulters from Page 1 with Course <75% count & Overall Average:
const tyAttendance = {
  // Page 2: Roll 3002 to 3025
  '3002': { att: 89, def: 0, fail: 0 },
  '3003': { att: 78, def: 1, fail: 2 }, // Defaulter (Pranav Patil)
  '3004': { att: 97, def: 0, fail: 0 },
  '3005': { att: 71, def: 1, fail: 5 }, // Defaulter (Pradnya Yavatkar)
  '3006': { att: 83, def: 0, fail: 0 },
  '3007': { att: 87, def: 0, fail: 0 },
  '3008': { att: 92, def: 0, fail: 0 },
  '3009': { att: 87, def: 0, fail: 0 },
  '3010': { att: 83, def: 0, fail: 0 },
  '3011': { att: 84, def: 1, fail: 2 }, // Defaulter (Vaishnavi Deshmukh)
  '3012': { att: 83, def: 0, fail: 0 },
  '3013': { att: 93, def: 0, fail: 0 },
  '3014': { att: 92, def: 0, fail: 0 },
  '3015': { att: 90, def: 0, fail: 0 },
  '3016': { att: 92, def: 0, fail: 0 },
  '3017': { att: 91, def: 0, fail: 0 },
  '3018': { att: 82, def: 0, fail: 0 },
  '3019': { att: 86, def: 0, fail: 0 },
  '3020': { att: 85, def: 0, fail: 0 },
  '3021': { att: 82, def: 0, fail: 0 },
  '3022': { att: 89, def: 0, fail: 0 },
  '3023': { att: 88, def: 0, fail: 0 },
  '3024': { att: 80, def: 1, fail: 2 }, // Defaulter (Kirti Nalage)
  '3025': { att: 86, def: 0, fail: 0 },

  // Page 3: Roll 3026 to 3055
  '3026': { att: 87, def: 0, fail: 0 },
  '3027': { att: 84, def: 0, fail: 0 },
  '3028': { att: 89, def: 0, fail: 0 },
  '3029': { att: 79, def: 0, fail: 0 },
  '3030': { att: 82, def: 0, fail: 0 },
  '3031': { att: 85, def: 0, fail: 0 },
  '3032': { att: 82, def: 0, fail: 0 },
  '3033': { att: 70, def: 1, fail: 5 }, // Defaulter (Aditya Salve)
  '3034': { att: 88, def: 0, fail: 0 },
  '3035': { att: 92, def: 0, fail: 0 },
  '3036': { att: 79, def: 1, fail: 2 }, // Defaulter (Prerna Zagade)
  '3037': { att: 80, def: 0, fail: 0 },
  '3038': { att: 81, def: 0, fail: 0 },
  '3039': { att: 88, def: 0, fail: 0 },
  '3040': { att: 92, def: 0, fail: 0 },
  '3041': { att: 77, def: 1, fail: 2 }, // Defaulter (Saniya Shaikh)
  '3042': { att: 93, def: 0, fail: 0 },
  '3043': { att: 80, def: 1, fail: 4 }, // Defaulter (Jidnyasa Jadhav)
  '3044': { att: 83, def: 0, fail: 0 },
  '3045': { att: 90, def: 0, fail: 0 },
  '3046': { att: 92, def: 0, fail: 0 },
  '3047': { att: 94, def: 0, fail: 0 },
  '3048': { att: 89, def: 0, fail: 0 },
  '3049': { att: 84, def: 0, fail: 0 },
  '3050': { att: 94, def: 0, fail: 0 },
  '3051': { att: 93, def: 0, fail: 0 },
  '3052': { att: 86, def: 0, fail: 0 },
  '3053': { att: 86, def: 0, fail: 0 },
  '3054': { att: 90, def: 0, fail: 0 },
  '3055': { att: 76, def: 1, fail: 3 }, // Defaulter (Shubham Kadam)

  // Page 4: Roll 3056 to 3073
  '3056': { att: 83, def: 1, fail: 2 }, // Defaulter (Tejas Jadhav)
  '3057': { att: 91, def: 0, fail: 0 },
  '3058': { att: 88, def: 0, fail: 0 },
  '3059': { att: 81, def: 0, fail: 0 },
  '3060': { att: 84, def: 0, fail: 0 },
  '3061': { att: 81, def: 1, fail: 2 }, // Defaulter (Rabiya Devale)
  '3062': { att: 90, def: 0, fail: 0 },
  '3063': { att: 89, def: 0, fail: 0 },
  '3064': { att: 90, def: 0, fail: 0 },
  '3065': { att: 83, def: 0, fail: 0 },
  '3066': { att: 90, def: 0, fail: 0 },
  '3067': { att: 85, def: 0, fail: 0 },
  '3068': { att: 80, def: 1, fail: 2 }, // Defaulter (Chinmay Deshmukh)
  '3069': { att: 83, def: 0, fail: 0 },
  '3070': { att: 77, def: 1, fail: 3 }, // Defaulter (Neha Sonawale)
  '3071': { att: 87, def: 0, fail: 0 },
  '3072': { att: 87, def: 0, fail: 0 },
  '3073': { att: 81, def: 1, fail: 2 }  // Defaulter (Khadija Jamadar)
};

// Also Roll 3001
tyAttendance['3001'] = { att: 88, def: 0, fail: 0 };

// 4. UPDATE TY STUDENTS IN ACADEMIC RECORDS & STUDENTS TABLE
const tyStudents = db.prepare('SELECT id, roll_no, urn FROM students WHERE year = 3').all();
console.log(`Found ${tyStudents.length} TY students to update with August attendance`);

const updateAcad = db.prepare(`
  UPDATE academic_records
  SET attendance_percentage = ?, defaulter_flag = ?, subjects_failed_count = ?
  WHERE student_id = ? AND semester = 5
`);

const insertAcad = db.prepare(`
  INSERT INTO academic_records (student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag)
  VALUES (?, 5, ?, ?, 20.0, 24.0, 60.0, ?, ?)
`);

const updateStudentRisk = db.prepare(`
  UPDATE students
  SET ml_risk_level = ?
  WHERE id = ?
`);

db.transaction(() => {
  let updatedCount = 0;
  for (const st of tyStudents) {
    const data = tyAttendance[st.roll_no] || { att: 85, def: 0, fail: 0 };
    
    // Check if record for semester 5 exists
    const rec = db.prepare('SELECT id FROM academic_records WHERE student_id = ? AND semester = 5').get(st.id);
    if (rec) {
      updateAcad.run(data.att, data.def, data.fail, st.id);
    } else {
      const cgpa = data.def ? 6.85 : 8.10;
      insertAcad.run(st.id, cgpa, data.att, data.fail, data.def);
    }

    // Dynamic risk assessment based on August attendance:
    // If defaulter or att < 75 -> Weak
    // If att >= 90 and not defaulter -> Bright
    // Else -> Average
    let risk = 'Average';
    if (data.def || data.att < 75) {
      risk = 'Weak';
    } else if (data.att >= 90) {
      risk = 'Bright';
    }
    updateStudentRisk.run(risk, st.id);
    updatedCount++;
  }
  console.log(`Updated ${updatedCount} TY students with August attendance & realistic ML risk levels!`);
})();

// 5. SEED INITIAL MEETING ATTENDANCE FOR EXISTING MEETINGS
const meetings = db.prepare('SELECT id, batch_id FROM meetings').all();
console.log(`Found ${meetings.length} meetings. Seeding attendee attendance...`);

const insertAttendee = db.prepare(`
  INSERT OR IGNORE INTO meeting_attendees (meeting_id, student_id, status, remarks)
  VALUES (?, ?, ?, ?)
`);

db.transaction(() => {
  let seededAttendees = 0;
  for (const m of meetings) {
    const batchStudents = db.prepare('SELECT id, roll_no FROM students WHERE batch_id = ?').all(m.batch_id);
    for (const bs of batchStudents) {
      // 90% present, 10% absent deterministically
      const isAbsent = (bs.id * 13 + m.id * 7) % 10 === 0;
      const status = isAbsent ? 'Absent' : 'Present';
      const remarks = isAbsent ? 'Informed faculty (Medical/Personal)' : 'Attended discussion actively';
      insertAttendee.run(m.id, bs.id, status, remarks);
      seededAttendees++;
    }
  }
  console.log(`Seeded ${seededAttendees} meeting attendee records!`);
})();

// 6. POPULATE SAMPLE PENDING ACTIVITIES WITH EVIDENCE FOR MENTOR VERIFICATION
const sampleActivities = [
  { roll: '3002', title: 'AWS Cloud Practitioner Certification', category: 'Certification', desc: 'Completed AWS Certified Cloud Practitioner examination with 860/1000 score.', evidence: 'AWS_Cloud_Certificate.pdf' },
  { roll: '3005', title: 'NPTEL Elite Certificate - Python Programming', category: 'Certification', desc: 'Completed 8-week NPTEL course with top 5% Elite certificate.', evidence: 'NPTEL_Python_Elite.pdf' },
  { roll: '3011', title: 'Smart India Hackathon 2026 Participation', category: 'Hackathon', desc: 'Participated in SIH internal college round with Smart Attendance prototype.', evidence: 'SIH2026_Certificate.pdf' },
  { roll: '3024', title: 'Paper Presentation at National Tech Conference', category: 'Paper Presentation', desc: 'Presented paper on IoT & AI in Agriculture at TechFest 2026.', evidence: 'Conference_Paper_Certificate.pdf' },
  { roll: '3033', title: 'State Level NSS Camp Volunteer', category: 'Sports / NSS', desc: 'Served as 7-day residential camp volunteer for rural community health.', evidence: 'NSS_Camp_Volunteer_Certificate.pdf' },
  { roll: '3041', title: 'Coursera Deep Learning Specialization', category: 'Certification', desc: 'Completed 5-course Deep Learning series by Andrew Ng with honors.', evidence: 'Coursera_DeepLearning_Specialization.pdf' }
];

const insertAct = db.prepare(`
  INSERT INTO activities (student_id, title, category, description, date_achieved, evidence_url, status)
  VALUES (?, ?, ?, ?, '2026-08-15', ?, 'Pending')
`);

db.transaction(() => {
  let actCount = 0;
  for (const sa of sampleActivities) {
    const st = db.prepare('SELECT id FROM students WHERE roll_no = ?').get(sa.roll);
    if (st) {
      // Check if already exists
      const exist = db.prepare('SELECT id FROM activities WHERE student_id = ? AND title = ?').get(st.id, sa.title);
      if (!exist) {
        insertAct.run(st.id, sa.title, sa.category, sa.desc, sa.evidence);
        actCount++;
      }
    }
  }
  console.log(`Added ${actCount} new pending student activities with certificate evidence for mentor review!`);
})();

console.log('Migration completed successfully!');
