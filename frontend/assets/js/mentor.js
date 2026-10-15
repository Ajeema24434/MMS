// Sakshi's Mentor & Excel Reports Module Controller
let allBatchStudents = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = API.getUser();
  if (!user || user.role !== 'MENTOR') return;

  const path = window.location.pathname;

  if (path.includes('/mentor/dashboard.html')) {
    await loadMentorDashboard();
    bindMentorTabs();
    bindMentorStudentSearch();
  } else if (path.includes('/mentor/student.html')) {
    await loadMentorStudentPage();
  }
});

function bindMentorTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      const activeContent = document.getElementById(`tab-${targetTab}`);
      if (activeContent) activeContent.classList.remove('hidden');
    });
  });
}

async function loadMentorDashboard() {
  const res = await API.get('/mentor/dashboard');
  if (!res.success) return;

  const { mentor, assignedBatch, totalStudents, pendingComplaints, resolvedComplaints, students, recentMeetings, mlRiskSummary } = res;
  allBatchStudents = students || [];

  document.getElementById('m-name').textContent = mentor.name;
  document.getElementById('m-code').textContent = mentor.mentor_code;
  document.getElementById('m-dept-desig').textContent = `${mentor.designation} (${mentor.department})`;
  document.getElementById('m-batch-name').textContent = assignedBatch ? assignedBatch.name : 'No Assigned Batch';
  document.getElementById('m-stat-students').textContent = totalStudents;
  document.getElementById('m-stat-complaints').textContent = pendingComplaints;

  // ML Risk Summary Cards
  if (mlRiskSummary) {
    document.getElementById('ml-count-bright').textContent = mlRiskSummary.Bright || 0;
    document.getElementById('ml-count-average').textContent = mlRiskSummary.Average || 0;
    document.getElementById('ml-count-weak').textContent = mlRiskSummary.Weak || 0;
  }

  // Render Students Roster Table
  renderMentorStudentsTable(allBatchStudents);

  // Complaints Table with Update Status action
  await loadMentorComplaints();

  // Activities & Certificates Verification Table
  await loadMentorActivities();

  // Meetings History List
  renderMeetingsList(recentMeetings);
}

function renderMentorStudentsTable(students) {
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;

  if (!students || students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 text-sm">No students found in assigned batch.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="px-6 py-4 text-slate-700 text-sm font-mono">${s.roll_no}</td>
      <td class="px-6 py-4 font-semibold text-slate-900 text-sm">${s.name}</td>
      <td class="px-6 py-4 text-slate-600 text-sm font-mono">${s.urn}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">Div ${s.division}</td>
      <td class="px-6 py-4 text-sm">${getRiskBadgeHTML(s.ml_risk_level)}</td>
      <td class="px-6 py-4 text-sm">
        <div class="flex items-center space-x-2">
          <button onclick="viewStudentDetail(${s.id})" class="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded border border-indigo-200 transition">
            View Profile
          </button>
          <button onclick="downloadMentorStudentReport(${s.id})" class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded border border-emerald-200 transition flex items-center space-x-1" title="Generate Mentoring Report">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span>Report</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function bindMentorStudentSearch() {
  const input = document.getElementById('mentor-student-search');
  if (input) {
    input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = allBatchStudents.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.urn.toLowerCase().includes(q) ||
        s.roll_no.toLowerCase().includes(q)
      );
      renderMentorStudentsTable(filtered);
    });
  }
}

async function loadMentorComplaints() {
  const complaintsRes = await API.get('/mentor/complaints');
  const complaintsTbody = document.getElementById('complaints-tbody');
  if (complaintsTbody && complaintsRes.success) {
    if (!complaintsRes.complaints || complaintsRes.complaints.length === 0) {
      complaintsTbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 text-sm">No complaints submitted for this batch.</td></tr>`;
    } else {
      complaintsTbody.innerHTML = complaintsRes.complaints.map(c => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="px-6 py-4 font-semibold text-slate-900 text-sm">${c.student_name} (${c.roll_no})</td>
          <td class="px-6 py-4 text-slate-800 text-sm font-medium">${c.title}<p class="text-slate-500 font-normal text-xs mt-0.5">${c.description}</p></td>
          <td class="px-6 py-4 text-slate-600 text-xs">${c.category}</td>
          <td class="px-6 py-4 text-sm">${getComplaintStatusBadge(c.status)}</td>
          <td class="px-6 py-4 text-slate-600 text-xs font-mono">${c.mentor_response || '<span class="text-slate-400 italic">No response yet</span>'}</td>
          <td class="px-6 py-4 text-sm">
            <button onclick="openComplaintResponseModal(${c.id}, '${c.student_name.replace(/'/g, "\\'")}', '${c.title.replace(/'/g, "\\'")}', '${c.status}', '${(c.mentor_response || '').replace(/'/g, "\\'")}')" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300">
              Update Resolution
            </button>
          </td>
        </tr>
      `).join('');
    }
  }
}

function renderMeetingsList(meetings) {
  const meetingsList = document.getElementById('meetings-list');
  if (meetingsList) {
    if (!meetings || meetings.length === 0) {
      meetingsList.innerHTML = `<p class="text-xs text-slate-400 italic">No meeting agendas recorded yet.</p>`;
    } else {
      meetingsList.innerHTML = meetings.map(m => `
        <div class="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div class="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-slate-900 text-sm">Meeting #${m.meeting_number || 1}: ${m.agenda}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${m.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">${m.status || 'Scheduled'}</span>
            </div>
            <span class="text-slate-500 font-mono">${new Date(m.meeting_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
            <p><strong>Mode:</strong> ${m.mode || 'Offline'}</p>
            <p><strong>Batch:</strong> ${m.batch_name || 'Assigned Batch'}</p>
            <p><strong>Attendance:</strong> <span class="font-bold text-emerald-600">${m.present_count || 0}</span> Present / <span class="font-bold text-rose-500">${m.absent_count || 0}</span> Absent</p>
          </div>
          <p class="text-xs text-slate-600"><strong>Discussion / Remarks:</strong> ${m.discussion || m.remarks || 'Meeting agenda recorded.'}</p>
          <div class="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button onclick="openMeetingAttendanceModal(${m.id})" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              <span>Mark / Update Attendance</span>
            </button>
          </div>
        </div>
      `).join('');
    }
  }
}

// ACTIVITIES & CERTIFICATES VERIFICATION LIST
async function loadMentorActivities() {
  const tbody = document.getElementById('mentor-activities-tbody');
  const badge = document.getElementById('pending-activities-badge');
  if (!tbody) return;

  const res = await API.get('/mentor/activities');
  if (!res.success) {
    tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-rose-500 text-sm">Failed to load activities.</td></tr>`;
    return;
  }

  const activities = res.activities || [];
  const pendingCount = activities.filter(a => a.status === 'Pending').length;
  if (badge) {
    badge.textContent = `${pendingCount} Pending Verification`;
    badge.className = pendingCount > 0 
      ? 'px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200'
      : 'px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200';
  }

  if (activities.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-slate-400 text-sm">No student certificates or activities submitted yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = activities.map(a => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="px-6 py-4 font-semibold text-slate-900 text-xs">
        ${a.student_name}
        <span class="block text-[11px] text-slate-400 font-mono">Roll: ${a.roll_no} | URN: ${a.urn}</span>
      </td>
      <td class="px-6 py-4 text-xs font-medium text-slate-800">
        ${a.title}
        ${a.description ? `<p class="text-slate-400 font-normal text-[11px] mt-0.5 line-clamp-1">${a.description}</p>` : ''}
      </td>
      <td class="px-6 py-4 text-xs"><span class="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded border border-blue-100">${a.category}</span></td>
      <td class="px-6 py-4 text-xs font-mono text-slate-500">${a.date_achieved ? new Date(a.date_achieved).toLocaleDateString() : '--'}</td>
      <td class="px-6 py-4 text-xs">
        <a href="#" onclick="alert('Viewing verified student certificate: ${a.evidence_url || 'certificate.pdf'}'); return false;" class="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-medium underline">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
          <span>${a.evidence_url || 'certificate.pdf'}</span>
        </a>
      </td>
      <td class="px-6 py-4 text-xs">${getActivityStatusBadge(a.status)}</td>
      <td class="px-6 py-4 text-xs text-slate-600 font-mono">${a.mentor_remarks || '<span class="text-slate-400 italic">None</span>'}</td>
      <td class="px-6 py-4 text-xs">
        ${a.status === 'Approved' ? `
          <div class="flex items-center space-x-1.5">
            <span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-xs inline-flex items-center space-x-1">
              <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Approved</span>
            </span>
            <button onclick="openVerifyActivityModal(${a.id}, '${(a.student_name + ': ' + a.title).replace(/'/g, "\\'")}', '${(a.evidence_url || 'certificate.pdf').replace(/'/g, "\\'")}', '${a.status}', '${(a.mentor_remarks || '').replace(/'/g, "\\'")}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-300 transition">
              Remarks
            </button>
          </div>
        ` : (a.status === 'Rejected' ? `
          <div class="flex items-center space-x-1.5">
            <span class="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold text-xs inline-flex items-center space-x-1">
              <svg class="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              <span>Rejected</span>
            </span>
            <button onclick="openVerifyActivityModal(${a.id}, '${(a.student_name + ': ' + a.title).replace(/'/g, "\\'")}', '${(a.evidence_url || 'certificate.pdf').replace(/'/g, "\\'")}', '${a.status}', '${(a.mentor_remarks || '').replace(/'/g, "\\'")}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-300 transition">
              Remarks
            </button>
          </div>
        ` : `
          <div class="flex items-center space-x-1.5">
            <button onclick="quickVerifyActivity(${a.id}, 'Approved')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded shadow-sm transition">
              Approve
            </button>
            <button onclick="quickVerifyActivity(${a.id}, 'Rejected')" class="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded shadow-sm transition">
              Reject
            </button>
            <button onclick="openVerifyActivityModal(${a.id}, '${(a.student_name + ': ' + a.title).replace(/'/g, "\\'")}', '${(a.evidence_url || 'certificate.pdf').replace(/'/g, "\\'")}', '${a.status}', '${(a.mentor_remarks || '').replace(/'/g, "\\'")}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-300 transition">
              Remarks
            </button>
          </div>
        `)}
      </td>
    </tr>
  `).join('');
}

function getActivityStatusBadge(status) {
  if (status === 'Approved') return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>`;
  if (status === 'Rejected') return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>`;
  return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>`;
}

// MEETING ATTENDANCE MODAL CONTROLS
let currentMeetingAttendees = [];
let currentMeetingIdForAttendance = null;

async function openMeetingAttendanceModal(meetingId) {
  currentMeetingIdForAttendance = meetingId;
  const modal = document.getElementById('meeting-attendance-modal');
  const tbody = document.getElementById('meeting-attendance-tbody');
  const titleEl = document.getElementById('att-modal-title');
  const subtitleEl = document.getElementById('att-modal-subtitle');

  if (!modal || !tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Loading batch mentees...</td></tr>`;
  modal.classList.remove('hidden');

  const res = await API.get(`/mentor/meetings/${meetingId}/attendance`);
  if (!res.success) {
    alert(res.message || 'Error loading meeting attendance');
    modal.classList.add('hidden');
    return;
  }

  const { meeting, attendees } = res;
  currentMeetingAttendees = attendees || [];

  if (titleEl) titleEl.textContent = `Mark Attendance — Meeting #${meeting.meeting_number || 1}`;
  if (subtitleEl) subtitleEl.textContent = `${meeting.agenda} (${new Date(meeting.meeting_date).toLocaleDateString()})`;

  renderMeetingAttendeesRows(currentMeetingAttendees);
}

function closeMeetingAttendanceModal() {
  const modal = document.getElementById('meeting-attendance-modal');
  if (modal) modal.classList.add('hidden');
  currentMeetingIdForAttendance = null;
}

function renderMeetingAttendeesRows(attendees) {
  const tbody = document.getElementById('meeting-attendance-tbody');
  if (!tbody) return;

  if (attendees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-slate-400">No students found in this batch.</td></tr>`;
    return;
  }

  tbody.innerHTML = attendees.map(a => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition" data-sid="${a.student_id}">
      <td class="px-4 py-2.5 font-mono text-slate-700 font-semibold">${a.roll_no}</td>
      <td class="px-4 py-2.5 font-bold text-slate-900">${a.student_name}</td>
      <td class="px-4 py-2.5 font-mono text-slate-500">${a.urn}</td>
      <td class="px-4 py-2.5">
        <select class="att-status-select px-2.5 py-1 rounded font-semibold text-xs border ${a.status === 'Absent' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} outline-none" onchange="this.className = 'att-status-select px-2.5 py-1 rounded font-semibold text-xs border ' + (this.value === 'Absent' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700')">
          <option value="Present" ${a.status !== 'Absent' ? 'selected' : ''}>Present</option>
          <option value="Absent" ${a.status === 'Absent' ? 'selected' : ''}>Absent</option>
        </select>
      </td>
      <td class="px-4 py-2.5">
        <input type="text" class="att-remarks-input w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Optional remarks..." value="${(a.remarks || '').replace(/"/g, '&quot;')}">
      </td>
    </tr>
  `).join('');
}

function markAllAttendance(status) {
  const selects = document.querySelectorAll('.att-status-select');
  selects.forEach(sel => {
    sel.value = status;
    sel.className = 'att-status-select px-2.5 py-1 rounded font-semibold text-xs border ' + 
      (status === 'Absent' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700');
  });
}

async function saveMeetingAttendanceSubmit() {
  if (!currentMeetingIdForAttendance) return;

  const rows = document.querySelectorAll('#meeting-attendance-tbody tr[data-sid]');
  const attendees = [];

  rows.forEach(r => {
    const studentId = parseInt(r.getAttribute('data-sid'));
    const status = r.querySelector('.att-status-select')?.value || 'Present';
    const remarks = r.querySelector('.att-remarks-input')?.value.trim() || '';
    attendees.push({ student_id: studentId, status, remarks });
  });

  const res = await API.post(`/mentor/meetings/${currentMeetingIdForAttendance}/attendance`, {
    attendees,
    meeting_status: 'Completed'
  });

  if (res.success) {
    closeMeetingAttendanceModal();
    alert('Meeting attendance saved successfully! Mentees have been notified.');
    await loadMentorDashboard();
  } else {
    alert(res.message || 'Error saving attendance');
  }
}

function openVerifyActivityModal(id, title, evidence, status, remarks) {
  const modal = document.getElementById('verify-activity-modal');
  if (!modal) return;

  const idEl = document.getElementById('va-id');
  if (idEl) idEl.value = id;

  const titleEl = document.getElementById('va-title');
  if (titleEl) titleEl.textContent = title || 'Mentee Activity';

  const evEl = document.getElementById('va-evidence');
  if (evEl) evEl.textContent = evidence || 'certificate.pdf';

  const evLink = document.getElementById('va-evidence-link');
  if (evLink) {
    if (evidence && evidence !== 'certificate.pdf') {
      evLink.href = evidence.startsWith('/uploads/') ? evidence : (evidence.startsWith('http') ? evidence : `/uploads/activities/${evidence}`);
      evLink.textContent = evidence.split('/').pop();
    } else {
      evLink.href = '#';
      evLink.textContent = 'certificate.pdf';
    }
  }

  const statusEl = document.getElementById('va-status');
  if (statusEl) statusEl.value = status || 'Approved';

  const remarksEl = document.getElementById('va-remarks');
  if (remarksEl) remarksEl.value = remarks || '';

  modal.classList.remove('hidden');
}

function closeVerifyActivityModal() {
  const modal = document.getElementById('verify-activity-modal');
  if (modal) modal.classList.add('hidden');
}

async function quickVerifyActivity(id, status) {
  const remarks = status === 'Approved' ? 'Verified by faculty mentor' : 'Certificate unverified / incomplete details';
  const res = await API.put(`/mentor/activities/${id}/status`, {
    status,
    mentor_remarks: remarks
  });

  if (res.success) {
    if (document.getElementById('mentor-activities-tbody')) {
      await loadMentorActivities();
    } else if (window.location.pathname.includes('student.html')) {
      await loadMentorStudentPage();
    }
  } else {
    alert(res.message || 'Error updating activity status');
  }
}

function viewStudentDetail(studentId) {
  window.location.href = `/mentor/student.html?id=${studentId}`;
}

// REPORT DOWNLOAD FUNCTIONS
async function downloadReport(reportNumber) {
  const user = API.getUser();
  const token = localStorage.getItem('mms_token');
  
  const statusEl = document.getElementById('report-status-msg');
  if (statusEl) {
    statusEl.textContent = `Generating Report ${reportNumber}... Please wait.`;
    statusEl.classList.remove('hidden');
  }

  try {
    const response = await fetch(`/api/mentor/reports/report${reportNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      alert(`Error generating Report ${reportNumber}. HTTP status: ${response.status}`);
      if (statusEl) statusEl.classList.add('hidden');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Batch_Report_${reportNumber}_2026.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    if (statusEl) {
      statusEl.textContent = `Report ${reportNumber} downloaded successfully!`;
      setTimeout(() => statusEl.classList.add('hidden'), 3000);
    }
  } catch (err) {
    alert(`Error downloading report ${reportNumber}`);
    if (statusEl) statusEl.classList.add('hidden');
  }
}

function getComplaintStatusBadge(status) {
  if (status === 'Resolved') return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>`;
  if (status === 'In Progress') return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">In Progress</span>`;
  return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>`;
}

function getRiskBadgeHTML(level) {
  if (level === 'Bright') return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-bright">Bright</span>`;
  if (level === 'Average') return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-average">Average</span>`;
  if (level === 'Weak') return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-weak">Weak</span>`;
  return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-pending">Pending</span>`;
}

// Student Profile View for Mentor
let currentStudentAcademicAnalysis = {};
let currentStudentAcademicRecords = [];
let currentSelectedSemester = 5;
let currentMenteeStudentId = null;
let subjectAttendanceChartInstance = null;
let academicTrendChartInstance = null;

function selectSemesterAnalysisTab(sem) {
  currentSelectedSemester = sem;
  renderSubjectBreakdownForSem(sem);
}

function renderMentorCharts(subjects, academicRecords, sem) {
  if (typeof Chart === 'undefined') return;

  // 1. Current Semester Subject Attendance Bar Chart
  const attCanvas = document.getElementById('chart-subject-attendance');
  if (attCanvas) {
    if (subjectAttendanceChartInstance) {
      subjectAttendanceChartInstance.destroy();
      subjectAttendanceChartInstance = null;
    }

    const labels = subjects.map(s => s.name || s.subject || 'Subject');
    const dataValues = subjects.map(s => Number(s.attendance_pct ?? 85.0));
    const bgColors = dataValues.map(v => v >= 85 ? 'rgba(16, 185, 129, 0.85)' : (v >= 75 ? 'rgba(245, 158, 11, 0.85)' : 'rgba(239, 68, 68, 0.85)'));
    const borderColors = dataValues.map(v => v >= 85 ? '#059669' : (v >= 75 ? '#d97706' : '#dc2626'));

    subjectAttendanceChartInstance = new Chart(attCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Subject Attendance %',
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
  const trendCanvas = document.getElementById('chart-academic-trend');
  if (trendCanvas) {
    if (academicTrendChartInstance) {
      academicTrendChartInstance.destroy();
      academicTrendChartInstance = null;
    }

    const sorted = [...(academicRecords || [])].sort((a, b) => a.semester - b.semester);
    const trendLabels = sorted.length > 0 ? sorted.map(ar => `Semester ${ar.semester}`) : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
    const trendData = sorted.length > 0 ? sorted.map(ar => parseFloat(ar.cgpa) || 8.0) : [8.2, 8.4, 8.6, 8.7, 8.9];

    academicTrendChartInstance = new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: [
          {
            label: 'SGPA / CGPA',
            data: trendData,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#4f46e5',
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

function renderSubjectBreakdownForSem(sem) {
  // Update tab buttons visual style
  document.querySelectorAll('#sem-tabs-container button').forEach(btn => {
    btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer';
  });
  const activeBtn = document.getElementById(`sem-tab-btn-${sem}`);
  if (activeBtn) {
    activeBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-indigo-600 text-white shadow cursor-pointer';
  }

  const analysis = currentStudentAcademicAnalysis[sem] || {
    semester: sem,
    attendance_percentage: 85,
    cgpa: 8.5,
    subjects: []
  };

  const attEl = document.getElementById('sub-sel-att');
  const defEl = document.getElementById('sub-sel-def');
  const cgpaEl = document.getElementById('sub-sel-cgpa');
  const tbody = document.getElementById('sub-breakdown-tbody');

  if (attEl) attEl.textContent = `${analysis.attendance_percentage}%`;
  if (cgpaEl) cgpaEl.textContent = analysis.cgpa ? Number(analysis.cgpa).toFixed(2) : '--';

  // Normalize subjects safely so undefined can never appear
  const subjects = (analysis.subjects || []).map((s, idx) => {
    const name = s.name || s.subject || ('Subject ' + (idx + 1));
    const code = s.code || `AIDS${sem}0${idx + 1}`;
    const conducted = s.conducted ?? s.attendance?.conducted ?? 36;
    const attended = s.attended ?? s.attendance?.attended ?? Math.round(conducted * 0.85);
    const attendance_pct = s.attendance_pct ?? s.attendance?.percentage ?? parseFloat(((attended / conducted) * 100).toFixed(1));
    const defaulter = s.defaulter ?? s.attendance?.isDefaulter ?? (attendance_pct < 75.0);
    const ise = s.ise !== undefined ? s.ise : (s.internal !== undefined ? s.internal : 22);
    const mse = s.mse !== undefined ? s.mse : 25;
    const ese = s.ese !== undefined ? s.ese : (s.exam !== undefined ? s.exam : 60);
    const total = s.total !== undefined ? s.total : Math.round(ise * 0.5 + mse * 0.5 + ese);
    const grade = s.grade || (total >= 85 ? 'O' : (total >= 75 ? 'A+' : (total >= 65 ? 'A' : (total >= 50 ? 'B+' : 'B'))));
    const status = s.status || (total >= 40 ? 'Pass' : 'Backlog');
    const remarks = s.remarks || '';
    return { name, code, conducted, attended, attendance_pct, defaulter, ise, mse, ese, total, grade, status, remarks, credits: s.credits || 4 };
  });

  const defaulterCount = subjects.filter(s => s.defaulter || s.attendance_pct < 75).length;
  if (defEl) {
    defEl.textContent = `${defaulterCount} Subject${defaulterCount === 1 ? '' : 's'}`;
    defEl.className = `text-xl font-black ${defaulterCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`;
  }

  if (tbody) {
    if (subjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="px-5 py-6 text-center text-slate-400">No subject-level evaluation data recorded for Semester ${sem}.</td></tr>`;
    } else {
      tbody.innerHTML = subjects.map(s => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
          <td class="px-5 py-3.5 font-semibold text-slate-900">
            <div>${s.name}</div>
            <span class="font-mono text-[10px] text-slate-400 font-normal">${s.code}</span>
          </td>
          <td class="px-5 py-3.5">
            <div class="space-y-1 min-w-[150px]">
              <div class="flex items-center justify-between text-xs font-mono font-bold">
                <span class="${s.defaulter ? 'text-rose-600' : 'text-slate-800'}">${s.attendance_pct}%</span>
                ${s.defaulter 
                  ? '<span class="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[9px] font-bold">Defaulter &lt;75%</span>' 
                  : '<span class="text-emerald-600 font-semibold text-[9px]">Normal</span>'}
              </div>
              <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="h-1.5 rounded-full ${s.attendance_pct >= 85 ? 'bg-emerald-500' : (s.attendance_pct >= 75 ? 'bg-amber-500' : 'bg-rose-500')}" style="width: ${Math.min(100, s.attendance_pct)}%"></div>
              </div>
            </div>
          </td>
          <td class="px-5 py-3.5 font-mono text-slate-700">${s.ise} / 30</td>
          <td class="px-5 py-3.5 font-mono text-slate-700">${s.mse} / 30</td>
          <td class="px-5 py-3.5 font-mono text-slate-700">${s.ese} / 70</td>
          <td class="px-5 py-3.5 font-mono font-bold text-slate-900">${s.total} / 100</td>
          <td class="px-5 py-3.5">
            <span class="px-2 py-0.5 rounded font-bold text-xs ${s.status === 'Pass' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
              ${s.grade}
            </span>
          </td>
          <td class="px-5 py-3.5 text-right">
            <button type="button" onclick="openSubjectAttendanceModal('${s.code}', '${s.name.replace(/'/g, "\\'")}', ${s.attendance_pct}, ${sem}, '${(s.remarks || '').replace(/'/g, "\\'")}')" class="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition cursor-pointer">
              Edit Attendance
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Render Visual Charts
  renderMentorCharts(subjects, currentStudentAcademicRecords, sem);

  // Render Subject-Wise Attendance Entry Cards
  renderSubjectAttendanceEntryCards(subjects, sem, analysis.attendance_percentage);
}

// Render Subject Attendance Entry Form Cards directly below analysis
function renderSubjectAttendanceEntryCards(subjects, sem, overallAttendancePct = 85.0) {
  const container = document.getElementById('subject-attendance-entry-cards');
  const badge = document.getElementById('subj-att-cur-sem-badge');
  const totalInput = document.getElementById('total-att-input');
  
  if (badge) badge.textContent = `Semester ${sem} Subjects`;
  if (totalInput) totalInput.value = overallAttendancePct !== undefined ? overallAttendancePct : 85.0;
  if (!container) return;

  if (!subjects || subjects.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 py-4 col-span-3 text-center">No subjects available for Semester ${sem}.</p>`;
    return;
  }

  container.innerHTML = subjects.map(s => {
    const isDef = s.defaulter || s.attendance_pct < 75.0;
    return `
      <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 hover:border-indigo-300 transition shadow-sm">
        <div class="flex items-start justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div>
            <h4 class="font-bold text-slate-900 text-sm leading-snug">${s.name}</h4>
            <span class="font-mono text-[10px] text-slate-400 font-semibold">${s.code} • ${s.credits || 4} Credits</span>
          </div>
          <span id="subj-card-badge-${s.code}" class="px-2 py-0.5 rounded text-[10px] font-bold ${s.attendance_pct >= 85 ? 'bg-emerald-100 text-emerald-800' : (s.attendance_pct >= 75 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')} flex-shrink-0">
            ${s.attendance_pct}% ${isDef ? '(Defaulter)' : ''}
          </span>
        </div>

        <div>
          <label class="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Attendance Percentage (%)</label>
          <div class="relative">
            <input type="number" id="subj-card-pct-${s.code}" value="${s.attendance_pct}" step="0.1" min="0" max="100" class="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg font-mono text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white" oninput="updateCardAttendanceLive('${s.code}')">
            <span class="absolute right-3 top-2.5 font-bold text-slate-400 text-xs">%</span>
          </div>
        </div>

        <div>
          <label class="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Observation / Counseling Remarks</label>
          <input type="text" id="subj-card-rem-${s.code}" value="${(s.remarks || '').replace(/"/g, '&quot;')}" placeholder="e.g. Regular in coursework" class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500">
        </div>

        <div class="pt-1">
          <button type="button" id="subj-card-btn-${s.code}" onclick="saveSingleSubjectAttendance(${sem}, '${s.code}', '${s.name.replace(/'/g, "\\'")}')" class="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span>Save ${s.code} Attendance %</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Live calculation in entry cards
function updateCardAttendanceLive(code) {
  const pctEl = document.getElementById(`subj-card-pct-${code}`);
  const badge = document.getElementById(`subj-card-badge-${code}`);
  if (!pctEl || !badge) return;

  const pct = parseFloat(pctEl.value);
  if (isNaN(pct)) return;
  const isDef = pct < 75.0;

  badge.textContent = `${pct}% ${isDef ? '(Defaulter)' : ''}`;
  badge.className = `px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${pct >= 85 ? 'bg-emerald-100 text-emerald-800' : (pct >= 75 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}`;
}

// Save single subject attendance percentage from entry card
async function saveSingleSubjectAttendance(sem, code, name) {
  const pctEl = document.getElementById(`subj-card-pct-${code}`);
  const remEl = document.getElementById(`subj-card-rem-${code}`);
  const btn = document.getElementById(`subj-card-btn-${code}`);

  const pct = parseFloat(pctEl.value);
  const remarks = remEl ? remEl.value.trim() : '';

  if (isNaN(pct) || pct < 0 || pct > 100) {
    alert('Please enter a valid attendance percentage between 0.0 and 100.0');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Saving...</span>`;
  }

  try {
    const res = await API.post(`/mentor/students/${currentMenteeStudentId}/subject-attendance`, {
      semester: sem,
      subject_code: code,
      subject_name: name,
      attendance_percentage: pct,
      remarks: remarks
    });

    if (res.success) {
      alert(`Attendance for ${name} (${code}) successfully saved: ${pct}%.`);
      await loadMentorStudentPage();
    } else {
      alert(res.message || 'Error saving subject attendance.');
    }
  } catch (err) {
    alert('Server error saving subject attendance.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        <span>Save ${code} Attendance %</span>
      `;
    }
  }
}

// Subject Attendance Modal (Percentage Only)
function openSubjectAttendanceModal(code, name, attendance_pct, sem, remarks = '') {
  const modal = document.getElementById('subject-attendance-modal');
  if (!modal) return;

  const codeEl = document.getElementById('sam-code');
  const nameEl = document.getElementById('sam-name');
  const semEl = document.getElementById('sam-sem');
  const subjDisp = document.getElementById('sam-subj-display');
  const codeDisp = document.getElementById('sam-code-display');
  const pctEl = document.getElementById('sam-percentage');
  const remEl = document.getElementById('sam-remarks');

  if (codeEl) codeEl.value = code;
  if (nameEl) nameEl.value = name;
  if (semEl) semEl.value = sem || currentSelectedSemester;
  if (subjDisp) subjDisp.textContent = name;
  if (codeDisp) codeDisp.textContent = `${code} • Semester ${sem || currentSelectedSemester}`;
  if (pctEl) pctEl.value = attendance_pct !== undefined ? attendance_pct : 85.0;
  if (remEl) remEl.value = remarks || '';

  updateModalAttendanceLive();

  modal.classList.remove('hidden');
}

function closeSubjectAttendanceModal() {
  const modal = document.getElementById('subject-attendance-modal');
  if (modal) modal.classList.add('hidden');
}

function updateModalAttendanceLive() {
  const pctEl = document.getElementById('sam-percentage');
  const preview = document.getElementById('sam-pct-preview');
  const badge = document.getElementById('sam-status-badge');
  if (!pctEl || !preview || !badge) return;

  const pct = parseFloat(pctEl.value);
  if (isNaN(pct)) {
    preview.textContent = '--%';
    return;
  }
  preview.textContent = `${pct}%`;

  if (pct >= 85) {
    badge.textContent = 'Eligible (High)';
    badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800';
  } else if (pct >= 75) {
    badge.textContent = 'Eligible (Normal)';
    badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800';
  } else {
    badge.textContent = 'Defaulter Alert (<75%)';
    badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800';
  }
}

async function loadMentorStudentPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('id');
  currentMenteeStudentId = studentId;

  const errorBox = document.getElementById('error-box');
  const errorMsg = document.getElementById('error-box-msg');
  const profileContent = document.getElementById('profile-content');

  if (!studentId) {
    if (errorBox) errorBox.classList.remove('hidden');
    if (errorMsg) errorMsg.textContent = 'No student ID provided in request URL.';
    if (profileContent) profileContent.classList.add('hidden');
    return;
  }

  const res = await API.get(`/mentor/students/${studentId}`);
  if (!res.success) {
    if (errorBox) errorBox.classList.remove('hidden');
    if (errorMsg) errorMsg.textContent = res.message || 'You do not have permission to view students from other batches.';
    if (profileContent) profileContent.classList.add('hidden');
    return;
  }

  if (errorBox) errorBox.classList.add('hidden');
  if (profileContent) profileContent.classList.remove('hidden');

  const { student, currentSemester, academicRecords, semesterAnalysis, activities, mlDemoResult } = res;
  currentStudentAcademicAnalysis = semesterAnalysis || {};
  currentStudentAcademicRecords = academicRecords || [];
  currentSelectedSemester = currentSemester || student.semester || 5;

  const setName = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '';
  };

  setName('st-detail-name', student.name);
  setName('st-detail-dept-div', `${student.department || 'AI & DS'} — Year ${student.year || 3} (Division ${student.division || 'A'})`);
  setName('st-detail-urn', student.urn);
  setName('st-detail-roll', student.roll_no);
  setName('st-detail-batch', student.batch_name || 'Assigned Batch');
  setName('st-detail-sem', currentSemester || student.semester || 5);

  const riskBadge = document.getElementById('ml-risk-badge');
  if (riskBadge) {
    riskBadge.innerHTML = getRiskBadgeHTML(mlDemoResult?.risk_level || student.ml_risk_level);
  }

  const confEl = document.getElementById('ml-confidence');
  if (confEl) {
    const confVal = mlDemoResult?.confidence ? Math.round(mlDemoResult.confidence * 100) : 85;
    confEl.textContent = `Confidence: ${confVal}% (${mlDemoResult?.support_priority || 'Standard'} Priority)`;
  }

  // 1. Render Interactive Semester Selector Tabs & Subject Breakdown
  const semTabsContainer = document.getElementById('sem-tabs-container');
  const semKeys = Object.keys(currentStudentAcademicAnalysis).map(Number).sort((a, b) => b - a);
  const activeSem = semKeys.includes(currentSelectedSemester) ? currentSelectedSemester : (semKeys[0] || 5);

  if (semTabsContainer) {
    if (semKeys.length === 0) {
      semTabsContainer.innerHTML = `
        <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow">
          Sem ${currentSelectedSemester} (Current)
        </button>
      `;
    } else {
      semTabsContainer.innerHTML = semKeys.map(sem => `
        <button type="button" onclick="selectSemesterAnalysisTab(${sem})" id="sem-tab-btn-${sem}" class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${sem === activeSem ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
          Sem ${sem} ${sem === (currentSemester || student.semester || 5) ? '(Current)' : ''}
        </button>
      `).join('');
    }
  }

  renderSubjectBreakdownForSem(activeSem);

  // 4. Populate Activities with Certificate Verification Controls (Hide Approve/Reject on Approved status)
  const activitiesList = document.getElementById('st-activities-list');
  if (activitiesList) {
    const actBadge = document.getElementById('act-count-badge');
    if (actBadge) actBadge.textContent = `${activities ? activities.length : 0} Records`;

    if (!activities || activities.length === 0) {
      activitiesList.innerHTML = `<p class="text-xs text-slate-400 py-3 text-center">No achievements recorded yet.</p>`;
    } else {
      activitiesList.innerHTML = activities.map(a => {
        const certFileName = a.evidence_url ? a.evidence_url.split('/').pop() : 'certificate.pdf';
        const certLink = a.evidence_url ? `
          <a href="${a.evidence_url}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 font-semibold underline hover:text-indigo-800">
            Certificate: ${certFileName}
          </a>
        ` : `<span class="text-slate-400 italic">No file attached</span>`;

        // Render Action Buttons:
        // After approval, approve and reject options MUST NOT be shown; "Approved" badge must be shown.
        let actionButtonsHtml = '';
        if (a.status === 'Approved') {
          actionButtonsHtml = `
            <div class="flex items-center space-x-1.5 flex-shrink-0">
              <span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-xs inline-flex items-center space-x-1">
                <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span>Approved</span>
              </span>
              <button onclick="openVerifyActivityModal(${a.id}, '${a.title.replace(/'/g, "\\'")}', '${(a.evidence_url || 'certificate.pdf').replace(/'/g, "\\'")}', '${a.status}', '${(a.mentor_remarks || '').replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded border border-slate-300 transition cursor-pointer">
                Remarks
              </button>
            </div>
          `;
        } else if (a.status === 'Rejected') {
          actionButtonsHtml = `
            <div class="flex items-center space-x-1.5 flex-shrink-0">
              <span class="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold text-xs inline-flex items-center space-x-1">
                <svg class="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                <span>Rejected</span>
              </span>
              <button onclick="openVerifyActivityModal(${a.id}, '${a.title.replace(/'/g, "\\'")}', '${(a.evidence_url || 'certificate.pdf').replace(/'/g, "\\'")}', '${a.status}', '${(a.mentor_remarks || '').replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded border border-slate-300 transition cursor-pointer">
                Remarks
              </button>
            </div>
          `;
        } else {
          actionButtonsHtml = `
            <div class="flex items-center space-x-1.5 flex-shrink-0">
              <button onclick="quickVerifyActivity(${a.id}, 'Approved')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded shadow-sm transition cursor-pointer">
                Approve
              </button>
              <button onclick="quickVerifyActivity(${a.id}, 'Rejected')" class="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded shadow-sm transition cursor-pointer">
                Reject
              </button>
              <button onclick="openVerifyActivityModal(${a.id}, '${a.title.replace(/'/g, "\\'")}', '${(a.evidence_url || 'certificate.pdf').replace(/'/g, "\\'")}', '${a.status}', '${(a.mentor_remarks || '').replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded border border-slate-300 transition cursor-pointer">
                Remarks
              </button>
            </div>
          `;
        }

        return `
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-bold text-slate-900">${a.title}</span>
                <span class="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded border border-indigo-100">${a.category}</span>
                ${getActivityStatusBadge(a.status)}
              </div>
              <p class="text-xs text-slate-600">${a.description || 'Achievement submitted by student.'}</p>
              <div class="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500 font-mono">
                <span>Date: ${a.date_achieved ? new Date(a.date_achieved).toLocaleDateString() : '2026'}</span>
                <span>•</span>
                ${certLink}
                ${a.mentor_remarks ? `<span>•</span><span class="text-slate-700 italic">Mentor Remarks: "${a.mentor_remarks}"</span>` : ''}
              </div>
            </div>
            ${actionButtonsHtml}
          </div>
        `;
      }).join('');
    }
  }

  // 2. Ensure subject-attendance-modal-form listener is attached (Percentage only)
  const samForm = document.getElementById('subject-attendance-modal-form');
  if (samForm && !samForm.dataset.listenerAttached) {
    samForm.dataset.listenerAttached = 'true';
    
    // Live percentage calculation listener for modal
    const samPct = document.getElementById('sam-percentage');
    if (samPct) samPct.addEventListener('input', updateModalAttendanceLive);

    samForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('sam-code').value;
      const name = document.getElementById('sam-name').value;
      const sem = document.getElementById('sam-sem').value;
      const pct = parseFloat(document.getElementById('sam-percentage').value);
      const remarks = document.getElementById('sam-remarks').value.trim();

      if (isNaN(pct) || pct < 0 || pct > 100) {
        alert('Please enter a valid attendance percentage between 0.0 and 100.0');
        return;
      }

      const submitBtn = document.getElementById('sam-save-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Attendance...';
      }

      const res = await API.post(`/mentor/students/${studentId}/subject-attendance`, {
        semester: sem,
        subject_code: code,
        subject_name: name,
        attendance_percentage: pct,
        remarks: remarks
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Subject Attendance %';
      }

      if (res.success) {
        closeSubjectAttendanceModal();
        alert(`Subject attendance for ${name} (${code}) successfully saved: ${pct}%!`);
        await loadMentorStudentPage();
      } else {
        alert(res.message || 'Error updating subject attendance.');
      }
    });
  }

  // 3. Ensure total-attendance-form listener is attached (Total Attendance Percentage)
  const totalAttForm = document.getElementById('total-attendance-form');
  if (totalAttForm && !totalAttForm.dataset.listenerAttached) {
    totalAttForm.dataset.listenerAttached = 'true';
    totalAttForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pctInput = document.getElementById('total-att-input');
      const pct = parseFloat(pctInput ? pctInput.value : '');
      if (isNaN(pct) || pct < 0 || pct > 100) {
        alert('Please enter a valid total attendance percentage between 0.0 and 100.0');
        return;
      }
      const saveBtn = document.getElementById('total-att-save-btn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Updating...';
      }
      const res = await API.post(`/mentor/students/${studentId}/total-attendance`, {
        semester: currentSelectedSemester || activeSem,
        attendance_percentage: pct
      });
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Update Total Attendance';
      }
      if (res.success) {
        alert(`Total attendance for Semester ${currentSelectedSemester || activeSem} successfully updated to ${pct}%!`);
        await loadMentorStudentPage();
      } else {
        alert(res.message || 'Error updating total attendance.');
      }
    });
  }

  // 6. Ensure verify-activity-form listener is attached
  const vForm = document.getElementById('verify-activity-form');
  if (vForm && !vForm.dataset.listenerAttached) {
    vForm.dataset.listenerAttached = 'true';
    vForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('va-id').value;
      const status = document.getElementById('va-status').value;
      const mentor_remarks = document.getElementById('va-remarks').value.trim();

      const res = await API.put(`/mentor/activities/${id}/status`, { status, mentor_remarks });
      if (res.success) {
        closeVerifyActivityModal();
        await loadMentorStudentPage();
      } else {
        alert(res.message || 'Error updating status');
      }
    });
  }
}

// GENERATE MENTOR STUDENT EVALUATION REPORT (PDF & PRINTABLE)
async function downloadMentorStudentReport(targetStudentId) {
  let sid = targetStudentId;
  if (!sid) {
    const urlParams = new URLSearchParams(window.location.search);
    sid = urlParams.get('id');
  }
  if (!sid) {
    alert('Please specify a student to generate their report.');
    return;
  }

  try {
    const res = await API.get(`/mentor/students/${sid}/report`);
    if (!res.success || !res.report) {
      alert(res.message || 'Error generating student report.');
      return;
    }

    const report = res.report;
    const safeName = (report.student.name || 'Mentee').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${report.student.rollNo || 'ST'}_${safeName}_Mentoring_Report.pdf`;

    const hasJsPdf = (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF !== 'undefined') || typeof window.jsPDF !== 'undefined';

    if (hasJsPdf) {
      try {
        const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        const doc = new jsPDFClass({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });

        // 1. Header Banner
        doc.setFillColor(30, 58, 138); // Deep Navy (#1e3a8a)
        doc.rect(0, 0, 595, 75, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12.5);
        doc.setTextColor(255, 255, 255);
        doc.text('ANNASAHEB DANGE COLLEGE OF ENGINEERING & TECHNOLOGY, ASHTA', 297, 26, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(219, 234, 254);
        doc.text('Department of Artificial Intelligence & Data Science (AI & DS)', 297, 42, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(253, 224, 71); // Amber
        doc.text('OFFICIAL MENTEE ACADEMIC & PROGRESS EVALUATION REPORT', 297, 58, { align: 'center' });

        // 2. Info Box (Student & Mentor details)
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(30, 85, 535, 76, 4, 4, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);

        // Mentee Info
        doc.text('MENTEE NAME:', 42, 102);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(String(report.student.name || '--'), 125, 102);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('URN / ROLL NO:', 42, 118);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(`${report.student.urn} / ${report.student.rollNo}`, 125, 118);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('CLASS & BATCH:', 42, 134);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(`Year ${report.student.year || 3} — Div ${report.student.division || 'A'} (${report.student.batchName})`, 125, 134);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('EMAIL / PHONE:', 42, 150);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(`${report.student.email} | ${report.student.phone || '--'}`, 125, 150);

        // Mentor Info
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('FACULTY MENTOR:', 310, 102);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(String(report.mentor.name || '--'), 405, 102);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('MENTOR ID / DESIG:', 310, 118);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(`${report.mentor.mentorCode} (${report.mentor.designation || 'Faculty'})`, 405, 118);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('ML PERFORMANCE:', 310, 134);
        doc.setFont('helvetica', 'bold');
        const isBright = report.mlAnalysis?.risk_level === 'Bright';
        const isWeak = report.mlAnalysis?.risk_level === 'Weak';
        doc.setTextColor(isBright ? 16 : (isWeak ? 220 : 37), isBright ? 185 : (isWeak ? 38 : 99), isBright ? 129 : (isWeak ? 38 : 235));
        doc.text(`${report.mlAnalysis?.risk_level || 'Average'} (${Math.round((report.mlAnalysis?.confidence || 0.88) * 100)}% Conf)`, 405, 134);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('SUPPORT PRIORITY:', 310, 150);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(`${report.mlAnalysis?.support_priority || 'Standard'} Priority (${report.overallProgress})`, 405, 150);

        let startY = 175;

        // Table 1: Semester-Wise Academic Progression
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 58, 138);
        doc.text('1. SEMESTER-WISE ACADEMIC PERFORMANCE & ATTENDANCE', 30, startY);
        startY += 8;

        const acadHeaders = [['Semester', 'CGPA', 'Attendance %', 'ISE Marks', 'MSE Marks', 'ESE Marks', 'Backlogs', 'Standing']];
        const acadRows = (report.academicRecords || []).map(ar => [
          `Semester ${ar.semester}`,
          ar.cgpa ? Number(ar.cgpa).toFixed(2) : '--',
          `${ar.attendance_percentage}%`,
          ar.ise_marks || '--',
          ar.mse_marks || '--',
          ar.ese_marks || '--',
          ar.subjects_failed_count > 0 ? `${ar.subjects_failed_count} Backlog(s)` : '0 (Clear)',
          (ar.defaulter_flag || ar.attendance_percentage < 75) ? 'Defaulter' : 'Clear'
        ]);

        if (doc.autoTable) {
          doc.autoTable({
            startY,
            head: acadHeaders,
            body: acadRows.length > 0 ? acadRows : [['None', '--', '--', '--', '--', '--', '0', 'Pending Evaluation']],
            theme: 'grid',
            headStyles: {
              fillColor: [30, 58, 138],
              textColor: [255, 255, 255],
              fontSize: 7.5,
              fontStyle: 'bold',
              halign: 'center'
            },
            styles: {
              fontSize: 7.5,
              cellPadding: 3.5,
              valign: 'middle'
            },
            columnStyles: {
              0: { halign: 'left', fontStyle: 'bold' },
              1: { halign: 'center', textColor: [30, 58, 138], fontStyle: 'bold' },
              2: { halign: 'center' },
              3: { halign: 'center' },
              4: { halign: 'center' },
              5: { halign: 'center' },
              6: { halign: 'center' },
              7: { halign: 'center', fontStyle: 'bold' }
            },
            margin: { left: 30, right: 30 }
          });

          startY = doc.lastAutoTable.finalY + 16;
        }

        // Table 2: Co-Curricular & Certified Activities
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 58, 138);
        doc.text('2. CERTIFIED CO-CURRICULAR & EXTRA-CURRICULAR ACHIEVEMENTS', 30, startY);
        startY += 8;

        const actHeaders = [['Sr', 'Activity Title', 'Category', 'Date Achieved', 'Evidence', 'Verification Status']];
        const actRows = (report.activities || []).map((a, idx) => [
          idx + 1,
          a.title,
          a.category,
          a.date_achieved ? new Date(a.date_achieved).toLocaleDateString() : '--',
          a.evidence_url || 'certificate.pdf',
          a.status || 'Approved'
        ]);

        if (doc.autoTable) {
          doc.autoTable({
            startY,
            head: actHeaders,
            body: actRows.length > 0 ? actRows.slice(0, 5) : [['1', 'No certified activities recorded yet', 'N/A', '--', '--', 'Pending']],
            theme: 'grid',
            headStyles: {
              fillColor: [51, 65, 85],
              textColor: [255, 255, 255],
              fontSize: 7.5,
              fontStyle: 'bold'
            },
            styles: {
              fontSize: 7.5,
              cellPadding: 3.5
            },
            margin: { left: 30, right: 30 }
          });

          startY = doc.lastAutoTable.finalY + 16;
        }

        // Table 3: Batch Mentoring Meetings
        if (startY < 670) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(30, 58, 138);
          doc.text('3. MENTORING MEETINGS & ADVISING SUMMARY', 30, startY);
          startY += 8;

          const meetHeaders = [['Meeting #', 'Date', 'Mode', 'Agenda', 'Status']];
          const meetRows = (report.meetings || []).slice(0, 3).map(m => [
            `Meeting #${m.meeting_number || 1}`,
            m.meeting_date ? new Date(m.meeting_date).toLocaleDateString() : '--',
            m.mode || 'Offline',
            m.agenda || 'Regular Progress Review',
            m.status || 'Completed'
          ]);

          if (doc.autoTable) {
            doc.autoTable({
              startY,
              head: meetHeaders,
              body: meetRows.length > 0 ? meetRows : [['Meeting #1', '2024-2025', 'Offline', 'Regular Mentoring', 'Completed']],
              theme: 'grid',
              headStyles: {
                fillColor: [71, 85, 105],
                textColor: [255, 255, 255],
                fontSize: 7.5,
                fontStyle: 'bold'
              },
              styles: {
                fontSize: 7.5,
                cellPadding: 3.5
              },
              margin: { left: 30, right: 30 }
            });
            startY = doc.lastAutoTable.finalY + 25;
          }
        }

        // Signatures Block
        const sigY = Math.max(startY, 745);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('__________________________________', 50, sigY);
        doc.text(`Faculty Mentor (${report.mentor.name})`, 50, sigY + 14);

        doc.text('__________________________________', 380, sigY);
        doc.text('Head of Department (AI & DS)', 380, sigY + 14);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Official Mentoring Report generated on: ${new Date().toLocaleString('en-IN')} | ADCET Ashta`, 297, 820, { align: 'center' });

        doc.save(fileName);
        return;
      } catch (pdfErr) {
        console.error('jsPDF generation failed, falling back to printable window:', pdfErr);
      }
    }

    // Fallback: Printable Window
    openPrintableStudentReport(report);
  } catch (err) {
    console.error('Error generating mentor student report:', err);
    alert('Server error generating student report.');
  }
}

// Printable HTML Report Fallback
function openPrintableStudentReport(report) {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('Popup blocker prevented opening the report. Please allow popups.');
    return;
  }

  const s = report.student;
  const m = report.mentor;
  const ml = report.mlAnalysis;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mentoring Report — ${s.name} (${s.urn})</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 30px; font-size: 12px; }
        .header { background: #1e3a8a; color: white; padding: 18px; text-align: center; border-radius: 6px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 16px; letter-spacing: 0.5px; }
        .header h2 { margin: 4px 0 0; font-size: 13px; font-weight: normal; color: #bfdbfe; }
        .header p { margin: 4px 0 0; font-size: 11px; color: #fde047; font-weight: bold; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 18px; margin-bottom: 20px; }
        .info-col p { margin: 4px 0; font-size: 11px; }
        .info-col strong { color: #475569; display: inline-block; width: 130px; }
        h3 { color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin: 20px 0 10px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
        th { background: #1e3a8a; color: white; text-align: left; padding: 7px 10px; font-size: 10px; text-transform: uppercase; }
        td { border-bottom: 1px solid #e2e8f0; padding: 7px 10px; }
        .sig-block { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 40px; }
        .sig { text-align: center; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div style="text-align: right; margin-bottom: 10px;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #1e3a8a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Print / Save as PDF</button>
      </div>
      <div class="header">
        <h1>ANNASAHEB DANGE COLLEGE OF ENGINEERING & TECHNOLOGY, ASHTA</h1>
        <h2>Department of Artificial Intelligence & Data Science (AI & DS)</h2>
        <p>OFFICIAL MENTEE ACADEMIC & PROGRESS EVALUATION REPORT</p>
      </div>

      <div class="info-grid">
        <div class="info-col">
          <p><strong>Mentee Name:</strong> ${s.name}</p>
          <p><strong>URN / Roll No:</strong> ${s.urn} / ${s.rollNo}</p>
          <p><strong>Class & Division:</strong> Year ${s.year} — Div ${s.division} (${s.batchName})</p>
          <p><strong>Email Address:</strong> ${s.email}</p>
        </div>
        <div class="info-col">
          <p><strong>Faculty Mentor:</strong> ${m.name}</p>
          <p><strong>Mentor Code / Desig:</strong> ${m.mentorCode} (${m.designation})</p>
          <p><strong>ML Performance:</strong> <span style="font-weight:bold; color:#1e3a8a;">${ml?.risk_level || 'Average'}</span> (${Math.round((ml?.confidence || 0.88)*100)}% Conf)</p>
          <p><strong>Support Priority:</strong> ${ml?.support_priority || 'Standard'} Priority</p>
        </div>
      </div>

      <h3>1. Semester-Wise Academic Progression</h3>
      <table>
        <thead>
          <tr>
            <th>Semester</th>
            <th>CGPA</th>
            <th>Attendance %</th>
            <th>ISE Marks</th>
            <th>MSE Marks</th>
            <th>ESE Marks</th>
            <th>Backlogs</th>
            <th>Standing</th>
          </tr>
        </thead>
        <tbody>
          ${(report.academicRecords || []).map(ar => `
            <tr>
              <td>Semester ${ar.semester}</td>
              <td style="font-weight:bold; color:#1e3a8a;">${ar.cgpa ? Number(ar.cgpa).toFixed(2) : '--'}</td>
              <td>${ar.attendance_percentage}%</td>
              <td>${ar.ise_marks || '--'}</td>
              <td>${ar.mse_marks || '--'}</td>
              <td>${ar.ese_marks || '--'}</td>
              <td>${ar.subjects_failed_count > 0 ? ar.subjects_failed_count : '0 (Clear)'}</td>
              <td>${(ar.defaulter_flag || ar.attendance_percentage < 75) ? 'Defaulter' : 'Clear'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3>2. Certified Activities & Achievements</h3>
      <table>
        <thead>
          <tr>
            <th>Sr</th>
            <th>Activity Title</th>
            <th>Category</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(report.activities || []).map((a, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${a.title}</strong></td>
              <td>${a.category}</td>
              <td>${a.date_achieved ? new Date(a.date_achieved).toLocaleDateString() : '--'}</td>
              <td>${a.status || 'Approved'}</td>
            </tr>
          `).join('') || '<tr><td colspan="5">No certified activities recorded.</td></tr>'}
        </tbody>
      </table>

      <div class="sig-block">
        <div class="sig">
          <p>_____________________________________</p>
          <p><strong>Faculty Mentor (${m.name})</strong></p>
        </div>
        <div class="sig">
          <p>_____________________________________</p>
          <p><strong>Head of Department (AI & DS)</strong></p>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

