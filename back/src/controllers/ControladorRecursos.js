// controllers/ControladorRecursos.js
const modelosRecursos = require('../models/ModeloRecursos.js');

async function obtenerRecursosPorTipo(req, res) {
  const { tipo } = req.query;
  const page = req.query.page !== undefined ? (Number.parseInt(req.query.page, 10) || 1) : 1;
  const limit = req.query.limit !== undefined ? (Number.parseInt(req.query.limit, 10) || 0) : 0;

  if (!tipo) {
    return res.status(400).json({ success: false, message: 'Falta el parametro tipo' });
  }

  try {
    const recursos = await modelosRecursos.ObtenerRecurzos(tipo, { page, limit });

    if (recursos?.error) {
      return res.status(400).json({ success: false, message: recursos.error });
    }

    const data = Array.isArray(recursos) ? recursos : (recursos?.data || []);
    const total = Array.isArray(recursos) ? data.length : (recursos?.total ?? data.length);

    return res.status(200).json({ success: true, data, total });
  } catch (err) {
    console.error('Error en obtenerRecursosPorTipo:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

async function obtenerLibrosMasSolicitados(req, res) {
  try {
    const data = await modelosRecursos.librosMasSolicitados(5);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Error en obtenerLibrosMasSolicitados:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

module.exports = { obtenerRecursosPorTipo, obtenerLibrosMasSolicitados };
