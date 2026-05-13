const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  },

  async refreshToken() {
    const session = this.getSession();
    if (!session || !session.refresh_token) return null;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Update storage
      localStorage.setItem('session', JSON.stringify(data.session));
      // Note: We don't necessarily need to update the 'user' if it hasn't changed,
      // but Supabase returns the user object in the refresh response.
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data.session.access_token;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      this.logout();
      return null;
    }
  }
};
