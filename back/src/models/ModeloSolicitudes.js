const { getClient } = require('../config/db');
const supabase = getClient();


// ==================== CREAR SOLICITUD ====================
async function CrearSolicitud(tipoSolicitud, boleta, idRecurso) {
    switch (tipoSolicitud) {
        case 'computadora':
            return await CrearSolicitudComputadora(boleta, idRecurso);
        case 'restirador':
            return await CrearSolicitudRestiradores(boleta, idRecurso);
        case 'libro':
            return await CrearSolicitudlibro(boleta, idRecurso);
        default:
            return { success: false, error: 'Tipo de solicitud inválido' };
    }
}


//==================Funciones de los materiales para agregar los registros==================
async function CrearSolicitudComputadora(boleta, idRecurso) {
    const { data: compData, error: compError } = await supabase
        .from('computadoras')
        .select('id')
        .eq('no_computadora', idRecurso)
        .limit(1)
        .maybeSingle();

    if (compError) {
        console.error("Error buscando computadora:", compError);
        return { success: false, error: compError.message };
    }

    if (!compData?.id) {
        return { success: false, error: 'Recurso no encontrado' };
    }

    try {
        const { error } = await supabase
            .from('solicitudes_computadora')
            .insert([{ usuario_boleta: boleta, computadora_id: compData.id }]);
        //El estado se pone automáticamente en 'pendiente'
        if (error) {
            console.error("Error creando solicitud de computadora:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        console.error("Error en CrearSolicitudComputadora:", err);
        return { success: false, error: 'Error interno del servidor' };
    }

}
async function CrearSolicitudRestiradores(boleta, idRecurso) {
    try {
        console.log("Creando solicitud de restirador para boleta:", boleta, "y restirador ID:", idRecurso);
        const { error } = await supabase
            .from('solicitudes_restirador')
            .insert([{ usuario_boleta: boleta, restirador_id: idRecurso }]);

        if (error) {
            console.error("Error creando solicitud de restirador:", error);
            return { success: false, error: error.message };
        }

        //Se crea la solicitud y se autocompletan los campos de tiempo actual y fecha limite a llegar 
        return { success: true };
    } catch (err) {
        console.error("Error en CrearSolicitudRestiradores:", err);
        return { success: false, error: 'Error interno del servidor' };
    }

}
async function CrearSolicitudlibro(boleta, idRecurso) {
    try {
        // Estado 1 = pendiente (ajusta si tu catálogo es diferente)
        // No se envían fechas, se usan los defaults de la tabla
        const { error } = await supabase
            .from('solicitudes_libros')
            .insert([{
                usuario_boleta: boleta,
                ejemplar_id: idRecurso
                // fechas y demás campos usan los defaults de la tabla
            }]);
        if (error) {
            console.error("Error creando solicitud de libro:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        console.error("Error en CrearSolicitudlibro:", err);
        return { success: false, error: 'Error interno del servidor' };
    }
}


//=====================Verificar disponibilidad de recursos middleware=====================
async function VerificarDisponibilidadRecurso(tipoSolicitud, idRecurso) {//Poner en creacion de solicitud
    //Funcion general para la verificacion de disponibilidad
    switch (tipoSolicitud) {
        case 'computadora':
            return await VerificarDisponibilidadComputadora(idRecurso);
        case 'restirador':
            return await VerificarDisponibilidadRestirador(idRecurso);
        case 'libro':
            return await VerificarDisponibilidadLibro(idRecurso);
        default:
            return { disponible: false, error: 'Tipo de recurso inválido' };
    }

    async function VerificarDisponibilidadComputadora(n_recurso) {
        try {
            const { data, error } = await supabase
                .from('computadoras')
                .select('id,Disponible,En_funcionamiento')
                .eq('no_computadora', n_recurso)
                .limit(1)
                .maybeSingle();
            if (error) {
                console.error("Error verificando disponibilidad:", error);
                return { success: false, message: error.message };
            }
            if (!data) {
                return { success: false, message: 'Recurso no encontrado' };
            }
            if (data.Disponible === false) {
                return { message: 'La computadora no está disponible actualmente', success: false };
            }
            if (data.En_funcionamiento === false) {
                return { message: 'La computadora no está en funcionamiento', success: false };
            }
            return { success: true, message: null, idRecurso: data.id };//Indica que la computadora está disponible


        } catch (error) {
            return { success: false, message: 'Error interno del servidor' };
        }

    }
    async function VerificarDisponibilidadRestirador(n_recurso) {
        try {
            const { data, error } = await supabase
                .from('restiradores')
                .select('id,Disponible,estado_de_material')
                .eq('no_restirador', n_recurso)
                .limit(1)
                .maybeSingle();
            if (error) {
                console.error("Error verificando disponibilidad:", error);
                return { success: false, message: error.message };
            }
            if (!data) {
                return { success: false, message: 'Recurso no encontrado' };
            }
            if (data.Disponible === false) {
                return { message: 'El restirador no está disponible actualmente', success: false };
            }
            if (data.estado_de_material === false) {
                return { message: 'El restirador no está en funcionamiento', success: false };
            }
            return { success: true, message: null, idRecurso: data.id };   //Indica que el restirador está disponible

        } catch (error) {

            return { success: false, message: 'Error interno del servidor' };

        }

    }
    async function VerificarDisponibilidadLibro(n_recurso) {
        try {
            // Ahora n_recurso es el id del ejemplar
            const { data, error } = await supabase
                .from('ejemplares')
                .select('id,Disponible')
                .eq('id', n_recurso)
                .single();

            if (error) {
                console.error("Error verificando disponibilidad:", error);
                return { success: false, message: error.message };
            }
            if (!data) {
                return { success: false, message: 'Recurso no encontrado' };
            }
            if (data.Disponible === false) {
                return { message: 'El libro no está disponible actualmente', success: false };
            }
            return { success: true, message: null, idRecurso: data.id };//Indica que el libro está disponible
        } catch (error) {
            return { success: false, message: 'Error interno del servidor' };
        }

    }

}



// ==================== OBTENER SOLICITUDES ACTIVAS ====================
async function ObtenerSolicitudesActivasPorBoleta(tipo, boleta) {
    const numeroBoleta = Number(boleta);
    if (!tipo || !boleta) {
        return { success: false, error: 'Faltan datos obligatorios' };
    }

    if (tipo === 'computadora' || tipo === 'restirador') {
        if (!Number.isInteger(numeroBoleta)) {
            return { success: false, error: 'Boleta inválida' };
        }
        //Contar solicitudes activas en ambas tablas computadoras y restiradores
        try {
            const [computadoras, restiradores] = await Promise.all([
                contarPendientesPorTabla(supabase, 'solicitudes_computadora', numeroBoleta),
                contarPendientesPorTabla(supabase, 'solicitudes_restirador', numeroBoleta)
            ]);

            if (!computadoras.success) {
                return computadoras;
            }
            if (!restiradores.success) {
                return restiradores;
            }

            const detalle = {
                computadoras: computadoras.count,
                restiradores: restiradores.count
            };//Objeto con el detalle de solicitudes activas

            return {
                success: true,
                total: detalle.computadoras + detalle.restiradores,//retorna el total de solicitudes activas

            };
        } catch (err) {
            console.error('Error contando solicitudes activas:', err);
            return { success: false, error: 'Error interno del servidor' };
        }
    } else if (tipo === 'libro') {
        //Contar solicitudes activas en la tabla de libros
        const libros = await contarPendientesPorTabla(supabase, 'solicitudes_libros', numeroBoleta);
        if (!libros.success) {
            return libros;
        }
        return {
            success: true,
            total: libros.count
        }
    }
    async function contarPendientesPorTabla(client, tabla, boleta) {
        try {
            const { data, count, error } = await client
                .from(tabla)
                .select('id', { count: 'exact' })
                .eq('usuario_boleta', String(boleta))
                .eq('estado_asistencia_id', 1);
            if (error) {
                console.error(`Error consultando ${tabla}:`, error);
                return { success: false, error: error.message, count: 0 };
            }

            return { success: true, count: count };
        } catch (err) {
            console.error(`Error inesperado consultando ${tabla}:`, err);
            return { success: false, error: 'Error interno', count: 0 };
        }
    }

}
async function getSolicitudes(boleta) {
  const supabase = getClient();
  try {
    const { data, error } = await supabase//Retorna todas las solicitudes hechas por un alumno
      .from('v_solicitudes_alumno')
      .select('*')
      .eq('registro_id', boleta);
    if (error) {
      console.error("Error obteniendo solicitudes:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Error en getSolicitudes:", err);
    return { success: false, error: 'Error interno' };
  }
}



// ==================== CANCELACION DE SOLICITUD ====================
async function CancelarSolicitud(tipoSolicitud, solicitudId, boleta) {
    const id = Number(solicitudId);
    if (!Number.isInteger(id)) {
        return { success: false, error: 'ID de solicitud inválido' };
    }
    let tabla = null;
    switch (tipoSolicitud) {
        case 'computadora':
            tabla = 'solicitudes_computadora';
            break;
        case 'restirador':
            tabla = 'solicitudes_restirador';
            break;
        case 'libro':
            tabla = 'solicitudes_libros';
            break;
        default:
            return { success: false, error: 'Tipo de solicitud inválido' };
    }

    try {
        let query = supabase
            .from(tabla)
            .update({ estado_asistencia_id: 3 }) // 3 = cancelada
            .eq('id', id)
            .eq('estado_asistencia_id', 1); // solo cancelar si está pendiente

        if (boleta) {
            query = query.eq('usuario_boleta', String(boleta));
        }

        const { error } = await query;

        if (error) {
            console.error('Error cancelando solicitud:', error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err) {
        console.error('Error en CancelarSolicitud:', err);
        return { success: false, error: 'Error interno del servidor' };
    }
}

// ==================== EXPORTAR FUNCIONES ====================
module.exports = {
    CrearSolicitud,
    CrearSolicitudComputadora,
    CrearSolicitudRestiradores,
    CrearSolicitudlibro,
    VerificarDisponibilidadRecurso,
    ObtenerSolicitudesActivasPorBoleta,
    CancelarSolicitud,
    getSolicitudes
};


