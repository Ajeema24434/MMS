// Complete Student Portal Controller
let currentStudent = null;
let completeReportData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = API.getUser();
  if (!user || user.role !== 'STUDENT') return;

  await loadStudentDashboardData();
  bindSidebarNavigation();
});

// Sidebar Navigation
function bindSidebarNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      if (!targetView) return;

      // Active sidebar highlighting
      navItems.forEach(i => i.classList.remove('active', 'bg-blue-600', 'text-white'));
      navItems.forEach(i => i.classList.add('text-slate-300', 'hover:bg-slate-800'));
      item.classList.remove('text-slate-300', 'hover:bg-slate-800');
      item.classList.add('active', 'bg-blue-600', 'text-white');

      // View switching
      document.querySelectorAll('.portal-view').forEach(v => v.classList.add('hidden'));
      const activeView = document.getElementById(`view-${targetView}`);
      if (activeView) activeView.classList.remove('hidden');
    });
  });
}

// Load All Data
async function loadStudentDashboardData() {
  const res = await API.get('/student/dashboard');
  if (!res.success) return;

  const { student, summary, subjectMarks, upcomingMeeting, mentorAdvice, notifications, academicRecords, activities, complaints } = res;
  currentStudent = student;

  // Header & Student Profile Bar
  const stNameElements = document.querySelectorAll('.st-val-name');
  stNameElements.forEach(el => el.textContent = student.name);

  document.getElementById('st-val-roll').textContent = student.roll_no;
  document.getElementById('st-val-urn').textContent = student.urn;
  document.getElementById('st-val-div').textContent = student.division;
  document.getElementById('st-val-sem').textContent = student.semester || 5;
  document.getElementById('st-val-batch').textContent = student.batch_name || 'Unassigned';
  document.getElementById('st-val-mentor').textContent = student.mentor_name || 'Unassigned';

  // Summary Cards
  document.getElementById('card-attendance').textContent = `${summary.attendance}%`;
  document.getElementById('card-marks').textContent = `${summary.avgMarks}%`;
  document.getElementById('card-progress').textContent = summary.academicProgress;
  document.getElementById('card-meetings').textContent = summary.meetingsAttended;
  document.getElementById('card-activities').textContent = summary.pendingActivities;
  document.getElementById('card-complaints').textContent = summary.complaints;

  // Academic Bar Overview Chart
  renderSubjectBarOverview(subjectMarks);

  // Upcoming Meeting Card
  if (upcomingMeeting) {
    document.getElementById('um-number').textContent = `Meeting #${upcomingMeeting.meeting_number || 1}`;
    document.getElementById('um-date').textContent = upcomingMeeting.meeting_date ? new Date(upcomingMeeting.meeting_date).toLocaleString() : 'TBD';
    document.getElementById('um-mode').textContent = upcomingMeeting.mode || 'Offline / Seminar Hall';
    document.getElementById('um-agenda').textContent = upcomingMeeting.agenda;
  }

  // Recent Mentor Advice
  if (mentorAdvice) {
    document.getElementById('recent-advice-text').textContent = mentorAdvice;
  }

  // Recent Notifications
  renderNotificationsList(notifications, 'dashboard-notifications-list');
  renderNotificationsList(notifications, 'full-notifications-list');

  // Load Profile View Data
  populateProfileView(student);

  // Load Academic Details View Data
  populateAcademicView(academicRecords, subjectMarks);

  // Load Activities View Data
  populateActivitiesView(activities);

  // Load Meetings View Data
  await loadMeetingsView();

  // Load Complaints View Data
  populateComplaintsView(complaints);
}

// Subject Performance Bars
function renderSubjectBarOverview(subjectMarks) {
  const container = document.getElementById('subject-bars-container');
  if (!container) return;

  container.innerHTML = subjectMarks.map(s => `
    <div class="space-y-1">
      <div class="flex items-center justify-between text-xs font-semibold">
        <span class="text-slate-700">${s.subject}</span>
        <span class="text-blue-600 font-mono">${s.total} / 100 (${s.grade})</span>
      </div>
      <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div class="h-full bg-blue-600 rounded-full transition-all duration-500" style="width: ${s.total}%;"></div>
      </div>
    </div>
  `).join('');
}

// Profile Page Data
function populateProfileView(student) {
  document.getElementById('prof-name').textContent = student.name;
  document.getElementById('prof-roll').textContent = student.roll_no;
  document.getElementById('prof-urn').textContent = student.urn;
  document.getElementById('prof-email').value = student.email;
  document.getElementById('prof-phone').value = student.phone || '9876543210';
  document.getElementById('prof-div').textContent = student.division;
  document.getElementById('prof-sem').textContent = student.semester || 5;
  document.getElementById('prof-batch').textContent = student.batch_name || 'Unassigned';

  // Mentor Info
  document.getElementById('prof-m-name').textContent = student.mentor_name || 'Unassigned';
  document.getElementById('prof-m-dept').textContent = student.mentor_department || 'Computer Engineering';
  document.getElementById('prof-m-email').textContent = student.mentor_email || 'N/A';
  document.getElementById('prof-m-code').textContent = student.mentor_college_id || 'MNT101';
}

// Academic Details View
function populateAcademicView(records, subjectMarks) {
  const tbody = document.getElementById('academic-table-tbody');
  if (tbody) {
    tbody.innerHTML = subjectMarks.map(s => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
        <td class="px-6 py-4 font-semibold text-slate-800 text-sm">${s.subject}</td>
        <td class="px-6 py-4 text-slate-600 text-sm font-mono">${s.internal} / 30</td>
        <td class="px-6 py-4 text-slate-600 text-sm font-mono">${s.exam} / 70</td>
        <td class="px-6 py-4 font-bold text-blue-600 text-sm font-mono">${s.total} / 100</td>
        <td class="px-6 py-4 text-sm font-bold text-slate-900">${s.grade}</td>
      </tr>
    `).join('');
  }

  const latest = records && records[0] ? records[0] : { attendance_percentage: 82.45, subjects_failed_count: 0 };
  document.getElementById('acad-overall-attendance').textContent = `${latest.attendance_percentage}%`;
  document.getElementById('acad-below-attendance').textContent = `${latest.subjects_failed_count} Subjects`;
  document.getElementById('acad-overall-performance').textContent = latest.defaulter_flag ? 'Needs Guidance' : 'Good Academic Progress';
}

// Activities View
function populateActivitiesView(activities) {
  const tbody = document.getElementById('activities-table-tbody');
  if (!tbody) return;

  if (!activities || activities.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 text-sm">No co-curricular activities recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = activities.map(a => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
      <td class="px-6 py-4 font-semibold text-slate-900 text-sm">${a.title}</td>
      <td class="px-6 py-4 text-xs font-semibold text-blue-600 uppercase"><span class="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded">${a.category}</span></td>
      <td class="px-6 py-4 text-slate-500 text-xs font-mono">${a.date_achieved ? new Date(a.date_achieved).toLocaleDateString() : ''}</td>
      <td class="px-6 py-4 text-xs"><a href="#" class="text-blue-600 underline font-medium">${a.evidence_url || 'certificate.pdf'}</a></td>
      <td class="px-6 py-4 text-sm">${getActivityStatusBadge(a.status)}</td>
      <td class="px-6 py-4 text-xs text-slate-400">Mentor Verification Pending</td>
    </tr>
  `).join('');
}

// Meetings View
async function loadMeetingsView() {
  const res = await API.get('/student/meetings');
  if (!res.success) return;

  const { upcoming, past, all } = res;

  renderMeetingsTable(upcoming, 'meetings-upcoming-tbody');
  renderMeetingsTable(past, 'meetings-past-tbody');

  // Bind tab switching between Upcoming & Past
  const meetingTabs = document.querySelectorAll('.meeting-tab-btn');
  meetingTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      meetingTabs.forEach(b => b.classList.remove('active', 'border-blue-600', 'text-blue-600'));
      meetingTabs.forEach(b => b.classList.add('text-slate-500'));
      btn.classList.add('active', 'border-blue-600', 'text-blue-600');

      const target = btn.getAttribute('data-meeting-tab');
      document.getElementById('meetings-tab-upcoming').classList.add('hidden');
      document.getElementById('meetings-tab-past').classList.add('hidden');
      document.getElementById(`meetings-tab-${target}`).classList.remove('hidden');
    });
  });
}

function renderMeetingsTable(meetings, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (!meetings || meetings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 text-sm">No meetings recorded in this category.</td></tr>`;
    return;
  }

  tbody.innerHTML = meetings.map(m => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
      <td class="px-6 py-4 font-semibold text-slate-900 text-sm">Meeting #${m.meeting_number || 1}</td>
      <td class="px-6 py-4 text-slate-600 text-xs font-mono">${new Date(m.meeting_date).toLocaleString()}</td>
      <td class="px-6 py-4 text-slate-600 text-xs">${m.mode || 'Offline'}</td>
      <td class="px-6 py-4 text-slate-800 text-xs font-medium">${m.agenda}</td>
      <td class="px-6 py-4 text-sm"><span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">${m.status || 'Scheduled'}</span></td>
      <td class="px-6 py-4 text-xs font-semibold text-emerald-600">Attended</td>
    </tr>
  `).join('');
}

// Complaints View
function populateComplaintsView(complaints) {
  const tbody = document.getElementById('complaints-table-tbody');
  if (!tbody) return;

  if (!complaints || complaints.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 text-sm">No complaints or queries submitted.</td></tr>`;
    return;
  }

  tbody.innerHTML = complaints.map(c => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
      <td class="px-6 py-4 font-mono font-semibold text-slate-800 text-xs">#CMP-${c.id}</td>
      <td class="px-6 py-4 text-xs font-semibold text-slate-700">${c.category}</td>
      <td class="px-6 py-4 text-slate-900 text-xs font-medium">${c.title}<p class="text-slate-500 font-normal text-[11px] mt-0.5">${c.description}</p></td>
      <td class="px-6 py-4 text-slate-400 text-xs font-mono">${new Date(c.created_at).toLocaleDateString()}</td>
      <td class="px-6 py-4 text-sm">${getComplaintStatusBadge(c.status)}</td>
      <td class="px-6 py-4 text-xs text-slate-600">${c.mentor_response || '<span class="text-slate-400 italic">Pending response</span>'}</td>
      <td class="px-6 py-4 text-xs font-semibold text-blue-600">Tracked</td>
    </tr>
  `).join('');
}

// Notifications List
function renderNotificationsList(notifications, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!notifications || notifications.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 italic">No notifications.</p>`;
    return;
  }

  container.innerHTML = notifications.map(n => `
    <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3">
      <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs flex-shrink-0">
        N
      </div>
      <div class="space-y-0.5">
        <h4 class="font-bold text-slate-900 text-xs">${n.title}</h4>
        <p class="text-xs text-slate-600">${n.message}</p>
        <span class="text-[10px] text-slate-400 font-mono">${new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  `).join('');
}

// GENERATE COMPLETE REPORT FUNCTION
async function generateStudentCompleteReport() {
  const reportModal = document.getElementById('report-modal');
  const reportContent = document.getElementById('report-modal-content');

  reportModal.classList.remove('hidden');
  reportContent.innerHTML = `<div class="p-8 text-center text-slate-500 font-medium">Generating complete academic report...</div>`;

  const res = await API.get('/student/report');
  if (!res.success) {
    reportContent.innerHTML = `<div class="p-8 text-center text-rose-600">Error generating report. Please try again.</div>`;
    return;
  }

  const { report } = res;
  completeReportData = report;

  const st = report.studentInfo;
  const mt = report.mentorInfo;
  const ac = report.academicPerformance;

  reportContent.innerHTML = `
    <div id="printable-report" class="bg-white p-8 border border-slate-200 rounded-xl space-y-6 text-slate-900 text-sm">
      
      <!-- Report Header -->
      <div class="border-b border-slate-300 pb-4 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-extrabold text-blue-900">STUDENT COMPLETE ACADEMIC & MENTORSHIP REPORT</h2>
          <p class="text-xs text-slate-500 font-medium mt-0.5">Official Academic Progress Document • Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
        </div>
        <div class="text-right">
          <span class="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded font-bold text-xs">OFFICIAL REPORT</span>
        </div>
      </div>

      <!-- 1. Student Information -->
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-1">1. Student Personal & Academic Profile</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div><span class="text-slate-500">Name:</span> <strong class="block text-slate-900">${st.name}</strong></div>
          <div><span class="text-slate-500">Roll No:</span> <strong class="block text-slate-900 font-mono">${st.rollNo}</strong></div>
          <div><span class="text-slate-500">URN:</span> <strong class="block text-slate-900 font-mono">${st.urn}</strong></div>
          <div><span class="text-slate-500">Department:</span> <strong class="block text-slate-900">${st.department}</strong></div>
          <div><span class="text-slate-500">Division:</span> <strong class="block text-slate-900">${st.division}</strong></div>
          <div><span class="text-slate-500">Semester:</span> <strong class="block text-slate-900">${st.semester}</strong></div>
          <div><span class="text-slate-500">Batch:</span> <strong class="block text-slate-900">${st.batch}</strong></div>
          <div><span class="text-slate-500">Academic Year:</span> <strong class="block text-slate-900">${st.academicYear}</strong></div>
        </div>
      </div>

      <!-- 2. Mentor Information -->
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-1">2. Faculty Advisor Information</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div><span class="text-slate-500">Mentor Name:</span> <strong class="block text-slate-900">${mt.name}</strong></div>
          <div><span class="text-slate-500">Department:</span> <strong class="block text-slate-900">${mt.department}</strong></div>
          <div><span class="text-slate-500">Email:</span> <strong class="block text-slate-900">${mt.email}</strong></div>
          <div><span class="text-slate-500">Faculty ID:</span> <strong class="block text-slate-900 font-mono">${mt.collegeId}</strong></div>
        </div>
      </div>

      <!-- 3. Academic Performance -->
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-1">3. Subject-wise Marks & Attendance Summary</h3>
        <table class="w-full text-left border-collapse text-xs border border-slate-200">
          <thead>
            <tr class="bg-slate-100 text-slate-700 border-b border-slate-200">
              <th class="p-2">Subject</th>
              <th class="p-2">Internal (30)</th>
              <th class="p-2">Exam (70)</th>
              <th class="p-2">Total (100)</th>
              <th class="p-2">Grade</th>
            </tr>
          </thead>
          <tbody>
            ${ac.subjectMarks.map(s => `
              <tr class="border-b border-slate-200">
                <td class="p-2 font-semibold">${s.subject}</td>
                <td class="p-2">${s.internal}</td>
                <td class="p-2">${s.exam}</td>
                <td class="p-2 font-bold text-blue-700">${s.total}</td>
                <td class="p-2 font-bold">${s.grade}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="flex justify-between text-xs font-semibold pt-1">
          <span>Overall Attendance: <strong class="text-blue-700">${ac.overallAttendance}%</strong></span>
          <span>Cumulative CGPA: <strong class="text-blue-700">${ac.overallCgpa}</strong></span>
        </div>
      </div>

      <!-- 4. Meeting History -->
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-1">4. Mentoring Meeting History</h3>
        <ul class="list-disc list-inside text-xs space-y-1 text-slate-700">
          ${report.meetings.map(m => `<li><strong>Meeting #${m.meeting_number || 1} (${new Date(m.meeting_date).toLocaleDateString()}):</strong> ${m.agenda} - <em>Status: ${m.status || 'Completed'}</em></li>`).join('')}
        </ul>
      </div>

      <!-- 5. Co-Curricular Activities -->
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-1">5. Certified Activities & Achievements</h3>
        <ul class="list-disc list-inside text-xs space-y-1 text-slate-700">
          ${report.activities.map(a => `<li><strong>${a.title} (${a.category}):</strong> ${a.description || 'Verified achievement.'} [Status: ${a.status}]</li>`).join('')}
        </ul>
      </div>

      <!-- 6. Mentor Observations -->
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-1">6. Official Mentor Observations & Advice</h3>
        <div class="p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900 italic">
          "${report.mentorObservations.join(' ')}"
        </div>
      </div>

      <!-- 7. Overall Progress -->
      <div class="pt-2 border-t border-slate-300 flex items-center justify-between text-xs">
        <span>Overall Academic Status: <strong class="text-emerald-700 font-bold">${report.overallProgress}</strong></span>
        <span class="text-slate-400">Notice: Read-only generated report. Cannot be modified.</span>
      </div>

    </div>
  `;
}

function printStudentReport() {
  window.print();
}

function getActivityStatusBadge(status) {
  if (status === 'Approved') return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>`;
  if (status === 'Rejected') return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>`;
  return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>`;
}

function getComplaintStatusBadge(status) {
  if (status === 'Resolved') return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>`;
  if (status === 'In Progress') return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">In Progress</span>`;
  return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Submitted</span>`;
}
