import { api } from './client';

function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'Todos') {
      qs.set(key, value);
    }
  });
  const text = qs.toString();
  return text ? `?${text}` : '';
}

export const soporteApi = {
  getTypes: () => api.get('/soporte/tipos'),
  createTicket: (data) => api.post('/soporte/tickets', data),
  createPublicTicket: (data) => api.post('/soporte/public/tickets', data),
  getTickets: (params) => api.get(`/soporte/tickets${toQuery(params)}`),
  getMyTickets: (params) => api.get(`/soporte/tickets${toQuery({ ...params, mine: 'true' })}`),
  getTicket: (id) => api.get(`/soporte/tickets/${encodeURIComponent(id)}`),
  takeTicket: (id) => api.post(`/soporte/tickets/${encodeURIComponent(id)}/tomar`, {}),
  changeStatus: (id, estado, comentario) =>
    api.patch(`/soporte/tickets/${encodeURIComponent(id)}/estado`, { estado, comentario }),
  addComment: (id, body, isInternal = false) =>
    api.post(`/soporte/tickets/${encodeURIComponent(id)}/comentarios`, { body, isInternal }),
  logTime: (id, minutes, note) =>
    api.post(`/soporte/tickets/${encodeURIComponent(id)}/tiempo`, { minutes, note }),
  dashboard: () => api.get('/soporte/dashboard'),
  config: () => api.get('/soporte/config'),
};
