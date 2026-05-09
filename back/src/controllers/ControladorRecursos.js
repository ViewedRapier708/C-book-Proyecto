// controllers/ControladorRecursos.js
const modelosRecursos = require('../models/ModeloRecursos.js');
async function obtenerRecursosPorTipo(req, res) {
  const { tipo } = req.query;
  if (!tipo) {
    return res.status(400).json({ success: false, message: 'Falta el parámetro tipo' });
  }
  try {
const recursos = await modelosRecursos.ObtenerRecurzos(tipo);
    return res.status(200).json({ success: true, data: recursos });
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