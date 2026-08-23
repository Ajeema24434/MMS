// Lovable-style Admin Module Controller
let allMentors = [];
let allStudents = [];
let allBatches = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = API.getUser();
  if (!user || user.role !== 'ADMIN') return;

  const path = window.location.pathname;

  if (path.includes('/admin/dashboard.html')) {
    await loadAdminDashboard();
  } else if (path.includes('/admin/mentors.html')) {
    await loadAdminMentors();
    bindMentorSearch();
  } else if (path.includes('/admin/students.html')) {
    await loadAdminStudents();
    bindStudentSearch();
  } else if (path.includes('/admin/batches.html')) {
    await loadAdminBatches();
    bindBatchSearch();
  }
});

// Load Admin Dashboard
async function loadAdminDashboard() {
  const res = await API.get('/admin/dashboard');
  if (!res.success) return;

  document.getElementById('stat-total-students').textContent = res.stats.totalStudents || 0;
  document.getElementById('stat-total-mentors').textContent = res.stats.totalMentors || 0;
  document.getElementById('stat-total-batches').textContent = res.stats.totalBatches || 0;

  renderBatchesTable(res.batches, 'batches-tbody');
}

// Load Mentors Page
async function loadAdminMentors() {
  const res = await API.get('/admin/mentors');
  if (!res.success) return;
  allMentors = res.mentors;
  renderMentorsTable(allMentors);
}

function renderMentorsTable(mentors) {
  const tbody = document.getElementById('mentors-tbody');
  if (!tbody) return;

  if (mentors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 text-sm">No mentors found.</td></tr>`;
    return;
  }

  tbody.innerHTML = mentors.map(m => `
    <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
      <td class="px-6 py-4 font-semibold text-slate-900 text-sm flex items-center space-x-2">
        <span class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">${m.name.charAt(0)}</span>
        <span>${m.name}</span>
      </td>
      <td class="px-6 py-4 text-slate-600 text-sm font-mono">${m.mentor_code}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">${m.department}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">${m.designation}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">${m.email}</td>
      <td class="px-6 py-4 text-sm font-medium">${m.batch_name ? `<span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 text-xs">${m.batch_name}</span>` : '<span class="text-slate-400 text-xs">Unassigned</span>'}</td>
    </tr>
  `).join('');
}

function bindMentorSearch() {
  const searchInput = document.getElementById('mentor-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = allMentors.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.mentor_code.toLowerCase().includes(q) || 
        m.department.toLowerCase().includes(q)
      );
      renderMentorsTable(filtered);
    });
  }
}

// Load Students Page
async function loadAdminStudents() {
  const res = await API.get('/admin/students');
  if (!res.success) return;
  allStudents = res.students;
  renderStudentsTable(allStudents);

  const batchesRes = await API.get('/admin/batches');
  if (batchesRes.success) {
    const select = document.getElementById('modal-student-batch');
    if (select) {
      select.innerHTML = `<option value="">Select Batch (Optional)</option>` + 
        batchesRes.batches.map(b => `<option value="${b.id}">${b.name} (${b.department})</option>`).join('');
    }
  }
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 text-sm">No students found.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
      <td class="px-6 py-4 text-slate-600 text-sm font-mono">${s.roll_no}</td>
      <td class="px-6 py-4 font-semibold text-slate-900 text-sm">${s.name}</td>
      <td class="px-6 py-4 text-slate-600 text-sm font-mono">${s.urn}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">${s.department} (${s.division})</td>
      <td class="px-6 py-4 text-slate-600 text-sm">${s.batch_name ? `<span class="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700">${s.batch_name}</span>` : '<span class="text-slate-400 text-xs">Unassigned</span>'}</td>
      <td class="px-6 py-4 text-sm font-medium">${getRiskBadgeHTML(s.ml_risk_level)}</td>
    </tr>
  `).join('');
}

function bindStudentSearch() {
  const searchInput = document.getElementById('student-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = allStudents.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.urn.toLowerCase().includes(q) || 
        s.roll_no.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
      );
      renderStudentsTable(filtered);
    });
  }
}

// Load Batches Page
async function loadAdminBatches() {
  const res = await API.get('/admin/batches');
  if (!res.success) return;
  allBatches = res.batches;
  renderBatchesTable(allBatches, 'batches-tbody');

  const mentorsRes = await API.get('/admin/mentors');
  if (mentorsRes.success) {
    const select = document.getElementById('modal-batch-mentor');
    if (select) {
      select.innerHTML = `<option value="">Assign Mentor (Optional)</option>` + 
        mentorsRes.mentors.map(m => `<option value="${m.id}">${m.name} (${m.mentor_code})</option>`).join('');
    }
  }
}

function renderBatchesTable(batches, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (batches.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400 text-sm">No batches created yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = batches.map(b => `
    <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
      <td class="px-6 py-4 font-semibold text-slate-900 text-sm">${b.name}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">${b.department}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">${b.academic_year}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">${b.mentor_name ? `<span class="font-medium text-slate-800">${b.mentor_name}</span>` : '<span class="text-amber-600 font-medium text-xs">Unassigned</span>'}</td>
      <td class="px-6 py-4 text-slate-600 text-sm font-semibold">${b.student_count} Students</td>
    </tr>
  `).join('');
}

function bindBatchSearch() {
  const searchInput = document.getElementById('batch-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = allBatches.filter(b => 
        b.name.toLowerCase().includes(q) || 
        b.department.toLowerCase().includes(q)
      );
      renderBatchesTable(filtered, 'batches-tbody');
    });
  }
}

function getRiskBadgeHTML(level) {
  if (level === 'Bright') return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-bright">Bright</span>`;
  if (level === 'Average') return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-average">Average</span>`;
  if (level === 'Weak') return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-weak">Weak</span>`;
  return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-pending">Pending</span>`;
}
