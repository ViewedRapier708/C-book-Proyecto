const { CrearSolicitud, CancelarSolicitud, getSolicitudes } = require("../models/ModeloSolicitudes");
const { enviarCorreo, plantillaCorreo } = require("../utils/servicioCorreo");
const { getClient } = require("../config/db");

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
        .then(async (resultado) => {
            if (resultado.success) {
                // Enviar correo en segundo plano (no bloquea la respuesta)
                const supabase = getClient();
                (async () => {
                    try {
                        // Obtener datos del alumno (correo + nombre + grupo)
                        const { data: alumno } = await supabase
                            .from('usuarios_web_movil')
                            .select('correo, boletas(nombre, Grupo)')
                            .eq('boleta', boleta)
                            .single();

                        if (!alumno?.correo) return;

                        const nombre = alumno.boletas?.nombre || '-';
                        const grupo = alumno.boletas?.Grupo || '-';

                        // Obtener detalles del recurso según tipo
                        let detalles = [];
                        if (tipo === 'libro') {
                            const { data: ej } = await supabase
                                .from('ejemplares')
                                .select('numero_ejemplar, codigo_barras, libros(titulo, autor, clasificacion)')
                                .eq('id', idRecurso)
                                .single();
                            if (ej) {
                                detalles = [
                                    { label: 'Título', value: ej.libros?.titulo || '-' },
                                    { label: 'Autor', value: ej.libros?.autor || '-' },
                                    { label: 'Clasificación', value: ej.libros?.clasificacion || '-' },
                                    { label: 'Ejemplar #', value: String(ej.numero_ejemplar ?? '-') },
                                ];
                            }
                        } else if (tipo === 'computadora') {
                            const { data: pc } = await supabase
                                .from('computadoras')
                                .select('no_computadora')
                                .eq('id', idRecurso)
                                .single();
                            if (pc) {
                                detalles = [{ label: 'Computadora #', value: String(pc.no_computadora) }];
                            }
                        } else if (tipo === 'restirador') {
                            const { data: rest } = await supabase
                                .from('restiradores')
                                .select('no_restirador')
                                .eq('id', idRecurso)
                                .single();
                            if (rest) {
                                detalles = [{ label: 'Restirador #', value: String(rest.no_restirador) }];
                            }
                        }

                        const tipoLabel = tipo === 'libro' ? 'Libro' : tipo === 'computadora' ? 'Computadora' : 'Restirador';
                        const html = plantillaCorreo({
                            titulo: `Solicitud de ${tipoLabel} Recibida`,
                            mensaje: `Tu solicitud de <b>${tipoLabel}</b> ha sido registrada correctamente y se encuentra en estado pendiente.`,
                            nombre,
                            boleta: String(boleta),
                            grupo,
                            detalles,
                            estado: 'Pendiente',
                            estadoColor: '#f59e0b',
                        });

                        await enviarCorreo(alumno.correo, `Solicitud de ${tipoLabel} Recibida - C-Book`, html);
                    } catch (e) {
                        console.error('Error al enviar correo de solicitud:', e);
                    }
                })();

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

    try {
        const resultado = await getSolicitudes(boleta);
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