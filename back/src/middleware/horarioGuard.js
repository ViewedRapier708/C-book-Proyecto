const { obtenerFechaMexico } = require('../utils/fechaUtils');

function horarioGuard(req, res, next) {
  const ahora = obtenerFechaMexico();
  const hora = ahora.getHours();

  if (hora >= 8 && hora < 20) {
    return next();
  }

  return res.status(403).json({
    error: 'El módulo de alumnos está disponible únicamente de 8:00 a 20:00 horas (CDMX). Intenta de nuevo en ese horario.'
  });
}

module.exports = horarioGuard;
