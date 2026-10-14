// API Client Helper for AI-Driven Mentor-Mentee Management System
const API_BASE = '/api';

const API = {
  getToken: () => localStorage.getItem('mms_token'),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('mms_user'));
    } catch (e) {
      return null;
    }
  },
  setAuth: (token, user) => {
    localStorage.setItem('mms_token', token);
    localStorage.setItem('mms_user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('mms_token');
    localStorage.removeItem('mms_user');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        this.clearAuth();
        if (!window.location.pathname.endsWith('login.html')) {
          window.location.href = '/login.html?session=expired';
        }
        return { success: false, message: 'Session expired. Please log in again.' };
      }

      if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        return {
          success: false,
          status: 403,
          message: data.message || 'Access forbidden: Insufficient role permissions.'
        };
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      return { success: false, message: 'Network or server error. Please try again.' };
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
};

