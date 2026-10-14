// Admin Module Controller — Mentor Insight MMS (AI & DS Department)
let allMentors = [];
let allStudents = [];
let allBatches = [];
let allDivisions = [];
let activeClassFilter = 'ALL'; // 'ALL', '1', '2', '3', '4'
let activeDivisionFilter = 'ALL'; // 'ALL', 'A', 'B', etc.
let activeStudentClassFilter = 'ALL';
let activeStudentDivisionFilter = 'ALL';

// Year display helper: FY, SY, TY, BTECH
function getYearDisplay(yr) {
  switch (parseInt(yr)) {
    case 1: return 'FY';
    case 2: return 'SY';
    case 3: return 'TY';
    case 4: return 'BTECH';
    default: return `Year ${yr}`;
  }
}

function getYearPrefix(yr) {
  switch (parseInt(yr)) {
    case 1: return 'FY';
    case 2: return 'SY';
    case 3: return 'TY';
    case 4: return 'BTECH';
    default: return 'FY';
  }
}
window.getYearPrefix = getYearPrefix;

function getYearFullName(yr) {
  switch (parseInt(yr)) {
    case 1: return 'FY (First Year)';
    case 2: return 'SY (Second Year)';
    case 3: return 'TY (Third Year)';
    case 4: return 'BTECH (Final Year)';
    default: return `Year ${yr}`;
  }
}

// Toast Notification Utility
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100' : 'bg-rose-900/90 border-rose-700 text-rose-100';
  const iconSvg = isSuccess 
    ? '<svg class="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
    : '<svg class="w-4 h-4 text-rose-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

  toast.className = `${bgColor} border px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium flex items-center transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto`;
  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => toast.classList.remove('translate-y-4', 'opacity-0'), 10);
  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Credentials Display Modal (for 8-char student user ID & mentor credentials)
function showCredentialsModal(creds, role = 'STUDENT') {
  let modal = document.getElementById('credentials-display-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'credentials-display-modal';
    modal.className = 'fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in';
    document.body.appendChild(modal);
  }

  const isStudent = role === 'STUDENT';
  const roleTitle = isStudent ? 'Student Account Provisioned' : 'Faculty Mentor Registered';
  const idLabel = isStudent ? 'Generated 8-Char User ID (Username)' : 'Mentor ID (Username)';

  modal.innerHTML = `
    <div class="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2">
          <span class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
          <h3 class="font-bold text-slate-900 text-base">${roleTitle}</h3>
        </div>
        <button onclick="closeCredentialsModal()" class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
      </div>

      <p class="text-xs text-slate-500">Provide these credentials to the ${isStudent ? 'student' : 'faculty mentor'} to access their portal.</p>

      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div>
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">${idLabel}</span>
          <div class="flex items-center justify-between mt-0.5">
            <span class="font-mono text-base font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">${escapeHtml(creds.username)}</span>
            <button onclick="navigator.clipboard.writeText('${escapeHtml(creds.username)}'); showToast('Username copied!')" class="text-xs text-slate-500 hover:text-indigo-600 font-semibold">Copy</button>
          </div>
        </div>

        <div>
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Initial Password</span>
          <div class="flex items-center justify-between mt-0.5">
            <span class="font-mono text-base font-bold text-slate-900 bg-slate-200/60 px-2 py-0.5 rounded border border-slate-300">${escapeHtml(creds.password)}</span>
            <button onclick="navigator.clipboard.writeText('${escapeHtml(creds.password)}'); showToast('Password copied!')" class="text-xs text-slate-500 hover:text-indigo-600 font-semibold">Copy</button>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-200 text-xs text-slate-600 grid grid-cols-2 gap-2">
          <div><span class="text-slate-400">Name:</span> <span class="font-semibold text-slate-800">${escapeHtml(creds.name || '')}</span></div>
          <div><span class="text-slate-400">Dept:</span> <span class="font-semibold text-indigo-700">AI & DS</span></div>
          ${creds.year ? `<div><span class="text-slate-400">Year:</span> <span class="font-semibold text-slate-800">${getYearDisplay(creds.year)}</span></div>` : ''}
          ${creds.division ? `<div><span class="text-slate-400">Division:</span> <span class="font-semibold text-slate-800">Div ${escapeHtml(creds.division)}</span></div>` : ''}
          ${creds.roll_no ? `<div><span class="text-slate-400">Roll No:</span> <span class="font-semibold text-slate-800">${escapeHtml(creds.roll_no)}</span></div>` : ''}
        </div>
      </div>

      <div class="flex space-x-2 pt-2">
        <button onclick="copyAllCredentials('${escapeHtml(creds.username)}', '${escapeHtml(creds.password)}', '${escapeHtml(creds.name || '')}')" class="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition">Copy All Details</button>
        <button onclick="closeCredentialsModal()" class="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition">← Back / Done</button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeCredentialsModal() {
  const modal = document.getElementById('credentials-display-modal');
  if (modal) modal.classList.add('hidden');
}

function copyAllCredentials(user, pass, name) {
  const text = `Mentor Insight Login Credentials\nName: ${name}\nDepartment: AI & DS\nUsername: ${user}\nPassword: ${pass}\nPortal: http://localhost:5000/login.html`;
  navigator.clipboard.writeText(text);
  showToast('Full credentials copied to clipboard!');
}

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
    await loadAdminDivisions();
    bindBatchSearch();
  }
});

// ==========================================
// 1. ADMIN DASHBOARD OVERVIEW (AI & DS)
// ==========================================
async function loadAdminDashboard() {
  const res = await API.get('/admin/dashboard');
  if (!res.success) {
    showToast(res.message || 'Error loading dashboard statistics', 'error');
    return;
  }

  const sCount = document.getElementById('stat-total-students');
  const mCount = document.getElementById('stat-total-mentors');
  const bCount = document.getElementById('stat-total-batches');
  const dCount = document.getElementById('stat-total-divisions');

  if (sCount) sCount.textContent = res.stats.totalStudents || 0;
  if (mCount) mCount.textContent = res.stats.totalMentors || 0;
  if (bCount) bCount.textContent = res.stats.totalBatches || 0;
  if (dCount) dCount.textContent = res.stats.totalDivisions || 0;

  dashboardBatchesCache = res.batches || [];
  dashboardDivisionsCache = res.divisions || [];
  allBatches = res.batches || [];
  allDivisions = res.divisions || [];

  renderBatchesTable(res.batches, 'batches-tbody', false);
  renderDivisionsSummary(res.divisions);
}

function renderDivisionsSummary(divisions) {
  const container = document.getElementById('divisions-summary-container');
  if (!container || !divisions) return;

  const years = [1, 2, 3, 4];
  const yearNames = { 1: 'FY (First Year)', 2: 'SY (Second Year)', 3: 'TY (Third Year)', 4: 'BTECH (Final Year)' };

  container.innerHTML = years.map(yr => {
    const yrDivs = divisions.filter(d => d.year === yr);
    return `
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-900">${yearNames[yr]}</span>
          <span class="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">${yrDivs.length} Divs</span>
        </div>
        <div class="flex flex-wrap gap-1.5 pt-1">
          ${yrDivs.length > 0 
            ? yrDivs.map(d => `<span class="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">Div ${d.division} (${d.batch_count || 4} Batches)</span>`).join('')
            : '<span class="text-slate-400 text-xs">No divisions added</span>'}
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 2. MENTOR MASTER-DATA MANAGEMENT
// ==========================================
async function loadAdminMentors() {
  const res = await API.get('/admin/mentors');
  if (!res.success) {
    showToast(res.message || 'Error loading mentors', 'error');
    return;
  }
  allMentors = res.mentors;
  renderMentorsTable(allMentors);
}

function renderMentorsTable(mentors) {
  const tbody = document.getElementById('mentors-tbody');
  if (!tbody) return;

  // Deduplicate mentors by ID so mentors NEVER repeat
  const uniqueMentorsMap = new Map();
  for (const m of (mentors || [])) {
    if (!uniqueMentorsMap.has(m.id)) {
      uniqueMentorsMap.set(m.id, m);
    }
  }
  const uniqueMentors = Array.from(uniqueMentorsMap.values());

  if (uniqueMentors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 text-sm">No mentors found in AI & DS department.</td></tr>`;
    return;
  }

  tbody.innerHTML = uniqueMentors.map(m => {
    let batchNames = [];
    if (Array.isArray(m.batches) && m.batches.length > 0) {
      batchNames = m.batches.map(b => b.name);
    } else if (Array.isArray(m.batch_names) && m.batch_names.length > 0) {
      batchNames = m.batch_names;
    } else if (m.batch_name) {
      batchNames = m.batch_name.split(',').map(s => s.trim()).filter(Boolean);
    }

    const batchBadges = batchNames.length > 0
      ? `<div class="flex flex-wrap gap-1">${batchNames.map(name => `<span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 text-xs font-semibold">${escapeHtml(name)}</span>`).join('')}</div>`
      : '<span class="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-100 text-xs font-medium">Unassigned</span>';

    return `
      <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
        <td class="px-6 py-4 font-semibold text-slate-900 text-sm flex items-center space-x-2">
          <span class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">${escapeHtml(m.name.charAt(0))}</span>
          <span>${escapeHtml(m.name)}</span>
        </td>
        <td class="px-6 py-4 text-slate-600 text-sm font-mono font-semibold">${escapeHtml(m.mentor_code)}</td>
        <td class="px-6 py-4 text-indigo-700 text-sm font-medium">AI & DS</td>
        <td class="px-6 py-4 text-slate-600 text-sm">${escapeHtml(m.designation || 'Faculty')}</td>
        <td class="px-6 py-4 text-slate-600 text-sm">${escapeHtml(m.email)}</td>
        <td class="px-6 py-4 text-sm font-medium">
          ${batchBadges}
        </td>
        <td class="px-6 py-4 text-sm text-right space-x-1">
          <button onclick="openEditMentorModal(${m.id})" class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold rounded-md transition">Edit</button>
          <button onclick="confirmDeleteMentor(${m.id}, '${escapeHtml(m.name)}')" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold rounded-md transition">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function bindMentorSearch() {
  const searchInput = document.getElementById('mentor-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = allMentors.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.mentor_code.toLowerCase().includes(q) || 
        (m.email && m.email.toLowerCase().includes(q))
      );
      renderMentorsTable(filtered);
    });
  }
}

function openEditMentorModal(mentorId) {
  const mentor = allMentors.find(m => m.id === mentorId);
  if (!mentor) return;

  const modal = document.getElementById('edit-mentor-modal');
  if (!modal) return;

  document.getElementById('edit-m-id').value = mentor.id;
  document.getElementById('edit-m-name').value = mentor.name;
  document.getElementById('edit-m-email').value = mentor.email;
  document.getElementById('edit-m-code').value = mentor.mentor_code;
  document.getElementById('edit-m-desig').value = mentor.designation || '';
  document.getElementById('edit-m-phone').value = mentor.phone || '';

  modal.classList.remove('hidden');
}

function closeEditMentorModal() {
  const modal = document.getElementById('edit-mentor-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleUpdateMentor(e) {
  e.preventDefault();
  const mentorId = document.getElementById('edit-m-id').value;
  const body = {
    name: document.getElementById('edit-m-name').value.trim(),
    email: document.getElementById('edit-m-email').value.trim(),
    designation: document.getElementById('edit-m-desig').value.trim(),
    phone: document.getElementById('edit-m-phone').value.trim()
  };

  const res = await API.put(`/admin/mentors/${mentorId}`, body);
  if (res.success) {
    showToast('Mentor profile updated successfully');
    closeEditMentorModal();
    await loadAdminMentors();
  } else {
    showToast(res.message || 'Error updating mentor', 'error');
  }
}

async function confirmDeleteMentor(mentorId, mentorName) {
  if (!confirm(`Are you sure you want to remove mentor "${mentorName}"?\nAny assigned batches will become unassigned.`)) {
    return;
  }

  const res = await API.delete(`/admin/mentors/${mentorId}`);
  if (res.success) {
    showToast(`Mentor "${mentorName}" removed successfully`);
    await loadAdminMentors();
  } else {
    showToast(res.message || 'Error deleting mentor', 'error');
  }
}

// ==========================================
// 3. STUDENT MASTER-DATA (URN & PASSWORDS)
// ==========================================
let activeStudentBatchFilter = 'ALL';

async function loadAdminStudents() {
  const res = await API.get('/admin/students');
  if (!res.success) {
    showToast(res.message || 'Error loading students', 'error');
    return;
  }
  allStudents = res.students;

  // Load divisions & batches for filter and modal selects
  await loadDivisionsAndBatchesForSelects();

  updateStudentDivisionFilterOptions();
  updateStudentBatchFilterOptions();
  applyStudentsFilter();
}

function setStudentClassFilter(year, division = 'ALL') {
  activeStudentClassFilter = String(year);
  activeStudentDivisionFilter = division;
  activeStudentBatchFilter = 'ALL';

  document.querySelectorAll('.student-pill').forEach(btn => {
    const filterVal = btn.getAttribute('data-sfilter');
    if (filterVal === activeStudentClassFilter) {
      btn.className = 'student-pill px-3 py-1.5 text-xs font-bold rounded-lg transition bg-indigo-600 text-white shadow-sm';
    } else {
      btn.className = 'student-pill px-3 py-1.5 text-xs font-semibold rounded-lg transition bg-slate-100 hover:bg-slate-200 text-slate-700';
    }
  });

  updateStudentDivisionFilterOptions();
  updateStudentBatchFilterOptions();
  applyStudentsFilter();
}

function setStudentDivisionFilter(division) {
  activeStudentDivisionFilter = division;
  activeStudentBatchFilter = 'ALL';
  updateStudentBatchFilterOptions();
  applyStudentsFilter();
}

function setStudentBatchFilter(batchId) {
  activeStudentBatchFilter = batchId;
  applyStudentsFilter();
}

function updateStudentDivisionFilterOptions() {
  const divSelect = document.getElementById('student-div-filter-select');
  if (!divSelect) return;

  let availableDivs = [];
  if (activeStudentClassFilter === 'ALL') {
    availableDivs = [...new Set(allStudents.map(s => s.division).filter(Boolean))].sort();
  } else {
    const yr = parseInt(activeStudentClassFilter);
    availableDivs = [...new Set(allStudents.filter(s => s.year === yr).map(s => s.division).filter(Boolean))].sort();
  }

  const currentVal = activeStudentDivisionFilter;
  divSelect.innerHTML = `<option value="ALL">All Divisions</option>` +
    availableDivs.map(d => `<option value="${escapeHtml(d)}">Division ${escapeHtml(d)}</option>`).join('');

  if (availableDivs.includes(currentVal)) {
    divSelect.value = currentVal;
  } else {
    activeStudentDivisionFilter = 'ALL';
    divSelect.value = 'ALL';
  }
}

function updateStudentBatchFilterOptions() {
  const batchSelect = document.getElementById('student-batch-filter-select');
  if (!batchSelect) return;

  let availableBatches = [];
  if (activeStudentClassFilter === 'ALL') {
    availableBatches = allBatches;
  } else {
    const yr = parseInt(activeStudentClassFilter);
    availableBatches = allBatches.filter(b => b.year === yr);
    if (activeStudentDivisionFilter !== 'ALL') {
      availableBatches = availableBatches.filter(b => !b.division || b.division === activeStudentDivisionFilter);
    }
  }

  const currentVal = activeStudentBatchFilter;
  batchSelect.innerHTML = `<option value="ALL">All Batches</option>` +
    availableBatches.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('');

  if (availableBatches.some(b => String(b.id) === String(currentVal))) {
    batchSelect.value = currentVal;
  } else {
    activeStudentBatchFilter = 'ALL';
    batchSelect.value = 'ALL';
  }
}

function applyStudentsFilter() {
  const searchQuery = (document.getElementById('student-search')?.value || '').toLowerCase().trim();
  let filtered = allStudents;

  if (activeStudentClassFilter !== 'ALL') {
    const yr = parseInt(activeStudentClassFilter);
    filtered = filtered.filter(s => s.year === yr);
  }
  if (activeStudentDivisionFilter !== 'ALL') {
    filtered = filtered.filter(s => s.division === activeStudentDivisionFilter);
  }
  if (activeStudentBatchFilter !== 'ALL') {
    filtered = filtered.filter(s => String(s.batch_id) === String(activeStudentBatchFilter));
  }
  if (searchQuery) {
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(searchQuery) || 
      (s.urn && s.urn.toLowerCase().includes(searchQuery)) || 
      (s.roll_no && s.roll_no.toLowerCase().includes(searchQuery)) ||
      (s.division && s.division.toLowerCase().includes(searchQuery)) ||
      (s.batch_name && s.batch_name.toLowerCase().includes(searchQuery))
    );
  }

  renderStudentsTable(filtered);

  const badge = document.getElementById('student-filter-count-badge');
  if (badge) {
    badge.textContent = `${filtered.length} Student${filtered.length === 1 ? '' : 's'}`;
  }
}

// Credentials PDF Download Modals & Triggers
function openStudentCredentialsModal() {
  const modal = document.getElementById('download-credentials-modal');
  if (!modal) return;

  const yr = activeStudentClassFilter !== 'ALL' ? parseInt(activeStudentClassFilter) : 1;
  const div = activeStudentDivisionFilter !== 'ALL' ? activeStudentDivisionFilter : 'A';

  const classDisplay = getYearDisplay(yr);
  const classScopeEl = document.getElementById('pdf-scope-class');
  const divScopeEl = document.getElementById('pdf-scope-div');

  if (classScopeEl) classScopeEl.textContent = `${classDisplay} (AI & DS)`;
  if (divScopeEl) divScopeEl.textContent = `Division ${div}`;

  // Populate batch select options in PDF modal
  const batchSelect = document.getElementById('pdf-modal-batch-select');
  if (batchSelect) {
    const matchingBatches = allBatches.filter(b => b.year === yr && (!b.division || b.division === div));
    batchSelect.innerHTML = `<option value="ALL">All Batches (Combined / Entire Division)</option>` +
      matchingBatches.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('');

    if (activeStudentBatchFilter !== 'ALL' && matchingBatches.some(b => String(b.id) === String(activeStudentBatchFilter))) {
      batchSelect.value = activeStudentBatchFilter;
    }
  }

  modal.classList.remove('hidden');
}

function closeStudentCredentialsModal() {
  const modal = document.getElementById('download-credentials-modal');
  if (modal) modal.classList.add('hidden');
}

async function triggerDownloadBatchPdf() {
  try {
    const yr = activeStudentClassFilter !== 'ALL' ? parseInt(activeStudentClassFilter) : 1;
    const div = activeStudentDivisionFilter !== 'ALL' ? activeStudentDivisionFilter : 'A';
    const batchSelect = document.getElementById('pdf-modal-batch-select');
    const batchId = batchSelect ? batchSelect.value : 'ALL';

    let batchName = 'All Batches';
    let mentorName = 'Faculty Mentor';
    if (batchId !== 'ALL') {
      const batchObj = allBatches.find(b => String(b.id) === String(batchId));
      if (batchObj) {
        batchName = batchObj.name;
        mentorName = batchObj.mentor_name || 'Assigned Faculty';
      }
    }

    showToast('Generating Credentials PDF...');
    const res = await API.get(`/admin/credentials/students?year=${yr}&division=${div}&batch_id=${batchId}`);
    if (!res.success || !res.students) {
      showToast(res.message || 'Error fetching student credentials', 'error');
      return;
    }

    if (res.students.length === 0) {
      showToast('No students found for this batch/division.', 'error');
      return;
    }

    if (typeof PDFCredentials !== 'undefined') {
      PDFCredentials.generateStudentPdf({
        classYear: getYearPrefix(yr),
        division: div,
        batchName,
        mentorName,
        students: res.students,
        title: `${getYearPrefix(yr)} Div ${div} — ${batchName} Login Credentials`
      });
      closeStudentCredentialsModal();
      showToast('Credentials PDF generated successfully!');
    } else {
      showToast('PDF generator is ready. Please try again.');
    }
  } catch (err) {
    console.error('Error generating batch PDF:', err);
    showToast(err.message || 'Failed to generate PDF', 'error');
  }
}

async function triggerDownloadAllBatchesSeparatePdfs() {
  try {
    const yr = activeStudentClassFilter !== 'ALL' ? parseInt(activeStudentClassFilter) : 1;
    const div = activeStudentDivisionFilter !== 'ALL' ? activeStudentDivisionFilter : 'A';

    const matchingBatches = allBatches.filter(b => b.year === yr && (!b.division || b.division === div));
    if (matchingBatches.length === 0) {
      showToast('No batches found for this class and division.', 'error');
      return;
    }

    showToast(`Generating separate PDFs for ${matchingBatches.length} batches...`);

    for (const batch of matchingBatches) {
      const res = await API.get(`/admin/credentials/students?year=${yr}&division=${div}&batch_id=${batch.id}`);
      if (res.success && res.students && res.students.length > 0) {
        if (typeof PDFCredentials !== 'undefined') {
          PDFCredentials.generateStudentPdf({
            classYear: getYearPrefix(yr),
            division: div,
            batchName: batch.name,
            mentorName: batch.mentor_name || 'Assigned Faculty',
            students: res.students,
            title: `${getYearPrefix(yr)} Div ${div} — ${batch.name} Login Credentials`
          });
        }
        await new Promise(r => setTimeout(r, 600));
      }
    }

    closeStudentCredentialsModal();
    showToast(`Downloaded credentials PDFs for all ${matchingBatches.length} batches!`);
  } catch (err) {
    console.error('Error generating separate batch PDFs:', err);
    showToast(err.message || 'Failed to generate separate batch PDFs', 'error');
  }
}

async function downloadMentorCredentialsPdf() {
  showToast('Generating Mentor Credentials PDF...');
  const res = await API.get('/admin/credentials/mentors');
  if (!res.success || !res.mentors) {
    showToast(res.message || 'Error fetching mentor credentials', 'error');
    return;
  }

  if (typeof PDFCredentials !== 'undefined') {
    PDFCredentials.generateMentorPdf(res.mentors);
    showToast('Faculty Mentor Credentials PDF downloaded successfully!');
  } else {
    showToast('PDF generator is ready. Please try again.');
  }
}

// ==========================================
// ADMIN DASHBOARD CREDENTIALS MODAL CONTROLLER
// ==========================================
let dashboardBatchesCache = [];
let dashboardDivisionsCache = [];

async function openAdminDashboardCredentialsModal() {
  const modal = document.getElementById('admin-dashboard-credentials-modal');
  if (!modal) return;

  if (dashboardBatchesCache.length === 0 || dashboardDivisionsCache.length === 0) {
    try {
      const [batchRes, divRes] = await Promise.all([
        API.get('/admin/batches'),
        API.get('/admin/divisions')
      ]);
      if (batchRes.success) dashboardBatchesCache = batchRes.batches;
      if (divRes.success) dashboardDivisionsCache = divRes.divisions;
    } catch (e) {
      console.error('Error fetching batches/divisions for credentials modal:', e);
    }
  }

  onDashboardCredYearChange();
  modal.classList.remove('hidden');
}

function closeAdminDashboardCredentialsModal() {
  const modal = document.getElementById('admin-dashboard-credentials-modal');
  if (modal) modal.classList.add('hidden');
}

function setDashboardCredTab(tab) {
  const studentBtn = document.getElementById('tab-cred-student');
  const mentorBtn = document.getElementById('tab-cred-mentor');
  const studentSec = document.getElementById('dashboard-cred-student-section');
  const mentorSec = document.getElementById('dashboard-cred-mentor-section');

  if (tab === 'student') {
    if (studentBtn) studentBtn.className = 'w-1/2 py-2 rounded-lg bg-white text-indigo-700 shadow-sm transition';
    if (mentorBtn) mentorBtn.className = 'w-1/2 py-2 rounded-lg text-slate-600 hover:text-slate-900 transition';
    if (studentSec) studentSec.classList.remove('hidden');
    if (mentorSec) mentorSec.classList.add('hidden');
  } else {
    if (mentorBtn) mentorBtn.className = 'w-1/2 py-2 rounded-lg bg-white text-indigo-700 shadow-sm transition';
    if (studentBtn) studentBtn.className = 'w-1/2 py-2 rounded-lg text-slate-600 hover:text-slate-900 transition';
    if (mentorSec) mentorSec.classList.remove('hidden');
    if (studentSec) studentSec.classList.add('hidden');
  }
}

function onDashboardCredYearChange() {
  const yearSelect = document.getElementById('dash-cred-year');
  const divSelect = document.getElementById('dash-cred-div');
  if (!yearSelect || !divSelect) return;

  const yr = parseInt(yearSelect.value);
  const divsForYear = dashboardDivisionsCache.filter(d => d.year === yr);
  const divLetters = divsForYear.length > 0 ? divsForYear.map(d => d.division || d.name) : ['A'];

  const uniqueDivs = Array.from(new Set(divLetters)).sort();
  divSelect.innerHTML = uniqueDivs.map(d => `<option value="${d}">Division ${d}</option>`).join('');
  onDashboardCredDivChange();
}

function onDashboardCredDivChange() {
  const yearSelect = document.getElementById('dash-cred-year');
  const divSelect = document.getElementById('dash-cred-div');
  const batchSelect = document.getElementById('dash-cred-batch');
  if (!yearSelect || !divSelect || !batchSelect) return;

  const yr = parseInt(yearSelect.value);
  const div = divSelect.value;

  const matchingBatches = dashboardBatchesCache.filter(b => b.year === yr && (!b.division || b.division === div));
  batchSelect.innerHTML = `<option value="ALL">All Batches (Entire Division)</option>` +
    matchingBatches.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('');
}

async function triggerDashboardBatchPdf() {
  try {
    const yearSelect = document.getElementById('dash-cred-year');
    const divSelect = document.getElementById('dash-cred-div');
    const batchSelect = document.getElementById('dash-cred-batch');
    if (!yearSelect || !divSelect || !batchSelect) return;

    const yr = parseInt(yearSelect.value);
    const div = divSelect.value;
    const batchId = batchSelect.value;

    let batchName = 'All Batches';
    let mentorName = 'Faculty Mentor';
    if (batchId !== 'ALL') {
      const batchObj = dashboardBatchesCache.find(b => String(b.id) === String(batchId));
      if (batchObj) {
        batchName = batchObj.name;
        mentorName = batchObj.mentor_name || 'Assigned Faculty';
      }
    }

    showToast('Generating Credentials PDF...');
    const res = await API.get(`/admin/credentials/students?year=${yr}&division=${div}&batch_id=${batchId}`);
    if (!res.success || !res.students) {
      showToast(res.message || 'Error fetching student credentials', 'error');
      return;
    }

    if (res.students.length === 0) {
      showToast('No students found for this batch/division.', 'error');
      return;
    }

    if (typeof PDFCredentials !== 'undefined') {
      PDFCredentials.generateStudentPdf({
        classYear: getYearPrefix(yr),
        division: div,
        batchName,
        mentorName,
        students: res.students,
        title: `${getYearPrefix(yr)} Div ${div} — ${batchName} Login Credentials`
      });
      closeAdminDashboardCredentialsModal();
      showToast('Credentials PDF generated successfully!');
    } else {
      showToast('PDF generator is ready. Please try again.');
    }
  } catch (err) {
    console.error('Error generating credentials PDF:', err);
    showToast(err.message || 'Failed to generate PDF', 'error');
  }
}

async function triggerDashboardAllBatchesPdf() {
  try {
    const yearSelect = document.getElementById('dash-cred-year');
    const divSelect = document.getElementById('dash-cred-div');
    if (!yearSelect || !divSelect) return;

    const yr = parseInt(yearSelect.value);
    const div = divSelect.value;

    const matchingBatches = dashboardBatchesCache.filter(b => b.year === yr && (!b.division || b.division === div));
    if (matchingBatches.length === 0) {
      showToast('No batches found for this class and division.', 'error');
      return;
    }

    showToast(`Generating separate PDFs for ${matchingBatches.length} batches...`);

    for (const batch of matchingBatches) {
      const res = await API.get(`/admin/credentials/students?year=${yr}&division=${div}&batch_id=${batch.id}`);
      if (res.success && res.students && res.students.length > 0) {
        if (typeof PDFCredentials !== 'undefined') {
          PDFCredentials.generateStudentPdf({
            classYear: getYearPrefix(yr),
            division: div,
            batchName: batch.name,
            mentorName: batch.mentor_name || 'Assigned Faculty',
            students: res.students,
            title: `${getYearPrefix(yr)} Div ${div} — ${batch.name} Login Credentials`
          });
        }
      }
      await new Promise(r => setTimeout(r, 600));
    }

    closeAdminDashboardCredentialsModal();
    showToast('Separate Batch PDFs generated successfully!');
  } catch (err) {
    console.error('Error generating separate batch PDFs:', err);
    showToast(err.message || 'Failed to generate batch PDFs', 'error');
  }
}

async function loadDivisionsAndBatchesForSelects() {
  const [divRes, batchRes] = await Promise.all([
    API.get('/admin/divisions'),
    API.get('/admin/batches')
  ]);

  if (divRes.success) allDivisions = divRes.divisions;
  if (batchRes.success) allBatches = batchRes.batches;

  // Initialize division and batch selects strictly for the default year (FY)
  updateStudentDivisionOptions('s-year', 's-div', 'A');
  updateStudentBatchOptions('s-year', 's-div', 'modal-student-batch');

  updateStudentDivisionOptions('edit-s-year', 'edit-s-div', 'A');
  updateStudentBatchOptions('edit-s-year', 'edit-s-div', 'edit-s-batch');
}

// Helper: Get all available divisions for a given academic year
function getDivisionsForYear(year) {
  const yr = parseInt(year);
  const divSet = new Set();

  if (Array.isArray(allDivisions)) {
    allDivisions.filter(d => d.year === yr).forEach(d => {
      if (d.name) divSet.add(d.name.trim().toUpperCase());
    });
  }

  if (Array.isArray(allBatches)) {
    allBatches.filter(b => b.year === yr).forEach(b => {
      if (b.division) divSet.add(b.division.trim().toUpperCase());
    });
  }

  if (Array.isArray(allStudents)) {
    allStudents.filter(s => s.year === yr).forEach(s => {
      if (s.division) divSet.add(s.division.trim().toUpperCase());
    });
  }

  // Fallback defaults if no divisions are registered yet
  if (divSet.size === 0) {
    if (yr === 1) {
      divSet.add('A');
      divSet.add('B');
    } else {
      divSet.add('A');
    }
  }

  return [...divSet].sort();
}

// Dynamically populate division options for student modal
function updateStudentDivisionOptions(yearSelectId, divSelectId, selectedDiv = null) {
  const yearSelect = document.getElementById(yearSelectId);
  const divSelect = document.getElementById(divSelectId);
  if (!yearSelect || !divSelect) return;

  const chosenYear = parseInt(yearSelect.value);
  const availableDivs = getDivisionsForYear(chosenYear);

  if (selectedDiv && !availableDivs.includes(selectedDiv.toUpperCase())) {
    availableDivs.push(selectedDiv.toUpperCase());
    availableDivs.sort();
  }

  divSelect.innerHTML = availableDivs.map(d => `<option value="${escapeHtml(d)}">Division ${escapeHtml(d)}</option>`).join('');

  if (selectedDiv && availableDivs.includes(selectedDiv.toUpperCase())) {
    divSelect.value = selectedDiv.toUpperCase();
  } else if (availableDivs.length > 0) {
    divSelect.value = availableDivs[0];
  }
}

// Dynamically populate batch options strictly matching chosen Year and Division (NO extra batches)
function updateStudentBatchOptions(yearSelectId, divSelectId, batchSelectId, selectedBatchId = null) {
  const yearSelect = document.getElementById(yearSelectId);
  const divSelect = document.getElementById(divSelectId);
  const batchSelect = document.getElementById(batchSelectId);
  if (!yearSelect || !batchSelect) return;

  const chosenYear = parseInt(yearSelect.value);
  const chosenDiv = divSelect ? divSelect.value.trim().toUpperCase() : '';

  // Filter batches strictly for chosen year
  const yearBatches = allBatches.filter(b => b.year === chosenYear);

  if (yearBatches.length === 0) {
    batchSelect.innerHTML = `<option value="">-- No Batches Created for ${getYearDisplay(chosenYear)} --</option>`;
    batchSelect.value = '';
    return;
  }

  // Filter batches strictly for the chosen division — do NOT include other divisions or extra batches
  let matchingBatches = [];
  if (chosenDiv) {
    matchingBatches = yearBatches.filter(b => b.division && b.division.trim().toUpperCase() === chosenDiv);
  } else {
    // If no division selected, show unassigned batches only
    matchingBatches = yearBatches.filter(b => !b.division);
  }

  if (matchingBatches.length === 0) {
    const label = chosenDiv ? `${getYearDisplay(chosenYear)} Division ${chosenDiv}` : getYearDisplay(chosenYear);
    batchSelect.innerHTML = `<option value="">-- No Batches Created for ${label} --</option>`;
    batchSelect.value = '';
    return;
  }

  // Render ONLY the matching batches from that year and division (no extra batches)
  let optionsHtml = `<option value="">-- Select Batch (Optional) --</option>`;
  optionsHtml += matchingBatches.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('');

  batchSelect.innerHTML = optionsHtml;

  // Restore previous selection ONLY if it belongs to the strictly filtered matching batches
  if (selectedBatchId && matchingBatches.some(b => String(b.id) === String(selectedBatchId))) {
    batchSelect.value = String(selectedBatchId);
  } else {
    batchSelect.value = '';
  }
}

// Handlers for modal Year and Division dropdown changes
function handleStudentYearChange(yearId, divId, batchId) {
  const divSelect = document.getElementById(divId);
  const currentDiv = divSelect ? divSelect.value : null;
  updateStudentDivisionOptions(yearId, divId, currentDiv);
  updateStudentBatchOptions(yearId, divId, batchId);
}

function handleStudentDivChange(yearId, divId, batchId) {
  const currentBatchVal = document.getElementById(batchId)?.value;
  updateStudentBatchOptions(yearId, divId, batchId, currentBatchVal);
}

// Alias for backward compatibility
function handleStudentYearOrDivChange(yearId, divId, batchId) {
  handleStudentYearChange(yearId, divId, batchId);
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 text-sm">No students found matching current filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
      <td class="px-6 py-4 text-slate-700 text-sm font-mono font-semibold">${escapeHtml(s.roll_no)}</td>
      <td class="px-6 py-4 font-semibold text-slate-900 text-sm">${escapeHtml(s.name)}</td>
      <td class="px-6 py-4 text-indigo-700 text-sm font-mono font-bold bg-indigo-50/60 px-2 rounded">${escapeHtml(s.urn)}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">${getYearDisplay(s.year || 1)} - Div ${escapeHtml(s.division || 'A')}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">
        ${s.batch_name 
          ? `<span class="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700 font-medium">${escapeHtml(s.batch_name)}</span>` 
          : '<span class="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-medium">Unassigned</span>'}
      </td>
      <td class="px-6 py-4 text-sm font-medium">${getRiskBadgeHTML(s.ml_risk_level)}</td>
      <td class="px-6 py-4 text-sm text-right space-x-1">
        <button onclick="openEditStudentModal(${s.id})" class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold rounded-md transition">Edit</button>
        <button onclick="confirmDeleteStudent(${s.id}, '${escapeHtml(s.name)}')" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold rounded-md transition">Delete</button>
      </td>
    </tr>
  `).join('');
}

function bindStudentSearch() {
  const searchInput = document.getElementById('student-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyStudentsFilter();
    });
  }
}

function openEditStudentModal(studentId) {
  const student = allStudents.find(s => s.id === studentId);
  if (!student) return;

  const modal = document.getElementById('edit-student-modal');
  if (!modal) return;

  document.getElementById('edit-s-id').value = student.id;
  document.getElementById('edit-s-name').value = student.name;
  document.getElementById('edit-s-urn').value = student.urn;
  document.getElementById('edit-s-roll').value = student.roll_no;
  document.getElementById('edit-s-email').value = student.email;
  document.getElementById('edit-s-year').value = student.year || 1;

  // Dynamically populate division options for student's year and set student's division
  updateStudentDivisionOptions('edit-s-year', 'edit-s-div', student.division || 'A');

  // Strictly populate batch options for this student's year and division (NO extra batches)
  updateStudentBatchOptions('edit-s-year', 'edit-s-div', 'edit-s-batch', student.batch_id);

  modal.classList.remove('hidden');
}

function closeEditStudentModal() {
  const modal = document.getElementById('edit-student-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleUpdateStudent(e) {
  e.preventDefault();
  const studentId = document.getElementById('edit-s-id').value;
  const batchVal = document.getElementById('edit-s-batch').value;
  const body = {
    name: document.getElementById('edit-s-name').value.trim(),
    email: document.getElementById('edit-s-email').value.trim(),
    roll_no: document.getElementById('edit-s-roll').value.trim(),
    year: parseInt(document.getElementById('edit-s-year').value),
    division: document.getElementById('edit-s-div').value.trim().toUpperCase(),
    batch_id: batchVal ? parseInt(batchVal) : null
  };

  const res = await API.put(`/admin/students/${studentId}`, body);
  if (res.success) {
    showToast('Student record updated successfully');
    closeEditStudentModal();
    await loadAdminStudents();
  } else {
    showToast(res.message || 'Error updating student', 'error');
  }
}

async function confirmDeleteStudent(studentId, studentName) {
  if (!confirm(`Are you sure you want to remove student "${studentName}"?\nThis will remove their profile and records.`)) {
    return;
  }

  const res = await API.delete(`/admin/students/${studentId}`);
  if (res.success) {
    showToast(`Student "${studentName}" deleted successfully`);
    await loadAdminStudents();
  } else {
    showToast(res.message || 'Error deleting student', 'error');
  }
}

// ==========================================
// 4. DIVISIONS & BATCHES MANAGEMENT
// ==========================================
function setClassFilter(year, division = 'ALL') {
  activeClassFilter = String(year);
  activeDivisionFilter = division;

  document.querySelectorAll('.class-pill').forEach(btn => {
    const filterVal = btn.getAttribute('data-filter');
    if (filterVal === activeClassFilter) {
      btn.className = 'class-pill px-3.5 py-1.5 text-xs font-bold rounded-lg transition bg-indigo-600 text-white shadow-sm';
    } else {
      btn.className = 'class-pill px-3.5 py-1.5 text-xs font-semibold rounded-lg transition bg-slate-100 hover:bg-slate-200 text-slate-700';
    }
  });

  updateDivisionFilterOptions();
  applyBatchesAndDivisionsFilter();

  // Sync modal defaults
  if (activeClassFilter !== 'ALL') {
    const divYearSelect = document.getElementById('div-year');
    if (divYearSelect) divYearSelect.value = activeClassFilter;

    const batchYearSelect = document.getElementById('b-year');
    if (batchYearSelect) batchYearSelect.value = activeClassFilter;
  }
}

function setDivisionFilter(division) {
  activeDivisionFilter = division;
  applyBatchesAndDivisionsFilter();

  if (activeDivisionFilter !== 'ALL') {
    const batchDivInput = document.getElementById('b-div');
    if (batchDivInput) batchDivInput.value = activeDivisionFilter;
  }
}

function resetClassFilter() {
  setClassFilter('ALL', 'ALL');
}

function updateDivisionFilterOptions() {
  const divSelect = document.getElementById('division-filter-select');
  if (!divSelect) return;

  let availableDivs = [];
  if (activeClassFilter === 'ALL') {
    availableDivs = [...new Set(allDivisions.map(d => d.name))].sort();
  } else {
    const yr = parseInt(activeClassFilter);
    availableDivs = [...new Set(allDivisions.filter(d => d.year === yr).map(d => d.name))].sort();
  }

  const currentVal = activeDivisionFilter;
  divSelect.innerHTML = `<option value="ALL">All Divisions${activeClassFilter !== 'ALL' ? ` (${getYearDisplay(activeClassFilter)})` : ' in Class'}</option>` +
    availableDivs.map(d => `<option value="${escapeHtml(d)}">Division ${escapeHtml(d)}</option>`).join('');

  if (availableDivs.includes(currentVal)) {
    divSelect.value = currentVal;
  } else {
    activeDivisionFilter = 'ALL';
    divSelect.value = 'ALL';
  }
}

function applyBatchesAndDivisionsFilter() {
  // 1. Filter divisions
  let filteredDivisions = allDivisions;
  if (activeClassFilter !== 'ALL') {
    const yr = parseInt(activeClassFilter);
    filteredDivisions = filteredDivisions.filter(d => d.year === yr);
  }
  if (activeDivisionFilter !== 'ALL') {
    filteredDivisions = filteredDivisions.filter(d => d.name === activeDivisionFilter);
  }
  renderDivisionsTable(filteredDivisions);

  // 2. Filter batches
  const searchQuery = (document.getElementById('batch-search')?.value || '').toLowerCase().trim();
  let filteredBatches = allBatches;
  if (activeClassFilter !== 'ALL') {
    const yr = parseInt(activeClassFilter);
    filteredBatches = filteredBatches.filter(b => b.year === yr);
  }
  if (activeDivisionFilter !== 'ALL') {
    filteredBatches = filteredBatches.filter(b => b.division === activeDivisionFilter);
  }
  if (searchQuery) {
    filteredBatches = filteredBatches.filter(b =>
      b.name.toLowerCase().includes(searchQuery) ||
      (b.division && b.division.toLowerCase().includes(searchQuery)) ||
      (b.mentor_name && b.mentor_name.toLowerCase().includes(searchQuery))
    );
  }
  renderBatchesTable(filteredBatches, 'batches-tbody', true);

  // 3. Update badges and description text
  const badge = document.getElementById('active-filter-badge');
  if (badge) {
    if (activeClassFilter === 'ALL') {
      badge.textContent = `Showing: All Classes (${allBatches.length} Batches)`;
      badge.className = 'px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-sm';
    } else {
      const yrName = getYearDisplay(activeClassFilter);
      const divName = activeDivisionFilter !== 'ALL' ? ` - Div ${activeDivisionFilter}` : '';
      badge.textContent = `Showing: ${yrName}${divName} (${filteredBatches.length} Batches)`;
      badge.className = 'px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 shadow-sm';
    }
  }

  const divCountBadge = document.getElementById('divisions-count-badge');
  if (divCountBadge) {
    divCountBadge.textContent = `${filteredDivisions.length} Division${filteredDivisions.length === 1 ? '' : 's'}`;
  }

  const batchCountBadge = document.getElementById('batches-count-badge');
  if (batchCountBadge) {
    batchCountBadge.textContent = `${filteredBatches.length} Batch${filteredBatches.length === 1 ? '' : 'es'}`;
  }

  const divSubtitle = document.getElementById('divisions-table-subtitle');
  if (divSubtitle) {
    if (activeClassFilter === 'ALL') {
      divSubtitle.textContent = 'Configured divisions across FY, SY, TY, and BTECH';
    } else {
      divSubtitle.textContent = `Configured divisions for ${getYearFullName(activeClassFilter)}`;
    }
  }

  const batchSubtitle = document.getElementById('batches-table-subtitle');
  if (batchSubtitle) {
    if (activeClassFilter === 'ALL') {
      batchSubtitle.textContent = 'Laboratory batches allocated for faculty mentoring across all classes';
    } else {
      batchSubtitle.textContent = `Laboratory batches for ${getYearFullName(activeClassFilter)}${activeDivisionFilter !== 'ALL' ? ` - Division ${activeDivisionFilter}` : ''}`;
    }
  }
}

async function loadAdminDivisions() {
  const res = await API.get('/admin/divisions');
  if (!res.success) return;
  allDivisions = res.divisions;
  updateDivisionFilterOptions();
  applyBatchesAndDivisionsFilter();
}

function renderDivisionsTable(divisions) {
  const tbody = document.getElementById('divisions-tbody');
  if (!tbody) return;

  if (divisions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-6 text-center text-slate-400 text-sm">No divisions found for current filter.</td></tr>`;
    return;
  }

  const yrNames = { 1: 'FY (First Year)', 2: 'SY (Second Year)', 3: 'TY (Third Year)', 4: 'BTECH (Final Year)' };

  tbody.innerHTML = divisions.map(d => `
    <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
      <td class="px-6 py-4 font-semibold text-slate-900 text-sm">${yrNames[d.year] || `Year ${d.year}`}</td>
      <td class="px-6 py-4 text-indigo-700 font-bold text-sm">Division ${escapeHtml(d.name)}</td>
      <td class="px-6 py-4 text-slate-600 text-sm">${d.batch_count || 4} Batches (B1-B4)</td>
      <td class="px-6 py-4 text-slate-600 text-sm font-semibold">${d.student_count || 0} Students</td>
      <td class="px-6 py-4 text-sm text-right">
        <button onclick="confirmDeleteDivision(${d.id}, '${d.year}', '${escapeHtml(d.name)}')" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold rounded-md transition">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openAddDivisionModal() {
  if (activeClassFilter !== 'ALL') {
    const yrSel = document.getElementById('div-year');
    if (yrSel) yrSel.value = activeClassFilter;
  }
  const modal = document.getElementById('division-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAddDivisionModal() {
  const modal = document.getElementById('division-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleCreateDivision(e) {
  e.preventDefault();
  const year = document.getElementById('div-year').value;
  const name = document.getElementById('div-name').value.trim().toUpperCase();
  const autoBatches = document.getElementById('div-auto-batches').checked;

  const res = await API.post('/admin/divisions', {
    year: parseInt(year),
    name,
    auto_create_batches: autoBatches
  });

  if (res.success) {
    showToast(res.message || 'Division created successfully');
    closeAddDivisionModal();
    document.getElementById('create-division-form').reset();
    await loadAdminDivisions();
    await loadAdminBatches();
    updateDivisionFilterOptions();
    applyBatchesAndDivisionsFilter();
  } else {
    showToast(res.message || 'Error creating division', 'error');
  }
}

async function confirmDeleteDivision(id, year, name) {
  if (!confirm(`Are you sure you want to delete Division ${name} for Year ${year}?`)) return;

  const res = await API.delete(`/admin/divisions/${id}`);
  if (res.success) {
    showToast(`Division ${name} deleted successfully`);
    await loadAdminDivisions();
    await loadAdminBatches();
    updateDivisionFilterOptions();
    applyBatchesAndDivisionsFilter();
  } else {
    showToast(res.message || 'Error deleting division', 'error');
  }
}

// Batches List
async function loadAdminBatches() {
  const res = await API.get('/admin/batches');
  if (!res.success) {
    showToast(res.message || 'Error loading batches', 'error');
    return;
  }
  allBatches = res.batches;
  updateDivisionFilterOptions();
  applyBatchesAndDivisionsFilter();

  // Load mentors for mentor assignment dropdowns
  const mentorsRes = await API.get('/admin/mentors');
  if (mentorsRes.success) {
    allMentors = mentorsRes.mentors;
    const assignOptions = buildMentorSelectOptions(allMentors, '-- No Mentor (Unassign) --');
    const createOptions = buildMentorSelectOptions(allMentors, 'Assign Mentor (Optional)');

    const assignSelect = document.getElementById('assign-b-mentor');
    if (assignSelect) assignSelect.innerHTML = assignOptions;

    const editSelect = document.getElementById('edit-b-mentor');
    if (editSelect) editSelect.innerHTML = assignOptions;

    const createSelect = document.getElementById('modal-batch-mentor');
    if (createSelect) createSelect.innerHTML = createOptions;
  }
}

// Helper: Build mentor select dropdown options without repeating mentors, showing all batches they mentor
function buildMentorSelectOptions(mentors, placeholderText = '-- No Mentor (Unassign) --') {
  // Deduplicate mentors strictly by ID so no mentor is EVER repeated
  const uniqueMentorsMap = new Map();
  for (const m of (mentors || [])) {
    if (!uniqueMentorsMap.has(m.id)) {
      uniqueMentorsMap.set(m.id, m);
    }
  }
  const uniqueMentors = Array.from(uniqueMentorsMap.values());

  let optionsHtml = '';
  if (placeholderText) {
    optionsHtml += `<option value="">${escapeHtml(placeholderText)}</option>`;
  }

  optionsHtml += uniqueMentors.map(m => {
    // Find all batches this mentor is assigned to (cross-referencing allBatches for accuracy)
    let batchNames = [];
    if (Array.isArray(allBatches) && allBatches.length > 0) {
      batchNames = allBatches.filter(b => String(b.mentor_id) === String(m.id)).map(b => b.name);
    }
    if (batchNames.length === 0) {
      if (Array.isArray(m.batches) && m.batches.length > 0) {
        batchNames = m.batches.map(b => b.name);
      } else if (Array.isArray(m.batch_names) && m.batch_names.length > 0) {
        batchNames = m.batch_names;
      } else if (m.batch_name) {
        batchNames = m.batch_name.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const batchesInfo = batchNames.length > 0
      ? ` — [Batches: ${batchNames.join(', ')}]`
      : ' — [No Batches Assigned]';

    return `<option value="${m.id}">${escapeHtml(m.name)} (${escapeHtml(m.mentor_code)})${escapeHtml(batchesInfo)}</option>`;
  }).join('');

  return optionsHtml;
}

function renderBatchesTable(batches, tbodyId, showActions = true) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const colSpan = showActions ? 6 : 5;
  if (batches.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${colSpan}" class="px-6 py-8 text-center text-slate-400 text-sm">No batches found matching current class filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = batches.map(b => `
    <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
      <td class="px-6 py-4 font-semibold text-slate-900 text-sm">${escapeHtml(b.name)}</td>
      <td class="px-6 py-4 text-indigo-700 text-sm font-medium">AI & DS</td>
      <td class="px-6 py-4 text-slate-600 text-sm">
        ${b.year ? `${getYearDisplay(b.year)}${b.division ? ` - Div ${b.division}` : ''}` : 'General'}
      </td>
      <td class="px-6 py-4 text-slate-600 text-sm">
        ${b.mentor_name 
          ? `<span class="inline-flex items-center font-medium text-slate-800"><span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>${escapeHtml(b.mentor_name)} (${escapeHtml(b.mentor_code || '')})</span>` 
          : '<span class="inline-flex items-center text-amber-600 font-medium text-xs"><span class="w-2 h-2 rounded-full bg-amber-400 mr-2"></span>Unassigned</span>'}
      </td>
      <td class="px-6 py-4 text-slate-600 text-sm font-semibold">${b.student_count || 0} Students</td>
      ${showActions ? `
      <td class="px-6 py-4 text-sm text-right space-x-1">
        <button onclick="openAssignMentorModal(${b.id})" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 transition">Assign Mentor</button>
        <button onclick="openEditBatchModal(${b.id})" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition">Edit</button>
        <button onclick="confirmDeleteBatch(${b.id}, '${escapeHtml(b.name)}')" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold rounded-md transition">Delete</button>
      </td>
      ` : ''}
    </tr>
  `).join('');
}

function bindBatchSearch() {
  const searchInput = document.getElementById('batch-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyBatchesAndDivisionsFilter();
    });
  }
}

function openAssignMentorModal(batchId) {
  const batch = allBatches.find(b => b.id === batchId);
  if (!batch) return;

  const modal = document.getElementById('assign-mentor-modal');
  if (!modal) return;

  document.getElementById('assign-b-id').value = batch.id;
  document.getElementById('assign-b-name').textContent = batch.name;

  const assignSelect = document.getElementById('assign-b-mentor');
  if (assignSelect) {
    assignSelect.innerHTML = buildMentorSelectOptions(allMentors, '-- No Mentor (Unassign) --');
    assignSelect.value = batch.mentor_id || '';
  }

  modal.classList.remove('hidden');
}

function closeAssignMentorModal() {
  const modal = document.getElementById('assign-mentor-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleAssignMentor(e) {
  e.preventDefault();
  const batchId = document.getElementById('assign-b-id').value;
  const mentorId = document.getElementById('assign-b-mentor').value;

  const res = await API.post(`/admin/batches/${batchId}/assign-mentor`, {
    mentor_id: mentorId ? parseInt(mentorId) : null
  });

  if (res.success) {
    showToast(res.message || 'Mentor assignment updated successfully');
    closeAssignMentorModal();
    await loadAdminBatches();
  } else {
    showToast(res.message || 'Error assigning mentor', 'error');
  }
}

function openEditBatchModal(batchId) {
  const batch = allBatches.find(b => b.id === batchId);
  if (!batch) return;

  const modal = document.getElementById('edit-batch-modal');
  if (!modal) return;

  document.getElementById('edit-b-id').value = batch.id;
  document.getElementById('edit-b-name').value = batch.name;
  document.getElementById('edit-b-year').value = batch.year || 1;
  document.getElementById('edit-b-div').value = batch.division || '';

  const editSelect = document.getElementById('edit-b-mentor');
  if (editSelect) {
    editSelect.innerHTML = buildMentorSelectOptions(allMentors, '-- No Mentor (Unassign) --');
    editSelect.value = batch.mentor_id || '';
  }

  modal.classList.remove('hidden');
}

function closeEditBatchModal() {
  const modal = document.getElementById('edit-batch-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleUpdateBatch(e) {
  e.preventDefault();
  const batchId = document.getElementById('edit-b-id').value;
  const mentorVal = document.getElementById('edit-b-mentor')?.value;
  const body = {
    name: document.getElementById('edit-b-name').value.trim(),
    year: parseInt(document.getElementById('edit-b-year').value),
    division: document.getElementById('edit-b-div').value.trim().toUpperCase(),
    mentor_id: mentorVal ? parseInt(mentorVal) : null
  };

  const res = await API.put(`/admin/batches/${batchId}`, body);
  if (res.success) {
    showToast('Batch updated successfully');
    closeEditBatchModal();
    await loadAdminBatches();
  } else {
    showToast(res.message || 'Error updating batch', 'error');
  }
}

async function confirmDeleteBatch(batchId, batchName) {
  if (!confirm(`Are you sure you want to delete batch "${batchName}"?\nEnrolled students will be set to unassigned.`)) {
    return;
  }

  const res = await API.delete(`/admin/batches/${batchId}`);
  if (res.success) {
    showToast(`Batch "${batchName}" deleted successfully`);
    await loadAdminBatches();
  } else {
    showToast(res.message || 'Error deleting batch', 'error');
  }
}

// ==========================================
// UTILITY HELPERS
// ==========================================
function getRiskBadgeHTML(level) {
  if (level === 'Bright') return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-bright">Bright</span>`;
  if (level === 'Average') return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-average">Average</span>`;
  if (level === 'Weak') return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-weak">Weak</span>`;
  return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold badge-pending">Pending</span>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
