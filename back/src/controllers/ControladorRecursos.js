async function obtenerRecursosPorTipo(req, res) {
    const { obtenerRecursosPorTipo: obtenerRecursos } = require('../models/ModeloRecursos.js');
    const { error, data } = await obtenerRecursos();
    if (error) {
        return res.status(500).json({ error: 'Error al obtener los recursos por tipo' });
    }
    return res.status(200).json({ recursos: data });
}

module.exports = { obtenerRecursosPorTipo };