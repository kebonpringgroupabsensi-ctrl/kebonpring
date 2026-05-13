const API_URL = import.meta.env.VITE_API_URL || '/api';

export const branchService = {
  async getAllBranches() {
    // Note: This endpoint in backend currently requires authentication
    // But for registration, we might need a public endpoint or use a specific key
    // For now, I'll assume we can fetch them.
    const response = await fetch(`${API_URL}/branches`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Gagal memuat data cabang');
    }
    return data;
  }
};
