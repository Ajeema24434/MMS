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

  const setElemText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '';
  };

  setElemText('st-val-roll', student.roll_no);
  setElemText('st-val-roll-bar', student.roll_no);
  setElemText('st-val-urn', student.urn);
  setElemText('st-val-urn-bar', student.urn);
  setElemText('st-val-div', student.division);
  setElemText('st-val-div-bar', student.division);
  setElemText('st-val-sem', student.semester || 5);
  setElemText('st-val-sem-bar', student.semester || 5);
  setElemText('st-val-batch', student.batch_name || 'Unassigned');
  setElemText('st-val-batch-bar', student.batch_name || 'Unassigned');
  setElemText('st-val-mentor', student.mentor_name || 'Unassigned');

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

let currentAcademicRecords = [];

let studentSubjectAttChartInstance = null;
let studentAcademicTrendChartInstance = null;

function renderStudentAcademicCharts(subjectMarks, records) {
  if (typeof Chart === 'undefined') return;

  // 1. Current Semester Subject Attendance Bar Chart
  const attCanvas = document.getElementById('st-chart-subject-attendance');
  if (attCanvas) {
    if (studentSubjectAttChartInstance) {
      studentSubjectAttChartInstance.destroy();
      studentSubjectAttChartInstance = null;
    }

    const labels = (subjectMarks || []).map(s => s.name || s.subject || 'Subject');
    const dataValues = (subjectMarks || []).map(s => Number(s.attendance_pct ?? s.attendance?.percentage ?? 85.0));
    const bgColors = dataValues.map(v => v >= 85 ? 'rgba(16, 185, 129, 0.85)' : (v >= 75 ? 'rgba(245, 158, 11, 0.85)' : 'rgba(239, 68, 68, 0.85)'));
    const borderColors = dataValues.map(v => v >= 85 ? '#059669' : (v >= 75 ? '#d97706' : '#dc2626'));

    studentSubjectAttChartInstance = new Chart(attCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Attendance %',
            data: dataValues,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1.5,
            borderRadius: 6,
            maxBarThickness: 45
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Attendance: ${ctx.parsed.y}% ${ctx.parsed.y < 75 ? '(Defaulter <75%)' : '(Eligible)'}`
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              callback: (val) => val + '%'
            },
            grid: { color: '#f1f5f9' }
          },
          x: {
            ticks: {
              font: { size: 10 },
              maxRotation: 20,
              minRotation: 0,
              callback: function(val) {
                const label = this.getLabelForValue(val);
                return label.length > 16 ? label.substr(0, 14) + '...' : label;
              }
            },
            grid: { display: false }
          }
        }
      }
    });
  }

  // 2. Academic Progression Trend Chart (CGPA / SGPA Across Semesters)
  const trendCanvas = document.getElementById('st-chart-academic-trend');
  if (trendCanvas) {
    if (studentAcademicTrendChartInstance) {
      studentAcademicTrendChartInstance.destroy();
      studentAcademicTrendChartInstance = null;
    }

    const sorted = [...(records || [])].sort((a, b) => a.semester - b.semester);
    const trendLabels = sorted.length > 0 ? sorted.map(ar => `Semester ${ar.semester}`) : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
    const trendData = sorted.length > 0 ? sorted.map(ar => parseFloat(ar.cgpa) || 8.0) : [8.2, 8.4, 8.6, 8.7, 8.9];

    studentAcademicTrendChartInstance = new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: [
          {
            label: 'SGPA / CGPA',
            data: trendData,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#2563eb',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `CGPA: ${Number(ctx.parsed.y).toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            min: 4,
            max: 10,
            ticks: { stepSize: 1 },
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }
}

// Academic Progression & Subject Details
function populateAcademicView(records, subjectMarks) {
  currentAcademicRecords = records || [];

  // 1. Populate Semester History Table (WITHOUT attendance % column as requested)
  const semHistoryTbody = document.getElementById('semester-history-tbody');
  if (semHistoryTbody) {
    if (!records || records.length === 0) {
      semHistoryTbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-slate-400 text-xs">No academic records recorded yet. Click '+ Add / Update Semester Record' to enter details.</td></tr>`;
    } else {
      const sortedRecords = [...records].sort((a, b) => b.semester - a.semester);
      semHistoryTbody.innerHTML = sortedRecords.map(ar => {
        const isDefaulter = ar.defaulter_flag || ar.subjects_failed_count > 0;
        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
            <td class="px-6 py-3.5 font-bold text-slate-800 text-xs">
              Semester ${ar.semester}
              ${ar.semester === currentStudent?.semester ? '<span class="ml-1.5 px-1.5 py-0.5 text-[9px] bg-blue-100 text-blue-800 rounded font-semibold">Current</span>' : '<span class="ml-1.5 text-[10px] text-slate-400 font-normal">Past Sem</span>'}
            </td>
            <td class="px-6 py-3.5 font-mono font-bold text-blue-700 text-xs">${ar.cgpa ? Number(ar.cgpa).toFixed(2) : '--'}</td>
            <td class="px-6 py-3.5 font-mono text-slate-600 text-[11px]">ISE: ${ar.ise_marks || '--'} | MSE: ${ar.mse_marks || '--'} | ESE: ${ar.ese_marks || '--'}</td>
            <td class="px-6 py-3.5 text-xs">
              ${ar.subjects_failed_count > 0 ? `<span class="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 font-semibold">${ar.subjects_failed_count} Backlog(s)</span>` : '<span class="text-emerald-600 text-xs font-semibold">0 (Clear)</span>'}
            </td>
            <td class="px-6 py-3.5 text-xs">
              ${isDefaulter ? `<span class="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">Attention Required</span>` : `<span class="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-bold">Good Standing</span>`}
            </td>
            <td class="px-6 py-3.5 text-right text-xs">
              <button onclick="openAcademicModal(${ar.semester})" class="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition">
                Edit
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 2. Populate Current Semester Subject Breakdown Table (Hand-in-hand with Mentor Profile)
  const tbody = document.getElementById('academic-table-tbody');
  if (tbody) {
    if (!subjectMarks || subjectMarks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-6 text-center text-slate-400 text-xs">No subject records available.</td></tr>`;
    } else {
      tbody.innerHTML = subjectMarks.map((s, idx) => {
        const name = s.name || s.subject || ('Subject ' + (idx + 1));
        const code = s.code || `AIDS50${idx + 1}`;
        const attendance_pct = s.attendance_pct ?? s.attendance?.percentage ?? 85.0;
        const defaulter = s.defaulter ?? s.attendance?.isDefaulter ?? (attendance_pct < 75.0);
        const ise = s.ise !== undefined ? s.ise : (s.internal !== undefined ? s.internal : 22);
        const mse = s.mse !== undefined ? s.mse : 25;
        const ese = s.ese !== undefined ? s.ese : (s.exam !== undefined ? s.exam : 60);
        const total = s.total !== undefined ? s.total : Math.round(ise * 0.5 + mse * 0.5 + ese);
        const grade = s.grade || (total >= 85 ? 'O' : (total >= 75 ? 'A+' : (total >= 65 ? 'A' : (total >= 50 ? 'B+' : 'B'))));
        const status = s.status || (total >= 40 ? 'Pass' : 'Backlog');

        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
            <td class="px-5 py-3.5 font-semibold text-slate-800 text-xs">
              <div>${name}</div>
              <span class="font-mono text-[10px] text-slate-400 font-normal">${code}</span>
            </td>
            <td class="px-5 py-3.5">
              <div class="space-y-1 min-w-[170px]">
                <div class="flex items-center justify-between text-xs font-mono">
                  <span class="${defaulter ? 'text-rose-600 font-bold' : 'text-slate-800 font-bold'}">${attendance_pct}%</span>
                  ${defaulter ? '<span class="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[9px] font-bold">Defaulter &lt;75%</span>' : '<span class="text-emerald-600 font-semibold text-[9px]">Normal</span>'}
                </div>
                <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div class="h-1.5 rounded-full ${attendance_pct >= 85 ? 'bg-emerald-500' : (attendance_pct >= 75 ? 'bg-amber-500' : 'bg-rose-500')}" style="width: ${Math.min(100, attendance_pct)}%"></div>
                </div>
              </div>
            </td>
            <td class="px-5 py-3.5 text-slate-600 text-xs font-mono">${ise} / 30</td>
            <td class="px-5 py-3.5 text-slate-600 text-xs font-mono">${mse} / 30</td>
            <td class="px-5 py-3.5 text-slate-600 text-xs font-mono">${ese} / 70</td>
            <td class="px-5 py-3.5 font-bold text-blue-600 text-xs font-mono">${total} / 100</td>
            <td class="px-5 py-3.5 text-xs font-bold text-slate-900">
              <span class="px-2 py-0.5 rounded font-bold text-xs ${status === 'Pass' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                ${grade}
              </span>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  const curBadge = document.getElementById('current-sem-badge');
  if (curBadge && currentStudent) {
    curBadge.textContent = `Semester ${currentStudent.semester || 5}`;
  }

  // Summary Footer
  const curSemNum = currentStudent?.semester || 5;
  const currentSemRecord = (records || []).find(r => r.semester === curSemNum) || (records && records[0]) || { attendance_percentage: 85.0, subjects_failed_count: 0 };
  const attEl = document.getElementById('acad-overall-attendance');
  if (attEl) attEl.textContent = `${currentSemRecord.attendance_percentage}%`;

  const defCount = (subjectMarks || []).filter(s => (s.defaulter || (s.attendance_pct ?? s.attendance?.percentage) < 75)).length;
  const belEl = document.getElementById('acad-below-attendance');
  if (belEl) belEl.textContent = `${defCount} Subject${defCount === 1 ? '' : 's'}`;

  const perfEl = document.getElementById('acad-overall-performance');
  if (perfEl) {
    perfEl.textContent = (defCount > 0 || currentSemRecord.attendance_percentage < 75) ? 'Defaulter Notice (<75%)' : 'Good Academic Standing';
  }

  // Render Visual Charts
  renderStudentAcademicCharts(subjectMarks, records);
}

function openAcademicModal(semester) {
  const modal = document.getElementById('academic-modal');
  if (!modal) return;

  const semSelect = document.getElementById('acad-modal-sem');
  const cgpaInput = document.getElementById('acad-modal-cgpa');
  const attInput = document.getElementById('acad-modal-attendance');
  const failedInput = document.getElementById('acad-modal-failed');
  const iseInput = document.getElementById('acad-modal-ise');
  const mseInput = document.getElementById('acad-modal-mse');
  const eseInput = document.getElementById('acad-modal-ese');
  const titleEl = document.getElementById('acad-modal-title');

  const record = semester ? currentAcademicRecords.find(r => r.semester === parseInt(semester)) : null;

  if (record) {
    if (titleEl) titleEl.textContent = `Update Academic Record — Semester ${record.semester}`;
    if (semSelect) semSelect.value = String(record.semester);
    if (cgpaInput) cgpaInput.value = record.cgpa ?? '';
    if (attInput) attInput.value = record.attendance_percentage ?? '';
    if (failedInput) failedInput.value = record.subjects_failed_count ?? 0;
    if (iseInput) iseInput.value = record.ise_marks ?? '';
    if (mseInput) mseInput.value = record.mse_marks ?? '';
    if (eseInput) eseInput.value = record.ese_marks ?? '';
  } else {
    if (titleEl) titleEl.textContent = 'Add Academic Details (Current or Previous Semester)';
    if (semSelect) semSelect.value = String(currentStudent?.semester || 5);
    if (cgpaInput) cgpaInput.value = '';
    if (attInput) attInput.value = '';
    if (failedInput) failedInput.value = '0';
    if (iseInput) iseInput.value = '';
    if (mseInput) mseInput.value = '';
    if (eseInput) eseInput.value = '';
  }

  modal.classList.remove('hidden');
}

function closeAcademicModal() {
  const modal = document.getElementById('academic-modal');
  if (modal) modal.classList.add('hidden');
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
      <td class="px-6 py-4 text-xs font-mono">
        ${a.evidence_url ? `
          <a href="${a.evidence_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-medium hover:text-blue-800 inline-flex items-center space-x-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            <span>${a.evidence_url.split('/').pop()}</span>
          </a>
        ` : `<span class="text-slate-400 italic">None</span>`}
      </td>
      <td class="px-6 py-4 text-sm">${getActivityStatusBadge(a.status)}</td>
      <td class="px-6 py-4 text-xs font-mono ${a.status === 'Approved' ? 'text-emerald-700' : (a.status === 'Rejected' ? 'text-rose-600' : 'text-slate-500')}">
        ${a.mentor_remarks || (a.status === 'Approved' ? 'Verified by Mentor' : (a.status === 'Rejected' ? 'Rejected by Mentor' : 'Verification Pending'))}
      </td>
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

  tbody.innerHTML = meetings.map(m => {
    let attBadge = '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Scheduled</span>';
    if (m.attendance_status === 'Present') {
      attBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Present</span>';
    } else if (m.attendance_status === 'Absent') {
      attBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Absent</span>';
    }

    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
        <td class="px-6 py-4 font-semibold text-slate-900 text-sm">Meeting #${m.meeting_number || 1}</td>
        <td class="px-6 py-4 text-slate-600 text-xs font-mono">${new Date(m.meeting_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        <td class="px-6 py-4 text-slate-600 text-xs">${m.mode || 'Offline'}</td>
        <td class="px-6 py-4 text-slate-800 text-xs font-medium">${m.agenda}</td>
        <td class="px-6 py-4 text-sm"><span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">${m.status || 'Scheduled'}</span></td>
        <td class="px-6 py-4 text-xs font-semibold">
          ${attBadge}
          ${m.attendance_remarks ? `<p class="text-[10px] text-slate-500 font-mono mt-0.5">${m.attendance_remarks}</p>` : ''}
        </td>
      </tr>
    `;
  }).join('');
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
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
      </div>
      <div class="space-y-0.5 flex-1">
        <p class="text-xs text-slate-800 font-medium leading-relaxed">${n.message}</p>
        <span class="text-[10px] text-slate-400 font-mono block">${new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
