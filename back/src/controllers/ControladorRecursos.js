// controllers/ControladorRecursos.js
const modelosRecursos = require('../models/ModeloRecursos');

async function obtenerRecursosPorTipo(req, res) {
  // <-- ahora leemos la query‑string, no el cuerpo
  const { tipo } = req.query;
  if (!tipo) {
    return res.status(400).json({ success: false, message: 'Falta el parámetro tipo' });
  }
  try {
    const recursos = await modelosRecursos.obtenerRecursosPorTipo(tipo);
    return res.status(200).json({ success: true, data: recursos });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
  
}

module.exports = { obtenerRecursosPorTipo };
