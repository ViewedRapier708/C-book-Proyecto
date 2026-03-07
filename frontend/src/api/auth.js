import { api } from './client';

export const authApi = {
  login: (boleta, password) => api.post('/login', { boleta, password }),
  register: (boleta, correo, password, confPsw) =>
    api.post('/registro', { boleta, correo, password, confPsw }),
  verifyEmail: (boleta, correo) => api.post('/verificar', { boleta, correo }),
  getSession: () => api.get('/session'),
  logout: () => api.post('/logout'),
};
