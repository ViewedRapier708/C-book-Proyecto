// controllers/ControladorRecursos.js
const modelosRecursos = require('../models/ModeloRecursos');

async function obtenerRecursosPorTipo(req, res) {
  // <-- ahora leemos la query‑string, no el cuerpo
  const { tipo } = req.query;

  if (!tipo) {
    return res.status(400).json({ error: 'Falta el parámetro tipo' });
  }

  try {
    let data;                   // aquí guardaremos la lista de recursos
    switch (tipo) {
      case 'computadoras':
        ({ error, data } = await modelosRecursos.obtenerComputadoras());
        break;
      case 'restiradores':      // <-- verifica el nombre correcto de tu modelo
        ({ error, data } = await modelosRecursos.obtenerRestiradores());
        break;
      case 'libros':
        ({ error, data } = await modelosRecursos.obtenerLibros());
        break;
      default:
        return res.status(400).json({ error: `Tipo desconocido: ${tipo}` });
    }

    if (error) throw error;    // el modelo devolvió un error interno
    // Enviamos la respuesta con la clave que el front‑end espera: data
    return res.status(200).json({ data });
  } catch (err) {
    console.error('Error en obtenerRecursosPorTipo:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { obtenerRecursosPorTipo };
