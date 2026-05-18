import { api } from "./client";

export const authApi = {
  login: (boleta, password) => api.post("/login", { boleta, password }),
  loginSupport: (identifier, password) => api.post("/soporte/login", { boleta: identifier, password }),
  register: (boleta, correo, password, confPsw) =>
    api.post("/registro", { boleta, correo, password, confPsw }),
  verifyEmail: (boleta, correo) => api.post("/verificar", { boleta, correo }),
  getSession: () => api.get("/session"),
  logout: () => api.post("/logout"),
  obtenerCorreo: (boleta) => api.post("/obtener-correo", { boleta }),
  forgotPassword: (boleta) => api.post("/forgot-password", { boleta }),
  resetPassword: (token, newPassword, confPassword) =>
    api.post("/reset-password", {
      access_token: token,
      newPassword,
      confPassword,
    }),
  updateAccount: (boleta, TipoDatoACambiar, value) =>
    api.patch("/CuentaUpdate", {
      boleta,
      TipoDatoACambiar,
      ...(TipoDatoACambiar === "correo"
        ? { nuevoCorreo: value }
        : { nuevaContraseña: value }),
    }),
  changePassword: (correo, currentPassword, newPassword) =>
    api.post("/cambiar-contrasena", { correo, currentPassword, newPassword }),
};
