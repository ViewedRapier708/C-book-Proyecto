const { CrearSolicitud, CancelarSolicitud, getSolicitudes } = require("../models/ModeloSolicitudes");

const tipos = ['computadora', 'restirador', 'libro'];

/**
 * Crea una solicitud de recurso.
 * Espera en el body: { tipo, boleta, idRecurso }
 * - tipo: 'computadora' | 'restirador' | 'libro'
 * - boleta: string de 10 dígitos
 * - idRecurso: entero positivo (id interno del recurso)
 */
async function crearSolicitud(req,res) {
    const { tipo ,boleta,idRecurso } = req.body;
    console.log("Datos recibidos para crear solicitud:", { tipo, boleta, idRecurso }); //debug
    const regularExpression = /^[0-9 ]{10}$/;
    const regularExpressiontipo = /^[a-zA-Z]+$/;

    
    if (!tipo || !boleta || !idRecurso) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }
    if (!regularExpression.test(boleta)) {
        return res.status(400).json({ success: false, message: 'La boleta debe ser un número válido de longitud 10' });
    }else if (!regularExpressiontipo.test(tipo)) {
        return res.status(400).json({ success: false, message: 'El tipo de solicitud debe contener solo letras' });
    }else if (!Number.isInteger(idRecurso) || idRecurso <= 0) {
        return res.status(400).json({ success: false, message: 'El ID del recurso debe ser un número entero positivo' });
    }
    if (!tipos.includes(tipo)) {
        return res.status(400).json({ success: false, message: 'Tipo de solicitud inválido' });
    }
    await CrearSolicitud(tipo, boleta, idRecurso)
        .then((resultado) => {
            if (resultado.success) {
                return res.status(201).json({ success: true, message: 'Solicitud creada exitosamente' });
            } else {
                return res.status(500).json({ success: false, message: resultado.message || 'Error al crear la solicitud' });
            }
        })
        .catch((error) => {
            console.error('Error al crear la solicitud:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        });

}

/**
 * Cancela una solicitud por tipo e id.
 * Requiere sesión iniciada (boleta en req.session.user.boleta).
 * Ruta esperada: DELETE /auth/solicitud/:tipo/:id
 */
async function cancelarSolicitud(req,res) {
    const { tipo, id } = req.params;
    const idSolicitud = Number(id);

    if (!idSolicitud || Number.isNaN(idSolicitud)) {
        return res.status(400).json({ success: false, message: 'ID de solicitud inválido' });
    }

    if (!tipo || !tipos.includes(tipo)) {
        return res.status(400).json({ success: false, message: 'Tipo de solicitud inválido' });
    }

    const boleta = req.session?.user?.boleta;
    if (!boleta) {
        return res.status(401).json({ success: false, message: 'Sesión no iniciada' });
    }

    const resultado = await CancelarSolicitud(tipo, idSolicitud, boleta);
    if (resultado.success) {
        return res.status(200).json({ success: true, message: 'Solicitud cancelada exitosamente' });
    }

    return res.status(500).json({ success: false, message: resultado.error || 'Error al cancelar la solicitud' });
}


/**
 * Obtiene las solicitudes del usuario autenticado.
 * La boleta se toma de la sesión, no del querystring.
 * Ruta esperada: GET /auth/recursos/usuario
 */
async function obtencionSolicitudesUsuario(req,res) {
    const boleta = req.session?.user?.boleta;
    if (!boleta) {
        return res.status(401).json({ success: false, message: 'Sesión no iniciada' });
    }

    console.log("Obteniendo solicitudes para boleta:", boleta); //debug
    try {
        const resultado = await getSolicitudes(boleta);
        console.log('[Solicitudes] Resultado getSolicitudes:', {
            success: resultado?.success,
            total: Array.isArray(resultado?.data) ? resultado.data.length : 0,
            preview: Array.isArray(resultado?.data) ? resultado.data.slice(0, 5) : null
        });
        if (!resultado.success) {
            return res.status(500).json({ success: false, error: resultado.error || 'Error al obtener solicitudes' });
        }
        return res.status(200).json({ success: true, data: resultado.data });
    } catch (err) {
        console.error('Error en obtencionSolicitudesUsuario:', err);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }

}

module.exports = { crearSolicitud, cancelarSolicitud, obtencionSolicitudesUsuario };