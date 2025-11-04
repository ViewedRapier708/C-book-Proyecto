/*Estos modelos funcionan correctamente*/
//Modelo para verificar la disponibilidad de los recursos esta funcion debe de ser la primera para hacer la solicitud
const modeloVerificacion = {
    verificarSolicitudRestirador: async ({ ID }) => {
        const { getClient } = require('../config/db.js');
        const supabase = getClient();
        const { data, error } = await supabase
            .from('restiradores')
            .select('id,ocupado')
            .eq('id', ID).maybeSingle();
        if (error) { return { error, data: null }; }

        if (data.ocupado == true) {
            return { error: new Error('Restirador no disponible'), data: null };
        } else {
            return { success: true, data: data };
        }
    }, verificarSolicitudComputadora: async ({ ID }) => {
        console.log("Verificando Computadora ID:--" + ID);
        const { getClient } = require('../config/db.js');
        const supabase = getClient();
        const { data, error } = await supabase
            .from('computadoras')
            .select('id,ocupado')
            .eq('id', ID).maybeSingle();

        if (error) { return { error, data: null }; }
        console.log("Verificacion Computadora:");
        console.log(data);
        if (data.ocupado == true) {
            return { error: new Error('Computadora no disponible'), data: null };
        } else {
            return { success: true, data: data };

        }
    }, verificarSolicitudLibro: async ({ ID }) => {
        console.log("Verificando Libro ID:--", ID);
        const { getClient } = require('../config/db.js');
        const supabase = getClient();

        // Asegurar que ID sea un número
        const libroID = parseInt(ID);
        if (isNaN(libroID)) {
            return { error: new Error('ID de libro inválido'), data: null };
        }

        const { data, error } = await supabase
            .from('libros')
            .select('id,cantidad_disponible')
            .eq('id', libroID)
            .maybeSingle();

        console.log("Data Verificacion Libro:", data);

        if (error) {
            return { error, data: null };
        }

        if (!data) {
            return { error: new Error('Libro no encontrado'), data: null };
        }

        if (data.cantidad_disponible <= 0) {
            return { error: new Error('Libro no disponible'), data: null };
        } else {
            console.log("Cantidad Disponible:", data.cantidad_disponible);
            return data.cantidad_disponible;
        }
    }
};
module.exports = { modeloVerificacion };