import { api } from './client';

export const recursosApi = {
  getByType: (tipo) => api.get(`/recursos?tipo=${tipo}`),
};

export const solicitudesApi = {
  create: (tipo, boleta, idRecurso) =>
    api.post('/solicitud', { tipo, boleta, idRecurso }),
  cancel: (tipo, id) => api.delete(`/solicitud/${tipo}/${id}`),
  cancelAll: (tipo) => api.delete(`/solicitud/${tipo}/all`),
  getUserSolicitudes: () => api.get('/recursos/usuario'),
};
