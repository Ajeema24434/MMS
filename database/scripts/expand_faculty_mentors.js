const path = require('path');
const bcrypt = require(path.join(__dirname, '../../backend/node_modules/bcryptjs'));
const Database = require(path.join(__dirname, '../../backend/node_modules/better-sqlite3'));

const dbPath = path.join(__dirname, '../../database/mentor_mentee.db');
const db = new Database(dbPath);

console.log('Connecting to SQLite DB:', dbPath);

const facultyList = [
  // FY Batches (1..8)
  {
    batchId: 1,
    batchName: 'FY-AIDS-A-B1',
    mentorCode: 'MNT101',
    name: 'Dr. Ramesh Sharma',
    email: 'ramesh.sharma@adcet.in',
    phone: '9876543210',
    designation: 'Associate Professor',
    department: 'AI & DS'
  },
  {
    batchId: 2,
    batchName: 'FY-AIDS-A-B2',
    mentorCode: 'MNT102',
    name: 'Prof. Sunita Patil',
    email: 'sunita.patil@adcet.in',
    phone: '9876543211',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 3,
    batchName: 'FY-AIDS-A-B3',
    mentorCode: 'MNT103',
    name: 'Dr. Amit Verma',
    email: 'amit.verma@adcet.in',
    phone: '9876543212',
    designation: 'Associate Professor',
    department: 'AI & DS'
  },
  {
    batchId: 4,
    batchName: 'FY-AIDS-A-B4',
    mentorCode: 'MNT104',
    name: 'Prof. Neha Gupta',
    email: 'neha.gupta@adcet.in',
    phone: '9876543213',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 5,
    batchName: 'FY-AIDS-B-B1',
    mentorCode: 'MNT105',
    name: 'Prof. Rahul Verma',
    email: 'rahul.verma@adcet.in',
    phone: '9876543214',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 6,
    batchName: 'FY-AIDS-B-B2',
    mentorCode: 'MNT106',
    name: 'Prof. Anjali Shinde',
    email: 'anjali.shinde@adcet.in',
    phone: '9876543215',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 7,
    batchName: 'FY-AIDS-B-B3',
    mentorCode: 'MNT107',
    name: 'Prof. Sachin Mane',
    email: 'sachin.mane@adcet.in',
    phone: '9876543216',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 8,
    batchName: 'FY-AIDS-B-B4',
    mentorCode: 'MNT108',
    name: 'Prof. Neha Kadam',
    email: 'neha.kadam@adcet.in',
    phone: '9876543217',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },

  // SY Batches (9..12)
  {
    batchId: 9,
    batchName: 'SY-AIDS-A-B1',
    mentorCode: 'MNT109',
    name: 'Prof. Mahesh Pawar',
    email: 'mahesh.pawar@adcet.in',
    phone: '9876543218',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 10,
    batchName: 'SY-AIDS-A-B2',
    mentorCode: 'MNT110',
    name: 'Prof. Sandeep Chavan',
    email: 'sandeep.chavan@adcet.in',
    phone: '9876543219',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 11,
    batchName: 'SY-AIDS-A-B3',
    mentorCode: 'MNT111',
    name: 'Prof. Pooja Jadhav',
    email: 'pooja.jadhav@adcet.in',
    phone: '9876543220',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 12,
    batchName: 'SY-AIDS-A-B4',
    mentorCode: 'MNT112',
    name: 'Prof. Nitin Salunkhe',
    email: 'nitin.salunkhe@adcet.in',
    phone: '9876543221',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },

  // TY Batches (13..16) — EXACT FACULTY FROM OFFICIAL PDF
  {
    batchId: 13,
    batchName: 'TY-AIDS-A-B1',
    mentorCode: 'MNT113',
    name: 'Prof. Vikas Honmane',
    email: 'vh_aids@adcet.in',
    phone: '7709700173',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 14,
    batchName: 'TY-AIDS-A-B2',
    mentorCode: 'MNT114',
    name: 'Prof. Priyanka S. Patil',
    email: 'psp_aids@adcet.in',
    phone: '9422030305',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 15,
    batchName: 'TY-AIDS-A-B3',
    mentorCode: 'MNT115',
    name: 'Prof. Krishnkumar L',
    email: 'krishnakumar@adcet.in',
    phone: '7588797919',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 16,
    batchName: 'TY-AIDS-A-B4',
    mentorCode: 'MNT116',
    name: 'Prof. Priyanka C Patil',
    email: 'pcp_aids@adcet.in',
    phone: '9021527821',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },

  // BTech Batches (17..20)
  {
    batchId: 17,
    batchName: 'BTECH-AIDS-A-B1',
    mentorCode: 'MNT117',
    name: 'Dr. Suresh Patil',
    email: 'suresh.patil@adcet.in',
    phone: '9876543226',
    designation: 'Professor & HOD',
    department: 'AI & DS'
  },
  {
    batchId: 18,
    batchName: 'BTECH-AIDS-A-B2',
    mentorCode: 'MNT118',
    name: 'Dr. Kavita Kulkarni',
    email: 'kavita.kulkarni@adcet.in',
    phone: '9876543227',
    designation: 'Associate Professor',
    department: 'AI & DS'
  },
  {
    batchId: 19,
    batchName: 'BTECH-AIDS-A-B3',
    mentorCode: 'MNT119',
    name: 'Prof. Amol Shinde',
    email: 'amol.shinde@adcet.in',
    phone: '9876543228',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  },
  {
    batchId: 20,
    batchName: 'BTECH-AIDS-A-B4',
    mentorCode: 'MNT120',
    name: 'Prof. Deepali More',
    email: 'deepali.more@adcet.in',
    phone: '9876543229',
    designation: 'Assistant Professor',
    department: 'AI & DS'
  }
];

// Precompute bcrypt hashes
const passwordHashes = {};
for (const f of facultyList) {
  const plainPass = `Pass@${f.mentorCode}`;
  passwordHashes[f.mentorCode] = bcrypt.hashSync(plainPass, 10);
}

const runMigration = db.transaction(() => {
  // Clear existing mentors and mentor users to rebuild clean 1:1 mappings
  db.prepare("DELETE FROM mentors").run();
  db.prepare("DELETE FROM users WHERE role = 'MENTOR'").run();

  const insertUser = db.prepare(`
    INSERT INTO users (id, role, identifier, password_hash, name, email, is_active, initial_password)
    VALUES (?, 'MENTOR', ?, ?, ?, ?, 1, ?)
  `);

  const insertMentor = db.prepare(`
    INSERT INTO mentors (id, user_id, mentor_code, department, designation, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const updateBatchMentor = db.prepare(`
    UPDATE batches SET mentor_id = ? WHERE id = ?
  `);

  const updateMeetingsMentor = db.prepare(`
    UPDATE meetings SET mentor_id = ? WHERE batch_id = ?
  `);

  facultyList.forEach((f, idx) => {
    const mentorId = idx + 1; // 1 to 20
    const userId = mentorId + 1; // 2 to 21
    const plainPass = `Pass@${f.mentorCode}`;
    const hash = passwordHashes[f.mentorCode];

    // Insert user
    insertUser.run(userId, f.mentorCode, hash, f.name, f.email, plainPass);

    // Insert mentor
    insertMentor.run(mentorId, userId, f.mentorCode, f.department, f.designation, f.phone);

    // Link batch 1:1 to mentor
    updateBatchMentor.run(mentorId, f.batchId);

    // Update meetings for this batch to this mentor
    updateMeetingsMentor.run(mentorId, f.batchId);

    console.log(`Assigned Mentor #${mentorId} (${f.mentorCode} - ${f.name}) -> Batch #${f.batchId} (${f.batchName})`);
  });
});

runMigration();
console.log('Migration completed successfully: 20 faculty mentors created with strict 1:1 batch assignments!');
