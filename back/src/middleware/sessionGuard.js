const { refrescarSesionSupabase } = require('../models/ModeloUsuario');

const SESSION_REFRESH_THRESHOLD_MS = 60000;

module.exports = async function sessionGuard(req, res, next) {
  console.log("sessionGuard - Inicio de verificación de sesión");
  try {
      const sessionUser = req.session.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'No hay sesión activa' });
    }

    if (!sessionUser.tokens?.accessToken) {
      console.log("sessionGuard - Sesión inválida: falta accessToken");
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    if (needsRefresh(sessionUser.tokens.expiresAt)) {
      console.log("sessionGuard - Refrescando sesión para usuario:", sessionUser.boleta);
      const refreshed = await refrescarSesionSupabase(sessionUser.tokens.refreshToken);

      if (!refreshed.success) {
        console.log("sessionGuard - No se pudo refrescar la sesión, cerrando sesión");
        req.session.user = null;
        return res.status(401).json({ error: 'Sesión expirada' });
      }

      sessionUser.tokens = {
        accessToken: refreshed.session.access_token,
        refreshToken: refreshed.session.refresh_token || sessionUser.tokens.refreshToken,
        expiresAt: refreshed.session.expires_at ? refreshed.session.expires_at * 1000 : null,
        expiresIn: refreshed.session.expires_in
      };

      req.session.user = sessionUser;
      await persistSession(req);
    }

    res.locals.supabaseAccessToken = sessionUser.tokens.accessToken;
    res.locals.supabaseUserId = sessionUser.supabaseUserId;
    next();
  } catch (err) {
    console.error('Error en sessionGuard:', err);
    return res.status(500).json({ error: 'Error validando sesión' });
  }
};

function needsRefresh(expiresAt) {
  console.log("sessionGuard - Verificando si necesita refrescar sesión, expiresAt:", expiresAt);
  if (!expiresAt) {
    return false;
  }
  return expiresAt - Date.now() <= SESSION_REFRESH_THRESHOLD_MS;
}

function persistSession(req) {
  console.log("sessionGuard - Persistiendo sesión actualizada");
  return new Promise((resolve, reject) => {
    req.session.save(err => (err ? reject(err) : resolve()));
  });
}
