// Auth guard & session router
document.addEventListener('DOMContentLoaded', () => {
  const user = API.getUser();
  const token = API.getToken();
  const path = window.location.pathname;

  const isLoginPage = path.endsWith('login.html') || path === '/' || path.endsWith('index.html');

  if (!token || !user) {
    if (!isLoginPage) {
      window.location.href = '/login.html';
    }
    return;
  }

  // If already logged in and on login page, redirect to role dashboard
  if (isLoginPage) {
    redirectToDashboard(user.role);
    return;
  }

  // Role access check
  if (path.includes('/admin/') && user.role !== 'ADMIN') {
    redirectToDashboard(user.role);
  } else if (path.includes('/mentor/') && user.role !== 'MENTOR') {
    redirectToDashboard(user.role);
  } else if (path.includes('/student/') && user.role !== 'STUDENT') {
    redirectToDashboard(user.role);
  }

  // Populate user header elements if present
  const userNameElem = document.getElementById('header-user-name');
  const userRoleElem = document.getElementById('header-user-role');
  if (userNameElem) userNameElem.textContent = user.name || user.identifier;
  if (userRoleElem) userRoleElem.textContent = user.role;

  // Bind logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      API.clearAuth();
      window.location.href = '/login.html';
    });
  }
});

function redirectToDashboard(role) {
  if (role === 'ADMIN') {
    window.location.href = '/admin/dashboard.html';
  } else if (role === 'MENTOR') {
    window.location.href = '/mentor/dashboard.html';
  } else if (role === 'STUDENT') {
    window.location.href = '/student/dashboard.html';
  } else {
    window.location.href = '/login.html';
  }
}
