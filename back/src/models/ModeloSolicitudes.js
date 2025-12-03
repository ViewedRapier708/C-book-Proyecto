const {getClient} = require('../config/db');

async function solicutudes(tipo){
    const supabase = getClient();
    try {
        const {data, error} = await supabase
        .from('solicitudes')
        .select('*')
        .eq('tipo', tipo)
        .eq('estado', 'activo');
        if(error){
            console.error("Error obteniendo solicitudes:", error);
            return {success: false, error: 'Error al obtener solicitudes'};
        }   
        return {success: true, data: data};
    } catch (err) { 
        console.error("Error en solicutudes:", err);
        return {success: false, error: 'Error interno del servidor'};
    }
}
