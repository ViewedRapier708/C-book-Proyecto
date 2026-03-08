const ModeloAnalytics = require('../models/ModeloAnalytics');

async function obtenerEstadisticas(req, res) {
  try {
    const stats = await ModeloAnalytics.obtenerEstadisticasGenerales();
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error en estadísticas:', error.message);
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

async function obtenerTendencias(req, res) {
  try {
    const tendencias = await ModeloAnalytics.obtenerTendencias();
    return res.json({ success: true, data: tendencias });
  } catch (error) {
    console.error('Error en tendencias:', error.message);
    return res.status(500).json({ error: 'Error al obtener tendencias' });
  }
}

async function obtenerActividad(req, res) {
  try {
    const limite = parseInt(req.query.limite) || 20;
    const actividad = await ModeloAnalytics.obtenerActividadReciente(limite);
    return res.json({ success: true, data: actividad });
  } catch (error) {
    console.error('Error en actividad:', error.message);
    return res.status(500).json({ error: 'Error al obtener actividad' });
  }
}

module.exports = {
  obtenerEstadisticas,
  obtenerTendencias,
  obtenerActividad,
};
