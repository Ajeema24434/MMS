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
        <button onclick="viewStudentDetail(${s.id})" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded border border-indigo-200 transition">
          View Profile
        </button>
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
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
            <span class="font-bold text-slate-900 text-sm">Meeting #${m.meeting_number || 1}: ${m.agenda}</span>
            <span class="text-slate-500 font-mono">${new Date(m.meeting_date).toLocaleDateString()}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <p><strong>Mode:</strong> ${m.mode || 'Offline'}</p>
            <p><strong>Status:</strong> ${m.status || 'Scheduled'}</p>
          </div>
          <p class="text-xs text-slate-600"><strong>Discussion / Remarks:</strong> ${m.discussion || m.remarks || 'Meeting completed with full batch.'}</p>
        </div>
      `).join('');
    }
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
