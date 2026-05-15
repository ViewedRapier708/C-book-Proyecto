import { api } from './client';

const API_BASE = (import.meta.env.VITE_API_URL || '').trim();

export const adminApi = {
  // Materials CRUD
  getMaterials: (tipo) => api.get(`/admin/materiales/${tipo}`),
  createBook: (data) => api.post('/admin/libros', data),
  updateBook: (data) => api.put('/admin/libros', data),
  deleteMaterial: (tipo, id) => api.delete(`/admin/materiales/${tipo}/${id}`),

  // Users
  getUsers: () => api.get('/admin/usuarios'),
  enableDocumentation: (id) => api.put(`/admin/usuarios/${id}/habilitar`),

  // Book solicitudes
  getBookSolicitudes: () => api.get('/admin/solicitudes/libros'),
  manageBookSolicitud: (id, body) => api.post(`/admin/solicitudes/libros/${id}/gestionar`, body),
  registerDelivery: (id) => api.post(`/admin/solicitudes/libros/${id}/entregar`),

  // Loans
  getBookLoans: () => api.get('/admin/prestamos/libros'),
  markLoanReturned: (id) => api.post(`/admin/prestamos/libros/${id}/devolver`),

  // Boletas (catálogo de alumnos)
  getBoletas: () => api.get('/admin/boletas'),
  createBoleta: (data) => api.post('/admin/boletas', data),
  updateBoleta: (boleta, data) => api.put(`/admin/boletas/${boleta}`, data),
  deleteBoleta: (boleta) => api.delete(`/admin/boletas/${boleta}`),
  confirmBulkBoletas: (data) => api.post('/admin/boletas/bulk', data),
  previewBulkBoletas: async (formData) => {
    const res = await fetch(`${API_BASE}/auth/admin/boletas/preview`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`);
    return data;
  },
};
