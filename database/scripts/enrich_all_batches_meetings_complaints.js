/**
 * enrich_all_batches_meetings_complaints.js
 *
 * Populates realistic meetings, attendees, and complaints across all 20 batches
 * in the MMS system so that every student and mentor dashboard is fully populated,
 * synchronized, and reflective of actual database state.
 */

const path = require('path');
const Database = require(path.join(__dirname, '../../backend/node_modules/better-sqlite3'));

const dbPath = path.join(__dirname, '../../database/mentor_mentee.db');
const db = new Database(dbPath);

console.log('Connecting to database:', dbPath);

// Official August 2026 Defaulters data for TY (Roll numbers with att < 75 or def = 1)
const tyDefaulterRolls = new Set([
  '3003', '3005', '3011', '3024', '3033', '3036', '3041', '3043',
  '3055', '3056', '3061', '3068', '3070', '3073'
]);

const complaintCatalog = [
  {
    cat: 'Academic',
    title: 'Request for remedial sessions in Machine Learning unit 3',
    desc: 'Struggling with mathematical formulation of Support Vector Machines and kernel trick. Would appreciate an extra problem-solving session.',
    resolvedResp: 'Scheduled extra tutorial session with department teaching assistant on Saturday at 11:00 AM.',
    inProgressResp: 'Discussed with course instructor; organizing a remedial doubt session next week.'
  },
  {
    cat: 'Academic',
    title: 'Guidance on open elective selection for upcoming semester',
    desc: 'Confused between Cloud Computing architectures and Natural Language Processing. Need mentor guidance based on career scope.',
    resolvedResp: 'Discussed in 1-on-1 mentoring session. Recommended NLP considering your strong Python background and project interests.',
    inProgressResp: 'Shared elective syllabus and industry roadmap. Let us discuss during the next meeting.'
  },
  {
    cat: 'Infrastructure',
    title: 'GPU server accessibility in Data Science Lab',
    desc: 'Encountering CUDA out of memory and access permission errors while training PyTorch models on Lab GPU node 2.',
    resolvedResp: 'System administrator configured dedicated user quotas and reset the CUDA driver permissions.',
    inProgressResp: 'Notified system admin team. Server maintenance scheduled for Wednesday evening.'
  },
  {
    cat: 'Infrastructure',
    title: 'Wi-Fi connectivity drops in Room 302 during afternoon sessions',
    desc: 'Signal strength is weak near rows 4-6, causing disconnections when accessing university LMS portal.',
    resolvedResp: 'Network team installed an additional dual-band access point in the corridor outside Room 302.',
    inProgressResp: 'Ticket #IT-884 submitted to campus IT infrastructure team for router inspection.'
  },
  {
    cat: 'Personal',
    title: 'Medical leave certificate submission & attendance consideration',
    desc: 'Was hospitalized with viral infection for 4 days during August. Requesting medical leave verification for attendance condonation.',
    resolvedResp: 'Medical certificate and doctor prescription verified. 4 days leave approved for attendance regularisation.',
    inProgressResp: 'Please submit physical original medical documents to mentor office for dean endorsement.'
  },
  {
    cat: 'Personal',
    title: 'Counseling regarding work-study balance with external internship',
    desc: 'Selected for remote part-time web development internship. Seeking guidance on managing semester coursework without attendance deficit.',
    resolvedResp: 'Reviewed internship schedule. Advised to maintain minimum 80% physical lab attendance and utilize weekends for internship tasks.',
    inProgressResp: 'Under review. Bring company offer letter and weekly work schedule for assessment.'
  },
  {
    cat: 'Other',
    title: 'NPTEL course fee reimbursement procedure inquiry',
    desc: 'Completed NPTEL certification with Elite score. What is the procedure for institutional exam fee refund?',
    resolvedResp: 'Submit copy of Elite certificate and exam fee receipt to department office before 30th of this month.',
    inProgressResp: 'Circular will be published shortly once institute accounts department opens reimbursement window.'
  },
  {
    cat: 'Academic',
    title: 'Lab Continuous Assessment marks clarification for Experiment 4',
    desc: 'Submitted experiment on time via GitHub repository, but marks show incomplete in internal assessment register.',
    resolvedResp: 'Lab manual cross-checked; repository commit timestamp confirmed on-time submission. Marks updated to 28/30.',
    inProgressResp: 'Verifying GitHub repository commit log with lab assistant.'
  }
];

const meetingTemplates = [
  {
    num: 1,
    date: '2026-07-22 10:30:00',
    mode: 'Offline / Classroom 301',
    status: 'Completed',
    agenda: 'Semester Orientation, Mentoring Framework & Academic Goal Setting',
    disc: 'Welcomed mentees to semester curriculum, reviewed university examination regulations, academic threshold (>75% attendance), and continuous internal evaluation (ISE/MSE).',
    find: 'All students verified profile details and enrolled in departmental mentorship program.',
    assign: 'Complete counseling card entries and register for core technical clubs.',
    rem: 'Constructive session conducted with high engagement.'
  },
  {
    num: 2,
    date: '2026-08-25 14:00:00',
    mode: 'Offline / AI & DS Department Lab',
    status: 'Completed',
    agenda: 'In-Semester Evaluation (ISE-1), Lab Practicals & August Attendance Review',
    disc: 'Evaluated performance in ISE-1 unit tests, reviewed practical code submissions, analyzed August monthly attendance reports, identified students needing support.',
    find: 'Most mentees maintain healthy attendance above 80%; students with low subject attendance received individual counseling.',
    assign: 'Submit pending lab journal assignments and verify NPTEL course enrollment.',
    rem: 'Attendance counseling documented in official mentor log.'
  },
  {
    num: 3,
    date: '2026-09-24 11:30:00',
    mode: 'Offline / Department Seminar Hall',
    status: 'Completed',
    agenda: 'Mid-Semester Examination (MSE) Analysis, Remedial Guidance & Project Progress',
    disc: 'Detailed review of MSE answer sheets, clarification of complex topics, review of capstone/mini-project milestone 1, internship applications.',
    find: 'Identified priority academic intervention areas; scheduled remedial guidance sessions for students needing assistance.',
    assign: 'Prepare revision problem sets and submit project architecture documents.',
    rem: 'Remedial action plans established for affected students.'
  },
  {
    num: 4,
    date: '2026-10-26 14:30:00',
    mode: 'Offline / Central Seminar Hall A',
    status: 'Scheduled',
    agenda: 'End-Semester Preparation Strategy, Practical Exam Readiness & Placement Mentoring',
    disc: 'Final university exam schedule preparation, mock viva conduction guidelines, certified co-curricular verification, and placement interview readiness.',
    find: 'Scheduled for upcoming execution across all batch mentees.',
    assign: 'Clear all course prerequisites and upload all co-curricular certificates for mentor approval.',
    rem: 'Upcoming mandatory mentoring meeting for entire batch.'
  }
];

db.transaction(() => {
  console.log('1. Clearing old meetings and meeting attendees...');
  db.prepare('DELETE FROM meeting_attendees').run();
  db.prepare('DELETE FROM meetings').run();

  const batches = db.prepare(`
    SELECT b.id, b.name, b.mentor_id, m.user_id as mentor_user_id, u.name as mentor_name
    FROM batches b
    LEFT JOIN mentors m ON b.mentor_id = m.id
    LEFT JOIN users u ON m.user_id = u.id
    ORDER BY b.id ASC
  `).all();

  console.log(`Found ${batches.length} batches.`);

  const insertMeeting = db.prepare(`
    INSERT INTO meetings (batch_id, mentor_id, meeting_number, meeting_date, mode, status, agenda, discussion, findings, assignment, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAttendee = db.prepare(`
    INSERT INTO meeting_attendees (meeting_id, student_id, status, remarks)
    VALUES (?, ?, ?, ?)
  `);

  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, message, is_read, created_at)
    VALUES (?, ?, 0, ?)
  `);

  let totalMeetingsCreated = 0;
  let totalAttendeesCreated = 0;

  for (const batch of batches) {
    const students = db.prepare(`
      SELECT s.id, s.user_id, s.roll_no, s.year, s.ml_risk_level, u.name
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.batch_id = ?
      ORDER BY s.roll_no ASC
    `).all(batch.id);

    for (const tmpl of meetingTemplates) {
      const res = insertMeeting.run(
        batch.id,
        batch.mentor_id || 1,
        tmpl.num,
        tmpl.date,
        tmpl.mode,
        tmpl.status,
        tmpl.agenda,
        tmpl.disc,
        tmpl.find,
        tmpl.assign,
        tmpl.rem
      );

      const meetingId = res.lastInsertRowid;
      totalMeetingsCreated++;

      // Seed attendees for every student in this batch
      for (const st of students) {
        let attStatus = 'Present';
        let attRemarks = 'Attended actively';

        if (tmpl.status === 'Completed') {
          // Check if student is a defaulter or weak
          const isDefaulter = tyDefaulterRolls.has(st.roll_no) || st.ml_risk_level === 'Weak';
          
          if (tmpl.num === 1) {
            // Orientation
            const isAbsent = (st.id * 17) % 23 === 0;
            if (isAbsent) {
              attStatus = 'Absent';
              attRemarks = 'Informed absence due to travel delay';
            } else {
              attStatus = 'Present';
              attRemarks = 'Attended orientation and verified profile';
            }
          } else if (tmpl.num === 2) {
            // August attendance review
            if (isDefaulter) {
              // Some defaulters were present for counseling, 1-2 missed
              const missed = (st.id * 7) % 11 === 0;
              if (missed) {
                attStatus = 'Absent';
                attRemarks = 'Absent without prior intimation; parent notified';
              } else {
                attStatus = 'Present';
                attRemarks = 'Attended mandatory counseling; signed attendance undertaking';
              }
            } else {
              attStatus = 'Present';
              attRemarks = 'Good academic standing; continuous assessment verified';
            }
          } else if (tmpl.num === 3) {
            // MSE & Remedial review
            if (isDefaulter) {
              attStatus = 'Present';
              attRemarks = 'Assigned to remedial coaching schedule';
            } else {
              const excused = (st.id * 13) % 29 === 0;
              if (excused) {
                attStatus = 'Absent';
                attRemarks = 'Excused for university sports tournament';
              } else {
                attStatus = 'Present';
                attRemarks = 'Mini-project review approved';
              }
            }
          }
        } else {
          // Scheduled upcoming meeting
          attStatus = 'Present';
          attRemarks = 'Scheduled batch meeting';
        }

        insertAttendee.run(meetingId, st.id, attStatus, attRemarks);
        totalAttendeesCreated++;

        // If upcoming meeting, create notification for mentee
        if (tmpl.status === 'Scheduled') {
          insertNotif.run(
            st.user_id,
            `Upcoming Mentoring Meeting #${tmpl.num} on Oct 26, 2026 (Offline / Central Seminar Hall A): "${tmpl.agenda}"`,
            '2026-10-14 09:00:00'
          );
        }
      }
    }
  }

  console.log(`Created ${totalMeetingsCreated} meetings and ${totalAttendeesCreated} attendee records across all 20 batches!`);

  // 2. Clear and enrich complaints across all 20 batches
  console.log('2. Refreshing complaints with realistic multi-batch data...');
  db.prepare('DELETE FROM complaints').run();

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (student_id, title, description, category, status, mentor_response, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalComplaintsCreated = 0;

  for (const batch of batches) {
    const students = db.prepare('SELECT s.id, s.user_id, s.roll_no, u.name FROM students s JOIN users u ON s.user_id = u.id WHERE s.batch_id = ?').all(batch.id);
    if (students.length === 0) continue;

    // Pick 3 to 4 distinct students per batch for realistic complaints
    const numComplaints = 3 + (batch.id % 2); // 3 or 4 complaints per batch
    for (let c = 0; c < numComplaints; c++) {
      const studentIdx = (c * 5 + batch.id) % students.length;
      const st = students[studentIdx];
      const tmpl = complaintCatalog[(batch.id * 3 + c) % complaintCatalog.length];

      // Distribute statuses: 0: Resolved, 1: In Progress, 2: Pending, 3: Resolved
      let status = 'Resolved';
      let mentorResponse = tmpl.resolvedResp;
      let createdAt = `2026-08-${String(10 + c * 4).padStart(2, '0')} 11:30:00`;
      let resolvedAt = `2026-08-${String(14 + c * 4).padStart(2, '0')} 16:45:00`;

      if (c === 1) {
        status = 'In Progress';
        mentorResponse = tmpl.inProgressResp;
        createdAt = `2026-10-0${2 + c} 14:15:00`;
        resolvedAt = null;
      } else if (c === 2) {
        status = 'Pending';
        mentorResponse = null;
        createdAt = `2026-10-1${1 + c} 10:20:00`;
        resolvedAt = null;
      }

      insertComplaint.run(st.id, tmpl.title, tmpl.desc, tmpl.cat, status, mentorResponse, createdAt, resolvedAt);
      totalComplaintsCreated++;

      // Reciprocal notifications
      if (status === 'Resolved' && batch.mentor_name) {
        insertNotif.run(
          st.user_id,
          `Faculty Mentor ${batch.mentor_name} resolved your complaint: "${tmpl.title}". Response: "${mentorResponse}"`,
          resolvedAt
        );
      } else if (status === 'Pending' && batch.mentor_user_id) {
        insertNotif.run(
          batch.mentor_user_id,
          `New Mentee Complaint: ${st.name} (${st.roll_no}) filed "${tmpl.title}" (${tmpl.cat}).`,
          createdAt
        );
      }
    }
  }

  console.log(`Created ${totalComplaintsCreated} realistic complaints distributed across all 20 batches!`);
})();

console.log('Database enrichment finished successfully!');
db.close();
