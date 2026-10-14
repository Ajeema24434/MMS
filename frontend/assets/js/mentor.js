// Faculty Mentor Portal Controller & Excel Reports Integration
let allBatchStudents = [];
let allBatchMeetings = [];
let currentAttendanceMeetingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = API.getUser();
  if (!user || user.role !== 'MENTOR') return;

  // Set user display in header
  const headerName = document.getElementById('header-user-name');
  if (headerName) headerName.textContent = user.name || 'Faculty Mentor';

  const path = window.location.pathname;

  if (path.includes('/mentor/dashboard.html')) {
    bindMentorTabs();
    bindMentorStudentSearch();
    setupMeetingForm();
    setupEditMeetingForm();
    setupComplaintForm();
    await loadMentorDashboard();
  } else if (path.includes('/mentor/student.html')) {
    await loadMentorStudentPage();
  }
});

function bindMentorTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

function switchTab(targetTab) {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(b => {
    if (b.getAttribute('data-tab') === targetTab) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  const activeContent = document.getElementById(`tab-${targetTab}`);
  if (activeContent) activeContent.classList.remove('hidden');
}

async function loadMentorDashboard() {
  const res = await API.get('/mentor/dashboard');
  if (!res.success) {
    showAlert(res.message || 'Error loading mentor dashboard', 'error');
    return;
  }

  const { mentor, assignedBatch, totalStudents, pendingComplaints, students, recentMeetings, mlRiskSummary } = res;
  allBatchStudents = students || [];
  allBatchMeetings = recentMeetings || [];

  if (mentor) {
    const nameEl = document.getElementById('m-name');
    if (nameEl) nameEl.textContent = mentor.name;
    const codeEl = document.getElementById('m-code');
    if (codeEl) codeEl.textContent = mentor.mentor_code;
    const deptEl = document.getElementById('m-dept-desig');
    if (deptEl) deptEl.textContent = `${mentor.designation || 'Faculty Advisor'} (${mentor.department || 'Department'})`;
  }

  const batchEl = document.getElementById('m-batch-name');
  if (batchEl) batchEl.textContent = assignedBatch ? assignedBatch.name : 'No Assigned Batch';

  const countStudentsEl = document.getElementById('m-stat-students');
  if (countStudentsEl) countStudentsEl.textContent = totalStudents || 0;

  const countComplaintsEl = document.getElementById('m-stat-complaints');
  if (countComplaintsEl) countComplaintsEl.textContent = pendingComplaints || 0;

  // ML Risk Summary Cards
  if (mlRiskSummary) {
    const brightEl = document.getElementById('ml-count-bright');
    if (brightEl) brightEl.textContent = mlRiskSummary.Bright || 0;
    const avgEl = document.getElementById('ml-count-average');
    if (avgEl) avgEl.textContent = mlRiskSummary.Average || 0;
    const weakEl = document.getElementById('ml-count-weak');
    if (weakEl) weakEl.textContent = mlRiskSummary.Weak || 0;
  }

  // Render Students Roster Table
  renderMentorStudentsTable(allBatchStudents);

  // Populate Attendance meeting selector
  populateAttendanceMeetingDropdown(allBatchMeetings);

  // Meetings History List
  renderMeetingsList(allBatchMeetings);

  // Complaints Table
  await loadMentorComplaints();
}

function renderMentorStudentsTable(students) {
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;

  if (!students || students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 text-sm">No mentees found in your assigned batch.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="px-6 py-4 text-slate-800 text-sm font-mono font-semibold">${s.roll_no}</td>
      <td class="px-6 py-4 font-semibold text-slate-900 text-sm">${s.name}</td>
      <td class="px-6 py-4 text-slate-600 text-sm font-mono">${s.urn}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">Div ${s.division}</td>
      <td class="px-6 py-4 text-sm">${getRiskBadgeHTML(s.ml_risk_level)}</td>
      <td class="px-6 py-4 text-sm">
        <button onclick="viewStudentDetail(${s.id})" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition">
          View Profile →
        </button>
      </td>
    </tr>
  `).join('');
}

function bindMentorStudentSearch() {
  const input = document.getElementById('mentor-student-search');
  if (input) {
    input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = allBatchStudents.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.urn && s.urn.toLowerCase().includes(q)) ||
        (s.roll_no && s.roll_no.toLowerCase().includes(q))
      );
      renderMentorStudentsTable(filtered);
    });
  }
}

// ATTENDANCE TAB FUNCTIONALITY
function populateAttendanceMeetingDropdown(meetings) {
  const select = document.getElementById('att-meeting-select');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Choose a Meeting --</option>';

  if (meetings && meetings.length > 0) {
    meetings.forEach(m => {
      const dateStr = m.meeting_date ? new Date(m.meeting_date).toLocaleDateString('en-GB') : '';
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `Meeting #${m.meeting_number || 1} — ${dateStr} (${m.agenda})`;
      select.appendChild(opt);
    });

    if (currentVal) {
      select.value = currentVal;
    }
  }
}

async function onMeetingSelectChange() {
  const select = document.getElementById('att-meeting-select');
  const meetingId = select.value;
  if (!meetingId) {
    document.getElementById('att-placeholder').classList.remove('hidden');
    document.getElementById('att-meeting-info').classList.add('hidden');
    document.getElementById('att-action-bar').classList.add('hidden');
    document.getElementById('att-table-container').classList.add('hidden');
    currentAttendanceMeetingId = null;
    return;
  }

  await loadMeetingAttendance(meetingId);
}

async function loadMeetingAttendance(meetingId) {
  currentAttendanceMeetingId = meetingId;
  const select = document.getElementById('att-meeting-select');
  if (select && select.value !== String(meetingId)) {
    select.value = String(meetingId);
  }

  const res = await API.get(`/mentor/meetings/${meetingId}/attendance`);
  if (!res.success) {
    showAlert(res.message || 'Error loading meeting attendance', 'error');
    return;
  }

  const { meeting, students } = res;

  // Show meeting info
  document.getElementById('att-placeholder').classList.add('hidden');
  document.getElementById('att-meeting-info').classList.remove('hidden');
  document.getElementById('att-action-bar').classList.remove('hidden');
  document.getElementById('att-table-container').classList.remove('hidden');

  document.getElementById('att-info-title').textContent = `Meeting #${meeting.meeting_number || 1} (${meeting.mode || 'Offline'})`;
  document.getElementById('att-info-date').textContent = meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleString('en-GB') : 'N/A';
  document.getElementById('att-info-agenda').textContent = meeting.agenda || 'N/A';
  document.getElementById('att-info-status').innerHTML = meeting.status === 'Completed'
    ? '<span class="text-emerald-700 font-bold">✓ Completed</span>'
    : '<span class="text-amber-700 font-bold">Scheduled</span>';

  // Render student attendance rows
  const tbody = document.getElementById('attendance-tbody');
  tbody.innerHTML = students.map(s => {
    // Default to 'Present' if not recorded yet
    const isPresent = s.attendance_status ? s.attendance_status === 'Present' : true;
    const isAbsent = s.attendance_status === 'Absent';
    const remarks = s.attendance_remarks || '';

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100" data-student-id="${s.student_id}">
        <td class="px-6 py-4 font-mono font-bold text-slate-800 text-xs">${s.roll_no}</td>
        <td class="px-6 py-4 font-semibold text-slate-900 text-xs">${s.name}</td>
        <td class="px-6 py-4 text-slate-600 text-xs font-mono">${s.urn}</td>
        <td class="px-6 py-4 text-center">
          <div class="inline-flex items-center space-x-3 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
            <label class="flex items-center space-x-1.5 cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-md transition ${isPresent ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
              <input type="radio" name="att_${s.student_id}" value="Present" ${isPresent ? 'checked' : ''} onchange="onRadioStatusChange(this)" class="hidden">
              <span>Present</span>
            </label>
            <label class="flex items-center space-x-1.5 cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-md transition ${isAbsent ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
              <input type="radio" name="att_${s.student_id}" value="Absent" ${isAbsent ? 'checked' : ''} onchange="onRadioStatusChange(this)" class="hidden">
              <span>Absent</span>
            </label>
          </div>
        </td>
        <td class="px-6 py-4">
          <input type="text" class="att-remarks-input w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Leave, makeup exam..." value="${escapeHtml(remarks)}">
        </td>
      </tr>
    `;
  }).join('');

  updateAttendanceCounters();
}

function onRadioStatusChange(radio) {
  const container = radio.closest('td');
  const labels = container.querySelectorAll('label');
  labels.forEach(lbl => {
    const input = lbl.querySelector('input');
    if (input.checked) {
      if (input.value === 'Present') {
        lbl.className = 'flex items-center space-x-1.5 cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-md transition bg-emerald-600 text-white shadow-sm';
      } else {
        lbl.className = 'flex items-center space-x-1.5 cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-md transition bg-rose-600 text-white shadow-sm';
      }
    } else {
      lbl.className = 'flex items-center space-x-1.5 cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-md transition text-slate-600 hover:text-slate-900';
    }
  });

  updateAttendanceCounters();
}

function markAllAttendance(status) {
  const tbody = document.getElementById('attendance-tbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  rows.forEach(r => {
    const radio = r.querySelector(`input[value="${status}"]`);
    if (radio) {
      radio.checked = true;
      onRadioStatusChange(radio);
    }
  });

  updateAttendanceCounters();
}

function updateAttendanceCounters() {
  const tbody = document.getElementById('attendance-tbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  let present = 0;
  let absent = 0;

  rows.forEach(r => {
    const checked = r.querySelector('input[type="radio"]:checked');
    if (checked) {
      if (checked.value === 'Present') present++;
      else if (checked.value === 'Absent') absent++;
    }
  });

  const totalEl = document.getElementById('att-stat-total');
  if (totalEl) totalEl.textContent = rows.length;
  const presentEl = document.getElementById('att-stat-present');
  if (presentEl) presentEl.textContent = present;
  const absentEl = document.getElementById('att-stat-absent');
  if (absentEl) absentEl.textContent = absent;
}

async function saveAttendance() {
  if (!currentAttendanceMeetingId) {
    showAlert('Please select a meeting first.', 'error');
    return;
  }

  const tbody = document.getElementById('attendance-tbody');
  const rows = tbody.querySelectorAll('tr');
  const records = [];

  rows.forEach(r => {
    const studentId = r.getAttribute('data-student-id');
    const checkedRadio = r.querySelector('input[type="radio"]:checked');
    const status = checkedRadio ? checkedRadio.value : 'Present';
    const remarksInput = r.querySelector('.att-remarks-input');
    const remarks = remarksInput ? remarksInput.value.trim() : '';

    records.push({
      student_id: parseInt(studentId, 10),
      status,
      remarks
    });
  });

  const btn = document.getElementById('save-attendance-btn');
  btn.disabled = true;
  btn.innerHTML = `<span>Saving Attendance...</span>`;

  try {
    const res = await API.post(`/mentor/meetings/${currentAttendanceMeetingId}/attendance`, { records });
    if (res.success) {
      showAlert(`✓ Attendance saved successfully! (${res.presentCount} Present, ${res.absentCount} Absent)`, 'success');
      // Refresh meetings list to show updated attendance pill
      await loadMentorDashboard();
      // Reload current meeting attendance
      await loadMeetingAttendance(currentAttendanceMeetingId);
    } else {
      showAlert(res.message || 'Error saving attendance', 'error');
    }
  } catch (err) {
    showAlert('Network error while saving attendance', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Save Attendance</span>`;
  }
}

function openAttendanceForMeeting(meetingId) {
  switchTab('attendance');
  const select = document.getElementById('att-meeting-select');
  if (select) {
    select.value = String(meetingId);
    onMeetingSelectChange();
  }
}

// MEETINGS MANAGEMENT
function renderMeetingsList(meetings) {
  const container = document.getElementById('meetings-list');
  if (!container) return;

  if (!meetings || meetings.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p class="text-sm">No meeting agendas recorded for this batch yet.</p>
        <p class="text-xs text-slate-400 mt-1">Click "+ Schedule Meeting" above to create your first mentoring meeting.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = meetings.map(m => {
    const dateStr = m.meeting_date ? new Date(m.meeting_date).toLocaleDateString('en-GB') : 'N/A';
    const isCompleted = m.status === 'Completed';

    let attBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">Attendance: Not Marked</span>';
    if (m.attendance_marked_count && m.attendance_marked_count > 0) {
      attBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Attendance: ${m.present_count} Present, ${m.absent_count} Absent</span>`;
    }

    return `
      <div class="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2.5 gap-2">
          <div class="flex items-center space-x-2">
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-mono font-bold rounded">#${m.meeting_number || 1}</span>
            <h4 class="font-bold text-slate-900 text-sm">${m.agenda}</h4>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
              ${m.status || 'Scheduled'}
            </span>
          </div>
          <div class="flex items-center space-x-3 text-xs text-slate-500 font-mono">
            <span>📅 ${dateStr}</span>
            <span>📍 ${m.mode || 'Offline'}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div>
            <strong class="text-slate-800">Points Discussed:</strong>
            <p class="mt-0.5 text-slate-700">${m.discussion || '<span class="text-slate-400 italic">No notes added</span>'}</p>
          </div>
          <div>
            <strong class="text-slate-800">Key Findings:</strong>
            <p class="mt-0.5 text-slate-700">${m.findings || '<span class="text-slate-400 italic">No findings added</span>'}</p>
          </div>
          <div>
            <strong class="text-slate-800">Assignment / Activity:</strong>
            <p class="mt-0.5 text-slate-700">${m.assignment || '<span class="text-slate-400 italic">None assigned</span>'}</p>
          </div>
          <div>
            <strong class="text-slate-800">Mentor Remarks:</strong>
            <p class="mt-0.5 text-slate-700">${m.remarks || '<span class="text-slate-400 italic">None</span>'}</p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-1 gap-2">
          <div>
            ${attBadge}
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="openAttendanceForMeeting(${m.id})" class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition">
              Mark / View Attendance →
            </button>
            <button onclick="openEditMeetingModal(${m.id})" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition">
              Edit Meeting
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openMeetingModal() {
  document.getElementById('meeting-form').reset();
  document.getElementById('meeting-modal').classList.remove('hidden');
}

function closeMeetingModal() {
  document.getElementById('meeting-modal').classList.add('hidden');
}

function setupMeetingForm() {
  const form = document.getElementById('meeting-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      meeting_date: document.getElementById('m-date').value,
      mode: document.getElementById('m-mode').value,
      agenda: document.getElementById('m-agenda').value.trim(),
      discussion: document.getElementById('m-discussion').value.trim(),
      findings: document.getElementById('m-findings').value.trim(),
      assignment: document.getElementById('m-assignment').value.trim(),
      remarks: document.getElementById('m-remarks').value.trim(),
      status: document.getElementById('m-status').value
    };

    const res = await API.post('/mentor/meetings', body);
    if (res.success) {
      closeMeetingModal();
      showAlert('✓ Meeting created successfully!', 'success');
      await loadMentorDashboard();
    } else {
      showAlert(res.message || 'Error creating meeting', 'error');
    }
  });
}

function openEditMeetingModal(meetingId) {
  const m = allBatchMeetings.find(item => item.id == meetingId);
  if (!m) return;

  document.getElementById('em-id').value = m.id;
  document.getElementById('em-agenda').value = m.agenda || '';
  document.getElementById('em-mode').value = m.mode || 'Offline / Seminar Hall';
  document.getElementById('em-discussion').value = m.discussion || '';
  document.getElementById('em-findings').value = m.findings || '';
  document.getElementById('em-assignment').value = m.assignment || '';
  document.getElementById('em-remarks').value = m.remarks || '';
  document.getElementById('em-status').value = m.status || 'Scheduled';

  if (m.meeting_date) {
    const d = new Date(m.meeting_date);
    if (!isNaN(d.getTime())) {
      const pad = num => String(num).padStart(2, '0');
      const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      document.getElementById('em-date').value = localIso;
    }
  }

  document.getElementById('edit-meeting-modal').classList.remove('hidden');
}

function closeEditMeetingModal() {
  document.getElementById('edit-meeting-modal').classList.add('hidden');
}

function setupEditMeetingForm() {
  const form = document.getElementById('edit-meeting-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('em-id').value;
    const body = {
      meeting_date: document.getElementById('em-date').value,
      mode: document.getElementById('em-mode').value,
      agenda: document.getElementById('em-agenda').value.trim(),
      discussion: document.getElementById('em-discussion').value.trim(),
      findings: document.getElementById('em-findings').value.trim(),
      assignment: document.getElementById('em-assignment').value.trim(),
      remarks: document.getElementById('em-remarks').value.trim(),
      status: document.getElementById('em-status').value
    };

    const res = await API.put(`/mentor/meetings/${id}`, body);
    if (res.success) {
      closeEditMeetingModal();
      showAlert('✓ Meeting details updated successfully!', 'success');
      await loadMentorDashboard();
    } else {
      showAlert(res.message || 'Error updating meeting', 'error');
    }
  });
}

// COMPLAINTS MANAGEMENT
async function loadMentorComplaints() {
  const complaintsRes = await API.get('/mentor/complaints');
  const tbody = document.getElementById('complaints-tbody');
  if (!tbody) return;

  if (!complaintsRes.success || !complaintsRes.complaints || complaintsRes.complaints.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 text-sm">No complaints submitted by mentees in your batch.</td></tr>`;
    return;
  }

  tbody.innerHTML = complaintsRes.complaints.map(c => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="px-6 py-4 font-semibold text-slate-900 text-sm">${c.student_name} <span class="text-xs text-slate-500 font-mono">(${c.roll_no})</span></td>
      <td class="px-6 py-4 text-slate-800 text-sm font-medium">
        ${escapeHtml(c.title)}
        <p class="text-slate-500 font-normal text-xs mt-0.5">${escapeHtml(c.description)}</p>
      </td>
      <td class="px-6 py-4 text-slate-600 text-xs">${c.category}</td>
      <td class="px-6 py-4 text-sm">${getComplaintStatusBadge(c.status)}</td>
      <td class="px-6 py-4 text-slate-600 text-xs">${c.mentor_response ? escapeHtml(c.mentor_response) : '<span class="text-slate-400 italic">No response yet</span>'}</td>
      <td class="px-6 py-4 text-sm">
        <button onclick="openComplaintResponseModal(${c.id}, '${escapeJs(c.student_name)}', '${escapeJs(c.title)}', '${c.status}', '${escapeJs(c.mentor_response || '')}')" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300">
          Update Resolution
        </button>
      </td>
    </tr>
  `).join('');
}

function openComplaintResponseModal(id, studentName, title, status, response) {
  document.getElementById('cr-id').value = id;
  document.getElementById('cr-title').textContent = `${studentName}: ${title}`;
  document.getElementById('cr-status').value = status || 'In Progress';
  document.getElementById('cr-response').value = response || '';
  document.getElementById('complaint-modal').classList.remove('hidden');
}

function closeComplaintResponseModal() {
  document.getElementById('complaint-modal').classList.add('hidden');
}

function setupComplaintForm() {
  const form = document.getElementById('complaint-response-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cr-id').value;
    const body = {
      status: document.getElementById('cr-status').value,
      mentor_response: document.getElementById('cr-response').value.trim()
    };
    const res = await API.put(`/mentor/complaints/${id}/status`, body);
    if (res.success) {
      closeComplaintResponseModal();
      showAlert('✓ Complaint resolution updated successfully!', 'success');
      await loadMentorDashboard();
    } else {
      showAlert(res.message || 'Error updating complaint', 'error');
    }
  });
}

// EXCEL REPORTS DOWNLOAD FUNCTIONALITY
async function downloadReport(reportNumber) {
  const token = localStorage.getItem('mms_token');
  const btn = document.getElementById(`btn-report-${reportNumber}`);
  const statusEl = document.getElementById('report-status-msg');

  // Disable all download buttons during generation
  const allBtns = [1, 2, 3, 4].map(n => document.getElementById(`btn-report-${n}`)).filter(Boolean);
  allBtns.forEach(b => b.disabled = true);

  if (btn) btn.innerHTML = `<span>⏳ Generating Report ${reportNumber}...</span>`;

  if (statusEl) {
    statusEl.className = 'p-3 rounded-lg text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200 block';
    statusEl.textContent = `Querying live database records and generating Report ${reportNumber}... Please wait.`;
  }

  try {
    const response = await fetch(`/api/mentor/reports/report${reportNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    // Try extracting filename from header
    let filename = `Batch_Report_${reportNumber}_2026.xlsx`;
    const disposition = response.headers.get('content-disposition');
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    if (statusEl) {
      statusEl.className = 'p-3 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 block';
      statusEl.textContent = `✓ Report ${reportNumber} (${filename}) downloaded successfully!`;
      setTimeout(() => statusEl.classList.add('hidden'), 5000);
    }
  } catch (err) {
    if (statusEl) {
      statusEl.className = 'p-3 rounded-lg text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200 block';
      statusEl.textContent = `✕ Failed to generate Report ${reportNumber}: ${err.message}`;
    }
  } finally {
    allBtns.forEach((b, idx) => {
      b.disabled = false;
      b.innerHTML = `<span>Download Report ${idx + 1} (.xlsx)</span>`;
    });
  }
}

// STUDENT PROFILE PAGE CONTROLLER (student.html)
async function loadMentorStudentPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('id');

  if (!studentId) {
    window.location.href = '/mentor/dashboard.html';
    return;
  }

  const res = await API.get(`/mentor/students/${studentId}`);

  const errorBox = document.getElementById('error-box');
  const errorMsg = document.getElementById('error-box-msg');
  const profileContent = document.getElementById('profile-content');

  // Handle 403 Forbidden or not found (Strict Batch Isolation)
  if (!res.success) {
    if (errorBox) errorBox.classList.remove('hidden');
    if (errorMsg) errorMsg.textContent = res.message || 'Forbidden: You are not authorized to view students outside your assigned batch.';
    if (profileContent) profileContent.classList.add('hidden');
    return;
  }

  if (errorBox) errorBox.classList.add('hidden');
  if (profileContent) profileContent.classList.remove('hidden');

  const { student, academicRecords, activities, complaints, attendanceRecords, mlDemoResult } = res;

  // Basic Info
  document.getElementById('st-detail-name').textContent = student.name;
  document.getElementById('st-detail-dept-div').textContent = `${student.department} — Division ${student.division}`;
  document.getElementById('st-detail-roll').textContent = student.roll_no;
  document.getElementById('st-detail-urn').textContent = student.urn;
  document.getElementById('st-detail-batch').textContent = student.batch_name || 'Assigned Batch';
  document.getElementById('st-detail-division').textContent = `Division ${student.division}`;

  const phoneEl = document.getElementById('st-detail-phone');
  if (phoneEl) phoneEl.textContent = student.phone || 'N/A';
  const emailEl = document.getElementById('st-detail-email');
  if (emailEl) emailEl.textContent = student.email || 'N/A';

  // ML Performance Card
  if (mlDemoResult) {
    const badgeContainer = document.getElementById('ml-risk-badge');
    if (badgeContainer) badgeContainer.innerHTML = getRiskBadgeHTML(mlDemoResult.risk_level);

    const prioEl = document.getElementById('ml-priority');
    if (prioEl) prioEl.textContent = mlDemoResult.support_priority || 'Medium';

    const recEl = document.getElementById('ml-recommendation');
    if (recEl) recEl.textContent = mlDemoResult.recommendation || 'Encourage consistent progress.';
  }

  // Academic Records Table
  const academicTbody = document.getElementById('st-academic-tbody');
  if (academicTbody) {
    if (!academicRecords || academicRecords.length === 0) {
      academicTbody.innerHTML = `<tr><td colspan="8" class="px-6 py-6 text-center text-slate-400 text-xs">No semester academic records found.</td></tr>`;
    } else {
      academicTbody.innerHTML = academicRecords.map(ar => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="px-6 py-4 font-bold text-slate-900 text-xs">Semester ${ar.semester}</td>
          <td class="px-6 py-4 font-mono font-bold text-indigo-700 text-xs">${ar.cgpa ? Number(ar.cgpa).toFixed(2) : 'N/A'}</td>
          <td class="px-6 py-4 text-xs font-semibold ${ar.attendance_percentage < 75 ? 'text-rose-600' : 'text-emerald-700'}">${ar.attendance_percentage ? ar.attendance_percentage + '%' : 'N/A'}</td>
          <td class="px-6 py-4 text-xs font-mono">${ar.ise_marks !== null ? ar.ise_marks : 'N/A'}</td>
          <td class="px-6 py-4 text-xs font-mono">${ar.mse_marks !== null ? ar.mse_marks : 'N/A'}</td>
          <td class="px-6 py-4 text-xs font-mono">${ar.ese_marks !== null ? ar.ese_marks : 'N/A'}</td>
          <td class="px-6 py-4 text-xs font-mono ${ar.subjects_failed_count > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}">${ar.subjects_failed_count || 0}</td>
          <td class="px-6 py-4 text-xs">${ar.defaulter_flag ? '<span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">Defaulter Flagged</span>' : '<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">Clear</span>'}</td>
        </tr>
      `).join('');
    }
  }

  // Meeting Attendance History
  const attTbody = document.getElementById('st-attendance-tbody');
  const attPill = document.getElementById('st-att-summary-pill');

  if (attTbody) {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      attTbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-slate-400 text-xs">No meetings conducted for this batch yet.</td></tr>`;
      if (attPill) attPill.textContent = 'Attendance: No meetings';
    } else {
      let presentCount = 0;
      let markedCount = 0;

      attTbody.innerHTML = attendanceRecords.map(a => {
        const dateStr = a.meeting_date ? new Date(a.meeting_date).toLocaleDateString('en-GB') : 'N/A';
        let statusBadge = '<span class="px-2 py-0.5 rounded text-xs text-slate-400 italic">Not Marked</span>';

        if (a.attendance_status === 'Present') {
          presentCount++;
          markedCount++;
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Present</span>';
        } else if (a.attendance_status === 'Absent') {
          markedCount++;
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Absent</span>';
        }

        return `
          <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="px-6 py-4 font-mono font-bold text-slate-800 text-xs">Meeting #${a.meeting_number || 1}</td>
            <td class="px-6 py-4 text-slate-600 text-xs font-mono">${dateStr}</td>
            <td class="px-6 py-4 text-slate-600 text-xs">${a.mode || 'Offline'}</td>
            <td class="px-6 py-4 text-slate-800 text-xs font-medium">${escapeHtml(a.agenda)}</td>
            <td class="px-6 py-4 text-xs">${statusBadge}</td>
            <td class="px-6 py-4 text-slate-500 text-xs italic">${a.attendance_remarks ? escapeHtml(a.attendance_remarks) : '—'}</td>
          </tr>
        `;
      }).join('');

      if (attPill) {
        if (markedCount > 0) {
          const pct = Math.round((presentCount / markedCount) * 100);
          attPill.textContent = `Batch Meetings Attended: ${presentCount}/${markedCount} (${pct}%)`;
          attPill.className = pct >= 75
            ? 'text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200';
        } else {
          attPill.textContent = 'Attendance: Pending';
        }
      }
    }
  }

  // Activities List
  const actList = document.getElementById('st-activities-list');
  if (actList) {
    if (!activities || activities.length === 0) {
      actList.innerHTML = `<p class="text-xs text-slate-400 italic">No co-curricular activities or certifications recorded yet.</p>`;
    } else {
      actList.innerHTML = activities.map(act => `
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded uppercase">${act.category}</span>
              <h5 class="text-xs font-bold text-slate-900">${escapeHtml(act.title)}</h5>
            </div>
            <p class="text-xs text-slate-600">${escapeHtml(act.description || '')}</p>
            <p class="text-[10px] text-slate-400 font-mono">Achieved: ${act.date_achieved ? new Date(act.date_achieved).toLocaleDateString('en-GB') : 'N/A'}</p>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${act.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${act.status}
          </span>
        </div>
      `).join('');
    }
  }

  // Complaints List
  const compList = document.getElementById('st-complaints-list');
  if (compList) {
    if (!complaints || complaints.length === 0) {
      compList.innerHTML = `<p class="text-xs text-slate-400 italic">No grievances or requests submitted by this student.</p>`;
    } else {
      compList.innerHTML = complaints.map(c => `
        <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div class="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <span class="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded uppercase">${c.category}</span>
              <strong class="text-xs text-slate-900 ml-2">${escapeHtml(c.title)}</strong>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-[10px] text-slate-400 font-mono">${c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : ''}</span>
              ${getComplaintStatusBadge(c.status)}
            </div>
          </div>
          <p class="text-xs text-slate-700">${escapeHtml(c.description)}</p>
          <div class="pt-1 border-t border-slate-200 text-xs">
            <strong class="text-slate-800">Mentor Response:</strong>
            <p class="text-slate-600 mt-0.5 italic">${c.mentor_response ? escapeHtml(c.mentor_response) : '<span class="text-slate-400">No response recorded yet</span>'}</p>
          </div>
        </div>
      `).join('');
    }
  }
}

function viewStudentDetail(studentId) {
  window.location.href = `/mentor/student.html?id=${studentId}`;
}

// UI HELPERS
function showAlert(message, type = 'info') {
  const alertEl = document.getElementById('global-alert');
  if (!alertEl) return;

  alertEl.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-700', 'border-emerald-200', 'bg-rose-50', 'text-rose-700', 'border-rose-200', 'bg-blue-50', 'text-blue-700', 'border-blue-200');

  if (type === 'success') {
    alertEl.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
  } else if (type === 'error') {
    alertEl.classList.add('bg-rose-50', 'text-rose-700', 'border-rose-200');
  } else {
    alertEl.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
  }

  alertEl.textContent = message;
  setTimeout(() => {
    alertEl.classList.add('hidden');
  }, 4500);
}

function getComplaintStatusBadge(status) {
  if (status === 'Resolved') return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>`;
  if (status === 'In Progress') return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">In Progress</span>`;
  return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>`;
}

function getRiskBadgeHTML(level) {
  if (level === 'Bright') return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-bright">Bright</span>`;
  if (level === 'Average') return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-average">Average</span>`;
  if (level === 'Weak') return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-weak">Weak</span>`;
  return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-pending">Pending</span>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}
