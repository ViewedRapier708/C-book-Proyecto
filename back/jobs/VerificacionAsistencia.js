
var Act_computadoras={}
var Act_restiradores={}
var Solicicitudes_libros={}
async function verificarAsistencia(params) {
    const actividades = await obtenerActividades();
    Act_computadoras=actividades.Computadoras
    Act_restiradores=actividades.Restiradores
    Solicicitudes_libros=actividades.Libros


    
    console.log("Verificación de asistencia ejecutada");
//debug
    console.log("Actividades de computadoras:", Act_computadoras);
    console.log("Actividades de restiradores:", Act_restiradores);
    console.log("Solicitudes de libros:", Solicicitudes_libros);
}


const obtenerActividades = async () => {
const { getClient } = require('../config/db');
const supabase = getClient();
const Computadoras = await supabase.from('solicitudes_computadora').select('*').eq("estado_asistencia_id",1);
const Restiradores = await supabase.from('solicitudes_restirador').select('*').eq("estado_asistencia_id",1);
const Libros = await supabase.from('solicitudes_libros').select('*').eq("estado_solicitud_id",1);

return {Computadoras,Restiradores,Libros};
    // Lógica para obtener las actividades programadas desde la base de datos
    // Retorna un array de actividades con sus fechas y estados
}
