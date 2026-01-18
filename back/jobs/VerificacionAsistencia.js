<<<<<<< HEAD

=======
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
>>>>>>> 1a1caeb681b5f56f22bb59c4f76f7bdc8d624129
var Act_computadoras={}
var Act_restiradores={}
var Solicicitudes_libros={}
async function verificarAsistencia(params) {
    const actividades = await obtenerActividades();
<<<<<<< HEAD
    Act_computadoras=actividades.Computadoras
    Act_restiradores=actividades.Restiradores
    Solicicitudes_libros=actividades.Libros

=======
    // Supabase regresa { data, error }, así que aquí normalizamos sin romper tu estructura
    Act_computadoras = (actividades.Computadoras && actividades.Computadoras.data) ? actividades.Computadoras.data : actividades.Computadoras;
    Act_restiradores = (actividades.Restiradores && actividades.Restiradores.data) ? actividades.Restiradores.data : actividades.Restiradores;
    Solicicitudes_libros = (actividades.Libros && actividades.Libros.data) ? actividades.Libros.data : actividades.Libros;

    const tareasCancelacion = [];
   
    Object.entries(Act_computadoras || {}).forEach(([key, value]) => {
        let fechaActual = new Date().getHours();//Obtener la hora actual
        let fechaActividad = new Date(value.fecha_solicitud);
        console.log("Fecha actividad computadora:", fechaActividad);
        let horaLimite = fechaActividad.getHours() ;//Verificar la hora limite de asistencia
        console.log("Hora actual:", fechaActual, "Hora limite:", horaLimite);

        // Verificación real por fecha completa (no solo hora), con tolerancia configurable
        const minutosTolerancia = Number(process.env.ASISTENCIA_TIMEOUT_MINUTES || 60);
        const limiteAsistencia = new Date(fechaActividad.getTime() + (minutosTolerancia * 60 * 1000));

        if(fechaActual > horaLimite || new Date() > limiteAsistencia){
            // Aquí puedes actualizar el estado de la actividad en la base de datos si es necesario
            console.log(`La actividad con ID ${value.id} ha excedido el tiempo límite de asistencia.`);
            tareasCancelacion.push(
                cancelarActividad(value.id, 'computadora').catch((err) => console.error('Error cancelando computadora:', err))
            );
        }
    });

    Object.entries(Act_restiradores || {}).forEach(([key, value]) => {
        let fechaActual = new Date().getHours();
        let fechaActividad = new Date(value.fecha_solicitud);
        console.log("Fecha actividad restirador:", fechaActividad);
        let horaLimite = fechaActividad.getHours() ;
        console.log("Hora actual:", fechaActual, "Hora limite:", horaLimite);

        const minutosTolerancia = Number(process.env.ASISTENCIA_TIMEOUT_MINUTES || 60);
        const limiteAsistencia = new Date(fechaActividad.getTime() + (minutosTolerancia * 60 * 1000));

        if(fechaActual > horaLimite || new Date() > limiteAsistencia){
            // Aquí puedes actualizar el estado de la actividad en la base de datos si es necesario
            console.log(`La actividad con ID ${value.id} ha excedido el tiempo límite de asistencia.`);
            tareasCancelacion.push(
                cancelarActividad(value.id, 'restirador').catch((err) => console.error('Error cancelando restirador:', err))
            );
        }
    
    });

    Object.entries(Solicicitudes_libros || {}).forEach(([key, value]) => {
        let mesActual = new Date().getMonth() + 1; // Los meses en JavaScript son base 0 
        let diaActual = new Date().getDate();
        let horaActual = new Date().getHours();
        console.log("Mes actual:", mesActual, "Dia actual:", diaActual, "Hora actual:", horaActual);
        let fechaActividad = new Date(value.fecha_solicitud);
        console.log("Fecha actividad libro:", fechaActividad);
        let mesLimite = fechaActividad.getMonth() + 1;
        let diaLimite = fechaActividad.getDate();
        let horaLimite = fechaActividad.getHours();
        console.log("Mes limite:", mesLimite, "Dia limite:", diaLimite, "Hora limite:", horaLimite);

        // ====== LIBROS: checar fechas límite de tu tabla ======
        // - estado_solicitud_id = 1 (pendiente): si ya pasó fecha_limite_respuesta, se cancela
        // - estado_solicitud_id = 2 (aprobada / por recolectar): si ya pasó fecha_limite_recoleccion, se cancela
        const ahora = new Date();
        const estadoLibro = value.estado_solicitud_id;
        const limiteRespuesta = value.fecha_limite_respuesta ? new Date(value.fecha_limite_respuesta) : null;
        const limiteRecoleccion = value.fecha_limite_recoleccion ? new Date(value.fecha_limite_recoleccion) : null;

        if (estadoLibro === 1 && limiteRespuesta && ahora > limiteRespuesta) {
            console.log(`La solicitud de libro con ID ${value.id} excedió fecha_limite_respuesta.`);
            tareasCancelacion.push(
                cancelarActividad(value.id, 'libro').catch((err) => console.error('Error cancelando libro (limite_respuesta):', err))
            );
        }

        if (estadoLibro === 2 && limiteRecoleccion && ahora > limiteRecoleccion) {
            console.log(`La solicitud de libro con ID ${value.id} excedió fecha_limite_recoleccion.`);
            tareasCancelacion.push(
                cancelarActividad(value.id, 'libro').catch((err) => console.error('Error cancelando libro (limite_recoleccion):', err))
            );
        }

        // Mantengo tu condición original como fallback (por si falta fecha_limite_*)
        if(mesActual > mesLimite || (mesActual === mesLimite && diaActual > diaLimite) || (mesActual === mesLimite && diaActual === diaLimite && horaActual > horaLimite)){
            // Aquí puedes actualizar el estado de la actividad en la base de datos si es necesario
            console.log(`La solicitud de libro con ID ${value.id} ha excedido el tiempo límite de asistencia.`);
        }

        
    });

    
>>>>>>> 1a1caeb681b5f56f22bb59c4f76f7bdc8d624129
    console.log("Verificación de asistencia ejecutada");
//debug
    console.log("Actividades de computadoras:", Act_computadoras);
    console.log("Actividades de restiradores:", Act_restiradores);
    console.log("Solicitudes de libros:", Solicicitudes_libros);
<<<<<<< HEAD
=======

    // Asegura que las cancelaciones disparadas por el forEach terminen
    if (tareasCancelacion.length > 0) {
        await Promise.allSettled(tareasCancelacion);
    }
>>>>>>> 1a1caeb681b5f56f22bb59c4f76f7bdc8d624129
}


const obtenerActividades = async () => {
<<<<<<< HEAD
const { getClient } = require('../config/db');
const supabase = getClient();
const Computadoras = await supabase.from('solicitudes_computadora').select('*').eq();
const Restiradores = await supabase.from('solicitudes_restirador').select('*');
const Libros = await supabase.from('solicitudes_libros').select('*');
=======
const Computadoras = await supabase.from('solicitudes_computadora').select('*').eq("estado_asistencia_id",1);
const Restiradores = await supabase.from('solicitudes_restirador').select('*').eq("estado_asistencia_id",1);
// Libros: tu tabla maneja estado_solicitud_id, y tiene limites por respuesta/recolección
// Traemos pendientes (1) y aprobadas por recolectar (2) para poder checar ambas fechas límite.
const Libros = await supabase.from('solicitudes_libros').select('*').in("estado_solicitud_id",[1,2]);
>>>>>>> 1a1caeb681b5f56f22bb59c4f76f7bdc8d624129

return {Computadoras,Restiradores,Libros};
    // Lógica para obtener las actividades programadas desde la base de datos
    // Retorna un array de actividades con sus fechas y estados
}
<<<<<<< HEAD
=======

const cancelarActividad = async (ID_SOLICITUD, tipo = null) => {
    // Mantengo tu función, pero la hago más segura:
    // si se pasa tipo, solo cancela en la tabla correcta.
    const nowIso = new Date().toISOString();

    if (tipo === 'computadora') {
        await supabase
            .from('solicitudes_computadora')
            .update({ estado_asistencia_id: 4 })
            .eq('id', ID_SOLICITUD)
            .eq('estado_asistencia_id', 1);
    } else if (tipo === 'restirador') {
        await supabase
            .from('solicitudes_restirador')
            .update({ estado_asistencia_id: 4 })
            .eq('id', ID_SOLICITUD)
            .eq('estado_asistencia_id', 1);
    } else if (tipo === 'libro') {
        await supabase
            .from('solicitudes_libros')
            .update({ estado_solicitud_id: 4, fecha_cancelacion: nowIso })
            .eq('id', ID_SOLICITUD)
            .in('estado_solicitud_id', [1, 2]);
    } else {
        // Comportamiento original (por compatibilidad): intenta cancelar en todas
        await supabase.from('solicitudes_computadora').update({ estado_asistencia_id: 4 }).eq('id', ID_SOLICITUD);
        await supabase.from('solicitudes_restirador').update({ estado_asistencia_id: 4 }).eq('id', ID_SOLICITUD);
        await supabase.from('solicitudes_libros').update({ estado_solicitud_id: 4, fecha_cancelacion: nowIso }).eq('id', ID_SOLICITUD);
    }

    // Lógica para cancelar la actividad en la base de datos
    console.log(`Actividad con ID ${ID_SOLICITUD} cancelada por no asistencia.`);
}

module.exports = { verificarAsistencia };
>>>>>>> 1a1caeb681b5f56f22bb59c4f76f7bdc8d624129
