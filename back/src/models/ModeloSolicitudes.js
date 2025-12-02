const { getClient } = require('../config/db');

const tipos = {
    computadoras: {
        tabla: "solicitudes_computadora",
        query:[]/
    
    },
};

// ==================== CREAR SOLICITUD ====================
async function CrearSolicitud(tipoSolicitud, boleta, idRecurso) {
    const supabase = getClient();


    //Inicialmente tengo que revisar si no tengo alguna solicitud activa
    if (!tipoSolicitud || !boleta || !idRecurso) {
        return { success: false, error: 'Faltan datos obligatorios' };
    }
    if (!tipos.includes(tipoSolicitud)) {
        return { success: false, error: 'Tipo de solicitud inválido' };
    }

    const tabla = tipos[tipoSolicitud];
    console.log("Tabla seleccionada para la solicitud:", tabla); //debug

    try {
        const { data, error } = await supabase
            .from(tabla)
            .insert(``));

        if (error) {
            console.error("Error insertando solicitud de computadora:", error);
            return { success: false, error: error.message || 'Error al crear solicitud' };
        }
    } catch (err) {
        console.error("Error en solicitudes de computadora:", err);
        return { success: false, error: 'Error interno del servidor' };
    }


}
async function verificarSolicitudExistente(tipo, boleta) {
    const supabase = getClient();
    try {
        const { data, error } = await supabase
            .from('solicitudes_computadora')
    } catch (error) {

    }
}
// ==================== CANCELACION DE SOLICITUD ====================




