// ============================================================
// api.js — Centralized fetch wrapper with automatic auth token
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  try {
    const session = localStorage.getItem('session');
    if (!session) return null;
    return JSON.parse(session)?.access_token || null;
  } catch {
    return null;
  }
}

export function getUser() {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.error('Unauthorized request to:', path, '- Logging out.');
    // Auto logout on unauthorized, but avoid redirect loops
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('session');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
    }
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

export const api = {
  get: (path, params) => {
    const url = params ? `${path}?${new URLSearchParams(params)}` : path;
    return request(url, { method: 'GET' });
  },
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path, body) => request(path, { 
    method: 'DELETE', 
    body: body ? JSON.stringify(body) : undefined 
  }),
};
