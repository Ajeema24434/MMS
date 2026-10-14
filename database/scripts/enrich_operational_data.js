/**
 * Enriches the SQLite database with realistic operational data:
 * - Meetings (4 structured meetings per batch across all 20 batches)
 * - Complaints (Realistic student complaints across various categories with resolutions)
 * - Notifications (System alerts for students and mentors)
 * - Activities (2-4 rich co-curricular / extra-curricular achievements for every student)
 */

const path = require('path');
const Database = require(path.join(__dirname, '../../backend/node_modules/better-sqlite3'));

const db = new Database(path.join(__dirname, '../../database/mentor_mentee.db'));
console.log('Enriching operational records in mentor_mentee.db...');

const meetingsTemplate = [
  {
    num: 1,
    date: '2024-08-10 10:30:00',
    mode: 'Offline / Classroom',
    agenda: 'Orientation & Semester Mentoring Framework Overview',
    disc: 'Welcomed students to the academic year, introduced AI & DS mentoring objectives, reviewed attendance norms and counseling card guidelines.',
    find: 'All students present and oriented; verified basic profile and contact information.',
    assign: 'Complete online student profile and register for departmental tech clubs.',
    rem: 'Satisfactory participation.'
  },
  {
    num: 2,
    date: '2024-09-15 14:00:00',
    mode: 'Offline / Lab 4',
    agenda: 'ISE-1 Examination & Continuous Assessment Review',
    disc: 'Analyzed subject-wise performance in In-Semester Examination 1; discussed NPTEL open elective enrollment and lab submissions.',
    find: 'Most students scoring above 70%; 3 students advised on regular lab assignments and punctual submissions.',
    assign: 'Submit proof of NPTEL course registration and completed assignment files.',
    rem: 'Constructive review session.'
  },
  {
    num: 3,
    date: '2024-10-20 11:00:00',
    mode: 'Offline / Seminar Hall',
    agenda: 'Mid-Term Academic Progress & Defaulter Counseling',
    disc: 'Mid-semester evaluation, attendance threshold adherence (>75%), preparation for upcoming campus drives and technical hackathons.',
    find: 'Identified students with attendance shortfall for personalized faculty counseling and parent communication.',
    assign: 'Undertaking forms submitted by students having attendance below threshold.',
    rem: 'Mentoring cards updated.'
  },
  {
    num: 4,
    date: '2024-11-25 15:30:00',
    mode: 'Offline / Department Library',
    agenda: 'Pre-End Semester Counseling & Academic Risk Intervention',
    disc: 'Guidance for End Semester Examination (ESE), mock viva conduction, review of internship & mini-project status.',
    find: 'Bright students encouraged to apply for research publications; remedial sessions scheduled for struggling students.',
    assign: 'Complete remedial practice question sets before semester wrap-up.',
    rem: 'Final semester mentoring targets achieved.'
  }
];

const complaintTemplates = [
  {
    title: 'Request for supplementary reference books in AI & DS library section',
    desc: 'Core textbook for Deep Learning is currently limited to 2 copies in the departmental reading room.',
    cat: 'Library',
    status: 'Resolved',
    resp: 'Discussed with department librarian; two additional copies added to the reference rack.'
  },
  {
    title: 'Query regarding NPTEL credit transfer approval process',
    desc: 'Need clarification on whether 8-week Cloud Computing course qualifies for Open Elective credit.',
    cat: 'Academic',
    status: 'Resolved',
    resp: 'Credit transfer guidelines circulated; verified that 8-week course qualifies for 2 credits.'
  },
  {
    title: 'Wi-Fi connectivity issue in Department Lab 3',
    desc: 'Signal drops intermittently during lab sessions while pulling Docker images.',
    cat: 'Infrastructure',
    status: 'Resolved',
    resp: 'Reported to network administrator; access point reconfigured and bandwidth boosted.'
  },
  {
    title: 'Guidance needed for National AI Hackathon project proposal',
    desc: 'Team requires faculty mentor endorsement and review of architectural block diagram.',
    cat: 'Counseling',
    status: 'Resolved',
    resp: 'Reviewed proposal; suggested dataset optimization and provided official department recommendation.'
  },
  {
    title: 'Request for makeup continuous assessment due to medical leave',
    desc: 'Was unable to attend Practical Continuous Assessment on 12th Oct due to viral fever.',
    cat: 'Academic',
    status: 'Resolved',
    resp: 'Medical certificate verified; makeup practical conducted on 18th Oct.'
  },
  {
    title: 'Hostel study room timings extension request during exam week',
    desc: 'Requesting permission for study hall to remain open until 1:00 AM during MSE exams.',
    cat: 'Infrastructure',
    status: 'In Progress',
    resp: 'Forwarded to Hostel Rector; awaiting final notification.'
  },
  {
    title: 'Need extra guidance on Mathematical Foundation for Machine Learning',
    desc: 'Struggling with Eigenvalues and Matrix Decomposition concepts in Unit 2.',
    cat: 'Academic',
    status: 'Pending',
    resp: null
  }
];

const sampleActivities = [
  { title: 'NPTEL Certification - Deep Learning', category: 'Certification', desc: 'Completed 12-week NPTEL course with Elite certificate.' },
  { title: 'Smart India Hackathon - Department Finalist', category: 'Technical Event', desc: 'Selected among top teams in campus innovation track.' },
  { title: 'Industry Internship - Data Science Intern', category: 'Internship', desc: '2-month hands-on industrial training in data analytics pipelines.' },
  { title: 'Research Workshop on Large Language Models', category: 'Workshop', desc: 'Attended 3-day IEEE certified generative AI workshop.' },
  { title: 'Inter-College Badminton Championship', category: 'Sports', desc: 'Secured 2nd position in district level badminton tournament.' },
  { title: 'NPTEL Certification - Cloud Computing', category: 'Certification', desc: 'Completed 8-week course with 84% aggregate score.' },
  { title: 'Annual Cultural Fest Lakshya - Drama Team', category: 'Cultural', desc: 'Participated in department street play performance.' },
  { title: 'CodeChef Starters Contest - Global Rank 450', category: 'Technical Event', desc: 'Solved 4 algorithmic challenges within timed competitive contest.' },
  { title: 'Hands-on Workshop on Docker & Kubernetes', category: 'Workshop', desc: 'Learned container orchestration and microservice deployment.' },
  { title: 'Winter AI Internship - Computer Vision Lab', category: 'Internship', desc: 'Built real-time face mask detection pipeline using OpenCV.' }
];

const enrichAll = db.transaction(() => {
  // 1. Clear old operational data
  db.prepare('DELETE FROM meetings').run();
  db.prepare('DELETE FROM complaints').run();
  db.prepare('DELETE FROM notifications').run();
  db.prepare('DELETE FROM activities').run();

  // 2. Insert Meetings for all 20 Batches
  const insertMeeting = db.prepare(`
    INSERT INTO meetings (batch_id, mentor_id, meeting_number, meeting_date, mode, status, agenda, discussion, findings, assignment, remarks)
    VALUES (?, ?, ?, ?, ?, 'Completed', ?, ?, ?, ?, ?)
  `);

  const batches = db.prepare('SELECT id, mentor_id FROM batches ORDER BY id').all();
  for (const b of batches) {
    for (const m of meetingsTemplate) {
      insertMeeting.run(b.id, b.mentor_id || 1, m.num, m.date, m.mode, m.agenda, m.disc, m.find, m.assign, m.rem);
    }
  }
  console.log(`Created ${batches.length * 4} meeting records across 20 batches.`);

  // 3. Insert Activities for all students (2 to 4 activities each)
  const insertAct = db.prepare(`
    INSERT INTO activities (student_id, title, category, description, date_achieved)
    VALUES (?, ?, ?, ?, ?)
  `);

  const students = db.prepare('SELECT id, year FROM students ORDER BY id').all();
  let actCount = 0;
  for (let idx = 0; idx < students.length; idx++) {
    const s = students[idx];
    const nActivities = 2 + (idx % 3); // 2, 3, or 4 activities
    for (let a = 0; a < nActivities; a++) {
      const act = sampleActivities[(idx * 3 + a) % sampleActivities.length];
      const month = String(1 + ((idx + a) % 11)).padStart(2, '0');
      const day = String(10 + ((idx * 7 + a) % 18)).padStart(2, '0');
      const date = `2024-${month}-${day}`;
      insertAct.run(s.id, act.title, act.category, act.desc, date);
      actCount++;
    }
  }
  console.log(`Created ${actCount} achievements across ${students.length} students.`);

  // 4. Insert Complaints (~40 complaints across students)
  const insertComplaint = db.prepare(`
    INSERT INTO complaints (student_id, title, description, category, status, mentor_response, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let compCount = 0;
  for (let idx = 0; idx < students.length; idx += 9) {
    const s = students[idx];
    const comp = complaintTemplates[compCount % complaintTemplates.length];
    const resolvedAt = comp.status === 'Resolved' ? '2024-10-18 16:00:00' : null;
    insertComplaint.run(s.id, comp.title, comp.desc, comp.cat, comp.status, comp.resp, '2024-10-12 11:30:00', resolvedAt);
    compCount++;
  }
  console.log(`Created ${compCount} realistic student complaints.`);

  // 5. Insert Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, message, is_read, created_at)
    VALUES (?, ?, 0, '2024-11-01 09:00:00')
  `);

  const users = db.prepare('SELECT id, role FROM users').all();
  for (const u of users) {
    if (u.role === 'STUDENT') {
      insertNotif.run(u.id, 'Continuous Assessment Records Published: Your semester academic scorecard has been reviewed by your faculty mentor.');
      insertNotif.run(u.id, 'Upcoming Mentoring Meeting Scheduled: Meeting #4 has been scheduled with your faculty mentor.');
    } else if (u.role === 'MENTOR') {
      insertNotif.run(u.id, 'New Mentee Submissions Awaiting Review: Students in your assigned batches have submitted updated co-curricular achievements.');
    }
  }
  console.log('Created operational notifications for all users.');
});

enrichAll();
console.log('Operational data enrichment completed successfully!');
