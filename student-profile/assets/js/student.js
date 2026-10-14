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

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('st-val-roll', student.roll_no);
  setText('st-val-urn', student.urn);
  setText('st-val-div', student.division);
  setText('st-val-sem', student.semester || 5);
  setText('st-val-batch', student.batch_name || 'Unassigned');
  setText('st-val-mentor', student.mentor_name || 'Unassigned');

  // Also update header profile bar values if present
  setText('st-val-roll-bar', student.roll_no);
  setText('st-val-urn-bar', student.urn);
  setText('st-val-div-bar', student.division);
  setText('st-val-sem-bar', student.semester || 5);
  setText('st-val-batch-bar', student.batch_name || 'Unassigned');

  // Summary Cards (Real database values only)
  setText('card-attendance', summary.attendance || 'N/A');
  setText('card-marks', summary.avgMarks || 'N/A');
  setText('card-progress', summary.academicProgress || 'Not Available');
  setText('card-meetings', summary.meetingsAttended || '0/0');
  setText('card-activities', summary.pendingActivities != null ? summary.pendingActivities : 0);
  setText('card-complaints', summary.complaints || '0 In Progress');

  // Academic Bar Overview Chart
  renderSubjectBarOverview(subjectMarks);

  // Upcoming Meeting Card (Real data only)
  if (upcomingMeeting) {
    setText('um-number', `Meeting #${upcomingMeeting.meeting_number || 1}`);
    setText('um-date', upcomingMeeting.meeting_date ? new Date(upcomingMeeting.meeting_date).toLocaleString() : 'TBD');
    setText('um-mode', upcomingMeeting.mode || 'Offline');
    setText('um-agenda', upcomingMeeting.agenda || 'Agenda scheduled by faculty.');
  } else {
    setText('um-number', 'None');
    setText('um-date', 'No upcoming meetings scheduled');
    setText('um-mode', 'N/A');
    setText('um-agenda', 'No upcoming meeting scheduled by mentor.');
  }

  // Recent Mentor Advice (Real data only)
  const adviceEl = document.getElementById('recent-advice-text');
  if (adviceEl) {
    if (mentorAdvice && mentorAdvice.trim()) {
      adviceEl.innerHTML = mentorAdvice;
      adviceEl.classList.remove('italic', 'text-slate-400');
    } else {
      adviceEl.innerHTML = '<span class="italic text-slate-400">No faculty mentor advice recorded yet.</span>';
    }
  }

  // Recent Notifications
  renderNotificationsList(notifications, 'dashboard-notifications-list', true);
  renderNotificationsList(notifications, 'full-notifications-list', false);

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

  if (!subjectMarks || subjectMarks.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
        Academic records are not available yet.
      </div>
    `;
    return;
  }

  container.innerHTML = subjectMarks.map(s => {
    const total = parseFloat(s.total) || 0;
    const grade = s.grade || 'P';
    return `
      <div class="space-y-1">
        <div class="flex items-center justify-between text-xs font-semibold">
          <span class="text-slate-700">${s.subject}</span>
          <span class="text-blue-600 font-mono">${total} / 100 (${grade})</span>
        </div>
        <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-blue-600 rounded-full transition-all duration-500" style="width: ${Math.min(total, 100)}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// Profile Page Data
function populateProfileView(student) {
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setText('prof-name', student.name);
  setText('prof-roll', student.roll_no);
  setText('prof-urn', student.urn);
  setText('prof-div', student.division);
  setText('prof-sem', student.semester || 5);
  setText('prof-batch', student.batch_name || 'Unassigned');

  const emailEl = document.getElementById('prof-email');
  if (emailEl) emailEl.value = student.email || '';

  const phoneEl = document.getElementById('prof-phone');
  if (phoneEl) phoneEl.value = student.phone || '';

  // Mentor Info
  setText('prof-m-name', student.mentor_name || 'Unassigned');
  setText('prof-m-dept', student.mentor_department || 'Computer Engineering');
  setText('prof-m-email', student.mentor_email || 'N/A');
  setText('prof-m-code', student.mentor_college_id || 'MNT101');
}

// Academic Details View (Real data only)
function populateAcademicView(records, subjectMarks) {
  const tbody = document.getElementById('academic-table-tbody');
  if (tbody) {
    if (!subjectMarks || subjectMarks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400 text-sm">Academic records are not available yet.</td></tr>`;
    } else {
      tbody.innerHTML = subjectMarks.map(s => {
        const intMarks = s.internal != null ? s.internal : '-';
        const exMarks = s.exam != null ? s.exam : '-';
        const tot = s.total != null ? s.total : '-';
        const gr = s.grade || '-';
        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
            <td class="px-6 py-4 font-semibold text-slate-800 text-sm">${s.subject}</td>
            <td class="px-6 py-4 text-slate-600 text-sm font-mono">${intMarks} / 40</td>
            <td class="px-6 py-4 text-slate-600 text-sm font-mono">${exMarks} / 70</td>
            <td class="px-6 py-4 font-bold text-blue-600 text-sm font-mono">${tot} / 100</td>
            <td class="px-6 py-4 text-sm font-bold text-slate-900">${gr}</td>
          </tr>
        `;
      }).join('');
    }
  }

  const latest = records && records.length > 0 ? records[0] : null;
  const attEl = document.getElementById('acad-overall-attendance');
  if (attEl) attEl.textContent = latest && latest.attendance_percentage != null ? `${latest.attendance_percentage}%` : 'Not available';

  const belowEl = document.getElementById('acad-below-attendance');
  if (belowEl) belowEl.textContent = latest ? `${latest.subjects_failed_count || 0} Subjects` : '0 Subjects';

  const perfEl = document.getElementById('acad-overall-performance');
  if (perfEl) perfEl.textContent = latest ? (latest.defaulter_flag ? 'Needs Guidance' : 'Good Academic Progress') : 'Not available';
}

// Activities View
function populateActivitiesView(activities) {
  const tbody = document.getElementById('activities-table-tbody');
  if (!tbody) return;

  if (!activities || activities.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 text-sm">No co-curricular activities submitted yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = activities.map(a => {
    let evidenceLink = '<span class="text-slate-400 italic">No document</span>';
    if (a.evidence_url) {
      evidenceLink = `<a href="/api/student/activities/${a.id}/certificate" target="_blank" class="text-blue-600 hover:text-blue-800 underline font-medium text-xs flex items-center space-x-1">
        <span>${a.original_filename || 'Download Certificate'}</span>
      </a>`;
    }

    let remarksHtml = `<span class="text-slate-400 italic text-xs">Pending review</span>`;
    if (a.mentor_remarks && a.mentor_remarks.trim()) {
      remarksHtml = `<span class="text-slate-700 text-xs font-medium">${a.mentor_remarks}</span>`;
    } else if (a.status === 'Approved') {
      remarksHtml = `<span class="text-emerald-600 font-semibold text-xs">Verified by mentor</span>`;
    } else if (a.status === 'Rejected') {
      remarksHtml = `<span class="text-rose-600 font-semibold text-xs">Rejected</span>`;
    }

    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
        <td class="px-6 py-4 font-semibold text-slate-900 text-sm">
          ${a.title}
          ${a.description ? `<p class="text-xs text-slate-500 font-normal mt-0.5">${a.description}</p>` : ''}
        </td>
        <td class="px-6 py-4 text-xs font-semibold text-blue-600 uppercase">
          <span class="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded">${a.category}</span>
        </td>
        <td class="px-6 py-4 text-slate-500 text-xs font-mono">${a.date_achieved ? new Date(a.date_achieved).toLocaleDateString() : 'N/A'}</td>
        <td class="px-6 py-4">${evidenceLink}</td>
        <td class="px-6 py-4 text-sm">${getActivityStatusBadge(a.status)}</td>
        <td class="px-6 py-4">${remarksHtml}</td>
      </tr>
    `;
  }).join('');
}

// Meetings View
async function loadMeetingsView() {
  const res = await API.get('/student/meetings');
  if (!res.success) return;

  const { upcoming, past } = res;

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
      const upcomingTab = document.getElementById('meetings-tab-upcoming');
      const pastTab = document.getElementById('meetings-tab-past');
      if (upcomingTab) upcomingTab.classList.add('hidden');
      if (pastTab) pastTab.classList.add('hidden');
      const activeTab = document.getElementById(`meetings-tab-${target}`);
      if (activeTab) activeTab.classList.remove('hidden');
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
      <td class="px-6 py-4 text-slate-600 text-xs font-mono">${m.meeting_date ? new Date(m.meeting_date).toLocaleString() : 'TBD'}</td>
      <td class="px-6 py-4 text-slate-600 text-xs">${m.mode || 'Offline'}</td>
      <td class="px-6 py-4 text-slate-800 text-xs font-medium">${m.agenda || 'N/A'}</td>
      <td class="px-6 py-4 text-sm"><span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">${m.status || 'Scheduled'}</span></td>
      <td class="px-6 py-4 text-xs font-semibold text-emerald-600">${m.status === 'Completed' ? 'Attended' : 'Scheduled'}</td>
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
      <td class="px-6 py-4 text-slate-400 text-xs font-mono">${c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}</td>
      <td class="px-6 py-4 text-sm">${getComplaintStatusBadge(c.status)}</td>
      <td class="px-6 py-4 text-xs text-slate-600">${c.mentor_response || '<span class="text-slate-400 italic">Pending response</span>'}</td>
      <td class="px-6 py-4 text-xs font-semibold text-blue-600">Tracked</td>
    </tr>
  `).join('');
}

// Notifications List
function renderNotificationsList(notifications, containerId, isSummary = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!notifications || notifications.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 italic p-3">No notifications at this time.</p>`;
    return;
  }

  const list = isSummary ? notifications.slice(0, 5) : notifications;

  container.innerHTML = list.map(n => {
    const isUnread = !n.is_read;
    const bgClass = isUnread ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200';
    const timeStr = n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : '';

    return `
      <div id="notif-item-${n.id}" class="p-3 rounded-xl border ${bgClass} shadow-sm flex items-start justify-between space-x-3 transition">
        <div class="flex items-start space-x-3">
          <div class="w-8 h-8 rounded-lg ${isUnread ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'} font-bold flex items-center justify-center text-xs flex-shrink-0">
            ${isUnread ? '●' : '✓'}
          </div>
          <div class="space-y-0.5">
            <h4 class="font-bold text-slate-900 text-xs flex items-center space-x-2">
              <span>${n.title}</span>
              ${isUnread ? '<span class="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[9px] rounded font-semibold uppercase">New</span>' : ''}
            </h4>
            <p class="text-xs text-slate-600">${n.message}</p>
            <span class="text-[10px] text-slate-400 font-mono">${timeStr}</span>
          </div>
        </div>
        ${isUnread ? `
          <button onclick="markNotificationAsRead(${n.id})" class="text-[10px] text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 bg-white rounded border border-blue-200 shadow-xs flex-shrink-0">
            Mark Read
          </button>
        ` : ''}
      </div>
    `;
  }).join('');
}

// Mark single notification as read
async function markNotificationAsRead(id) {
  try {
    const res = await API.patch(`/student/notifications/${id}/read`, {});
    if (res.success) {
      await loadStudentDashboardData();
    }
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
  try {
    const res = await API.post('/student/notifications/read-all', {});
    if (res.success) {
      await loadStudentDashboardData();
    }
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
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
        ${ac.subjectMarks && ac.subjectMarks.length > 0 ? `
          <table class="w-full text-left border-collapse text-xs border border-slate-200">
            <thead>
              <tr class="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th class="p-2">Subject</th>
                <th class="p-2">Internal (40)</th>
                <th class="p-2">Exam (70)</th>
                <th class="p-2">Total (100)</th>
                <th class="p-2">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${ac.subjectMarks.map(s => `
                <tr class="border-b border-slate-200">
                  <td class="p-2 font-semibold">${s.subject}</td>
                  <td class="p-2">${s.internal != null ? s.internal : '-'}</td>
                  <td class="p-2">${s.exam != null ? s.exam : '-'}</td>
                  <td class="p-2 font-bold text-blue-700">${s.total != null ? s.total : '-'}</td>
                  <td class="p-2 font-bold">${s.grade || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="p-4 bg-slate-50 rounded border border-dashed border-slate-200 text-center text-xs text-slate-500 italic">
            Academic records are not available yet.
          </div>
        `}
        <div class="flex justify-between text-xs font-semibold pt-1">
          <span>Overall Attendance: <strong class="text-blue-700">${ac.overallAttendance}</strong></span>
          <span>Cumulative CGPA: <strong class="text-blue-700">${ac.overallCgpa}</strong></span>
        </div>
      </div>

      <!-- 4. Meeting History -->
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-1">4. Mentoring Meeting History</h3>
        ${report.meetings && report.meetings.length > 0 ? `
          <ul class="list-disc list-inside text-xs space-y-1 text-slate-700">
            ${report.meetings.map(m => `<li><strong>Meeting #${m.meeting_number || 1} (${m.meeting_date ? new Date(m.meeting_date).toLocaleDateString() : 'N/A'}):</strong> ${m.agenda || 'N/A'} - <em>Status: ${m.status || 'Completed'}</em></li>`).join('')}
          </ul>
        ` : `
          <p class="text-xs text-slate-400 italic">No mentoring meetings recorded yet.</p>
        `}
      </div>

      <!-- 5. Co-Curricular Activities -->
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-1">5. Certified Activities & Achievements</h3>
        ${report.activities && report.activities.length > 0 ? `
          <ul class="list-disc list-inside text-xs space-y-1 text-slate-700">
            ${report.activities.map(a => `<li><strong>${a.title} (${a.category}):</strong> ${a.description || 'Achievement recorded.'} [Status: ${a.status}] ${a.mentor_remarks ? `(Mentor Remarks: ${a.mentor_remarks})` : ''}</li>`).join('')}
          </ul>
        ` : `
          <p class="text-xs text-slate-400 italic">No co-curricular activities recorded yet.</p>
        `}
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
  return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>`;
}
