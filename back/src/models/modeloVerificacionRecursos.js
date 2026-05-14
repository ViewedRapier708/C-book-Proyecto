/*Estos modelos funcionan correctamente*/
//Modelo para verificar la disponibilidad de los recursos esta funcion debe de ser la primera para hacer la solicitud
const modeloVerificacion = {
    verificarSolicitudLibro: async ({ id }) => {
        const { getClient } = require('../config/db.js');
        const supabase = getClient();

        // Asegurar que ID sea un número
        const libroID = parseInt(id);
        if (isNaN(libroID)) {
            return { error: new Error('ID de libro inválido'), data: null };
        }

        const { data, error } = await supabase
            .from('libros')
            .select('id,cantidad_disponible')
            .eq('id', libroID)
            .maybeSingle();

        if (error) {
            return { error, data: null };
        }

        if (!data) {
            return { error: new Error('Libro no encontrado'), data: null };
        }

        if (data.cantidad_disponible <= 0) {
            return { error: new Error('Libro no disponible'), data: null };
        } else {
            return data.cantidad_disponible;
        }
    }
};
module.exports = { modeloVerificacion };