import { AUTH_UNAUTHORIZED_EVENT, api, authUrl } from './client';

export const adminApi = {
  // Materials CRUD
  getMaterials: (tipo, params = {}) => api.get(`/admin/materiales/${tipo}`, { params }),
  createBook: (data) => api.post('/admin/libros', data),
  updateBook: (data) => api.put('/admin/libros', data),
  deleteMaterial: (tipo, id) => api.delete(`/admin/materiales/${tipo}/${id}`),
  confirmBulkLibros: (data) => api.post('/admin/libros/bulk', data),
  previewBulkLibros: async (formData) => {
    const res = await fetch(authUrl('/admin/libros/preview'), {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
      }
      throw new Error(data.error || data.message || `Error ${res.status}`);
    }
    return data;
  },

  // Users
  getUsers: (params = {}) => api.get('/admin/usuarios', { params }),
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
    const res = await fetch(authUrl('/admin/boletas/preview'), {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
      }
      throw new Error(data.error || data.message || `Error ${res.status}`);
    }
    return data;
  },
};
