import { api } from './client';

export const recursosApi = {
  getByType: (tipo, params = {}) => api.get('/recursos', { params: { tipo, ...params } }),
  getMasSolicitados: () => api.get('/libros/mas-solicitados'),
};

export const solicitudesApi = {
  create: (tipo, boleta, idRecurso) =>
    api.post('/solicitud', { tipo, boleta, idRecurso }),
  cancel: (tipo, id) => api.delete(`/solicitud/${tipo}/${id}`),
  getUserSolicitudes: () => api.get('/recursos/usuario'),
};
