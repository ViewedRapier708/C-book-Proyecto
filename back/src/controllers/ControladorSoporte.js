const soporte = require('../models/ModeloSoporte');

function getUser(req) {
  return req.session?.user || {};
}

function getPublicUser(req) {
  const { correo, email, nombre } = req.body || {};
  return {
    email: correo || email,
    correo: correo || email,
    nombre: nombre || correo || email,
    rol: 'externo',
  };
}

function handleError(res, err) {
  console.error('[ControladorSoporte]', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Error interno del modulo de soporte',
  });
}

async function listarTipos(req, res) {
  try {
    console.log('[SoporteAPI] GET tipos solicitado');
    const tipos = await soporte.listarTipos();
    console.log('[SoporteAPI] GET tipos respuesta', { rows: tipos.length });
    return res.json({ tipos });
  } catch (err) {
    return handleError(res, err);
  }
}

async function crearTicket(req, res) {
  try {
    console.log('[SoporteAPI] POST ticket autenticado', {
      tipo: req.body?.tipo,
      modulo: req.body?.modulo,
      prioridad: req.body?.prioridad,
      actor: getUser(req)?.boleta || getUser(req)?.email,
    });
    const ticket = await soporte.crearTicket(req.body, getUser(req));
    return res.status(201).json({ ticket });
  } catch (err) {
    return handleError(res, err);
  }
}

async function crearTicketPublico(req, res) {
  try {
    console.log('[SoporteAPI] POST ticket publico', {
      tipo: req.body?.tipo,
      modulo: req.body?.modulo,
      prioridad: req.body?.prioridad,
      correo: req.body?.correo || req.body?.email,
    });
    const ticket = await soporte.crearTicket(req.body, getPublicUser(req));
    return res.status(201).json({ ticket });
  } catch (err) {
    return handleError(res, err);
  }
}

async function listarTickets(req, res) {
  try {
    console.log('[SoporteAPI] GET tickets', { query: req.query, actor: getUser(req)?.boleta || getUser(req)?.email });
    const result = await soporte.listarTickets(req.query, getUser(req));
    console.log('[SoporteAPI] GET tickets respuesta', { rows: result.tickets.length, total: result.total });
    return res.json(result);
  } catch (err) {
    return handleError(res, err);
  }
}

async function obtenerTicket(req, res) {
  try {
    console.log('[SoporteAPI] GET ticket detalle', { id: req.params.id, actor: getUser(req)?.boleta || getUser(req)?.email });
    const ticket = await soporte.obtenerTicket(req.params.id, getUser(req));
    return res.json({ ticket });
  } catch (err) {
    return handleError(res, err);
  }
}

async function tomarTicket(req, res) {
  try {
    const ticket = await soporte.tomarTicket(req.params.id, getUser(req));
    return res.json({ ticket });
  } catch (err) {
    return handleError(res, err);
  }
}

async function cambiarEstado(req, res) {
  try {
    const ticket = await soporte.cambiarEstado(req.params.id, req.body.estado, getUser(req), req.body.comentario);
    return res.json({ ticket });
  } catch (err) {
    return handleError(res, err);
  }
}

async function agregarComentario(req, res) {
  try {
    const ticket = await soporte.agregarComentario(req.params.id, req.body.body, req.body.isInternal, getUser(req));
    return res.json({ ticket });
  } catch (err) {
    return handleError(res, err);
  }
}

async function registrarTiempo(req, res) {
  try {
    const ticket = await soporte.registrarTiempo(req.params.id, req.body.minutes, req.body.note, getUser(req));
    return res.json({ ticket });
  } catch (err) {
    return handleError(res, err);
  }
}

async function dashboard(req, res) {
  try {
    console.log('[SoporteAPI] GET dashboard', { actor: getUser(req)?.boleta || getUser(req)?.email });
    const data = await soporte.dashboard(getUser(req));
    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
}

async function configuracion(req, res) {
  try {
    console.log('[SoporteAPI] GET configuracion', { actor: getUser(req)?.boleta || getUser(req)?.email });
    const data = await soporte.configuracion(getUser(req));
    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
}

module.exports = {
  listarTipos,
  crearTicket,
  crearTicketPublico,
  listarTickets,
  obtenerTicket,
  tomarTicket,
  cambiarEstado,
  agregarComentario,
  registrarTiempo,
  dashboard,
  configuracion,
};
