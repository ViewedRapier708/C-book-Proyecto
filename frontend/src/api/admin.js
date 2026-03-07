import { api } from './client';

export const adminApi = {
  // Materials CRUD
  getMaterials: (tipo) => api.get(`/admin/materiales/${tipo}`),
  createBook: (data) => api.post('/admin/libros', data),
  createComputer: (data) => api.post('/admin/computadoras', data),
  createRestirador: (data) => api.post('/admin/restiradores', data),
  updateBook: (data) => api.put('/admin/libros', data),
  updateComputer: (data) => api.put('/admin/computadoras', data),
  updateRestirador: (data) => api.put('/admin/restiradores', data),
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
};
