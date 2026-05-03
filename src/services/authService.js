const API_URL = import.meta.env.VITE_API_URL;

export const authService = {
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Gagal login');
    }

    // Store session and user data
    localStorage.setItem('session', JSON.stringify(data.session));
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  },

  async register(formData) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Gagal registrasi');
    }

    return data;
  },

  logout() {
    localStorage.removeItem('session');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getSession() {
    const session = localStorage.getItem('session');
    return session ? JSON.parse(session) : null;
  }
};
