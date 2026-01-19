/*Estos modelos funcionan correctamente*/
//Modelo para verificar la disponibilidad de los recursos esta funcion debe de ser la primera para hacer la solicitud
const modeloVerificacion = {
    verificarSolicitudRestirador: async ({ id }) => {
        const { getClient } = require('../config/db.js');
        const supabase = getClient();
        const { data, error } = await supabase
            .from('restiradores')
            .select('id,ocupado')
            .eq('id', id).maybeSingle();

        if (error) { return { error, data: null }; }

        if (data.ocupado == true) {
            return { mensaje: 'Restirador no disponible', data: null };
        } else {
            return { success: true, data: data };
        }
    }, verificarSolicitudComputadora: async ({ id }) => {
        const { getClient } = require('../config/db.js');
        const supabase = getClient();
        const { data, error } = await supabase
            .from('computadoras')
            .select('id,ocupado')
            .eq('id', id).maybeSingle();
        if (!data) {
            return { error: 'Computadora no encontrada', data: null };
        }
        if (error) { return { error, data: null }; }
        if (data.ocupado == true) {
            return { error: new Error('Computadora no disponible'), data: null };
        } else {
            return { success: true, data: data };

        }
    }, verificarSolicitudLibro: async ({ id }) => {
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