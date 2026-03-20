const { refrescarSesionSupabase } = require('../models/ModeloUsuario');
const jwt = require('jsonwebtoken');

const SESSION_REFRESH_THRESHOLD_MS = 60000;

module.exports = async function sessionGuard(req, res, next) {
  try {
    const token = req.cookies.app_session;
    if (!token) {
      return res.status(401).json({ error: 'No hay sesión activa' });
    }

    const secret = req.app.locals.sessionSecret || process.env.SESSION_SECRET || 'dev_session_secret_change_me';
    let sessionUser;
    
    try {
      sessionUser = jwt.verify(token, secret);
    } catch (e) {
      return res.status(401).json({ error: 'Sesión inválida o expirada' });
    }

    if (!sessionUser.tokens?.accessToken) {
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    let tokenUpdated = false;

    if (needsRefresh(sessionUser.tokens.expiresAt)) {
      const refreshed = await refrescarSesionSupabase(sessionUser.tokens.refreshToken);

      if (!refreshed.success) {
        res.clearCookie('app_session', req.app.locals.cookieSettings);
        return res.status(401).json({ error: 'Sesión expirada' });
      }

      sessionUser.tokens = {
        accessToken: refreshed.session.access_token,
        refreshToken: refreshed.session.refresh_token || sessionUser.tokens.refreshToken,
        expiresAt: refreshed.session.expires_at ? refreshed.session.expires_at * 1000 : null,
        expiresIn: refreshed.session.expires_in
      };

      // Si mutamos el sessionUser (token update), necesitamos emitir nueva cookie
      tokenUpdated = true;
    }

    // Mockear req.session.user para retrocompatibilidad con los controladores viejos
    req.session = { user: sessionUser };

    if (tokenUpdated) {
      // Remover "iat" y "exp" para que jwt.sign genere nuevos
      const { iat, exp, ...payload } = sessionUser;
      const newToken = jwt.sign(payload, secret, { expiresIn: '2h' });
      res.cookie('app_session', newToken, req.app.locals.cookieSettings);
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
  if (!expiresAt) {
    return false;
  }
  return expiresAt - Date.now() <= SESSION_REFRESH_THRESHOLD_MS;
}
