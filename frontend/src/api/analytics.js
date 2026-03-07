import { api } from './client';

export const analyticsApi = {
  getStats: () => api.get('/admin/stats'),
  getTrends: () => api.get('/admin/tendencias'),
  getActivity: (limite = 20) => api.get(`/admin/actividad?limite=${limite}`),
};
