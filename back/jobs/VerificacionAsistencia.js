// Mantengo tu require original, pero el path real en este proyecto está en back/src/config/db.js
// (Dejo tu línea comentada para no "quitar" tu código)
// const { getClient } = require('../config/db');
let getClient;
try {
    ({ getClient } = require('../src/config/db'));
} catch (e) {
    ({ getClient } = require('../config/db'));
}
const supabase = getClient();
var Solicicitudes_libros={}
async function verificarAsistencia(params) {
    const actividades = await obtenerActividades();
    // Supabase regresa { data, error }, así que aquí normalizamos sin romper tu estructura
    Solicicitudes_libros = (actividades.Libros && actividades.Libros.data) ? actividades.Libros.data : actividades.Libros;

    const tareasCancelacion = [];

    Object.entries(Solicicitudes_libros || {}).forEach(([key, value]) => {
        if (!value || !value.fecha_solicitud) {
            return;
        }
        let mesActual = new Date().getMonth() + 1; // Los meses en JavaScript son base 0 
        let diaActual = new Date().getDate();
        let horaActual = new Date().getHours();
        let fechaActividad = new Date(value.fecha_solicitud);
        let mesLimite = fechaActividad.getMonth() + 1;
        let diaLimite = fechaActividad.getDate();
        let horaLimite = fechaActividad.getHours();

        // ====== LIBROS: checar fechas límite de tu tabla ======
        // - estado_solicitud_id = 1 (pendiente): si ya pasó fecha_limite_respuesta, se cancela
        // - estado_solicitud_id = 2 (aprobada / por recolectar): si ya pasó fecha_limite_recoleccion, se cancela
        const ahora = new Date();
        const estadoLibro = value.estado_asistencia_id;
        const limiteRespuesta = value.fecha_limite_respuesta ? new Date(value.fecha_limite_respuesta) : null;
        const limiteRecoleccion = value.fecha_limite_recoleccion ? new Date(value.fecha_limite_recoleccion) : null;

        if (estadoLibro === 1 && limiteRespuesta && ahora > limiteRespuesta) {
            tareasCancelacion.push(
                cancelarActividad(value.id, 'libro').catch((err) => console.error('Error cancelando libro (limite_respuesta):', err))
            );
        }

        if (estadoLibro === 2 && limiteRecoleccion && ahora > limiteRecoleccion) {
            tareasCancelacion.push(
                cancelarActividad(value.id, 'libro').catch((err) => console.error('Error cancelando libro (limite_recoleccion):', err))
            );
        }

        // Mantengo tu condición original como fallback (por si falta fecha_limite_*)
        if(mesActual > mesLimite || (mesActual === mesLimite && diaActual > diaLimite) || (mesActual === mesLimite && diaActual === diaLimite && horaActual > horaLimite)){
            // Aquí puedes actualizar el estado de la actividad en la base de datos si es necesario
        }

        
    });

    
    // Asegura que las cancelaciones disparadas por el forEach terminen
    if (tareasCancelacion.length > 0) {
        await Promise.allSettled(tareasCancelacion);
    }
}


const obtenerActividades = async () => {
// Libros: pendientes (1) y aprobadas por recolectar (2)
const Libros = await supabase.from('solicitudes_libros').select('*').in("estado_asistencia_id",[1,2]);

return {Libros};
    // Lógica para obtener las actividades programadas desde la base de datos
    // Retorna un array de actividades con sus fechas y estados
}

const cancelarActividad = async (ID_SOLICITUD, tipo = null) => {
    // Mantengo tu función, pero la hago más segura:
    // si se pasa tipo, solo cancela en la tabla correcta.
    const nowIso = new Date().toISOString();

    if (tipo === 'libro') {
        await supabase
            .from('solicitudes_libros')
            .update({ estado_asistencia_id: 4 })
            .eq('id', ID_SOLICITUD)
            .in('estado_asistencia_id', [1, 2]);
    } else {
        await supabase.from('solicitudes_libros').update({ estado_asistencia_id: 4 }).eq('id', ID_SOLICITUD);
    }

    // Lógica para cancelar la actividad en la base de datos
}

module.exports = { verificarAsistencia };