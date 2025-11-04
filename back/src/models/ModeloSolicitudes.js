
// Modelo para el registro de las solicitudes de recursos, este es el que se llama al controlador para registrar los datos
const modeloSolicitudes = {
    solicitudRestirador: async (IDreg,semestre,grupo,hora_solicitud,numeroRestirador,estado) => {
        const usoMaterial= await modeloUsoMaterial.solicitarRestirador(numeroRestirador);

   if(usoMaterial){
    const { getClient } = require('../config/db.js');
    const supabase = getClient();
    const { data, error } = await supabase
    .from('solicitud_restiradores')
    .insert([{ IDreg, semestre, grupo, hora_solicitud, numeroRestirador, estado }])
    .select()
    if(error){ return {error, data:null}; }
}
    
    },solicitudLibro: async (IDreg,semestre,grupo,hora_solicitud,estado,libroID) => {
    const { getClient } = require('../config/db.js');
    const supabase = getClient();
    const { data, error } = await supabase
    .from('solicitud_libros')
    .insert([{ IDreg, semestre, grupo, libroID, hora_solicitud, estado }])
    .select()

    if(error){ return {error, data:null}; }
    },solicitudComputadora: async (IDreg,semestre,grupo,hora_solicitud,estado,computadoraID) => {
    const { getClient } = require('../config/db.js');
    const supabase = getClient();
    const { data, error } = await supabase
    .from('solicitud_computadoras')
    .insert([{ IDreg, semestre, grupo, hora_solicitud,computadoraID, estado }])
    .select()
    if(error){ return {error, data:null}; }
}
}


const modeloUsoMaterial = {
    solicitarRestirador: async (numeroRestirador) => {
        const { getClient } = require('../config/db.js');
        const supabase = getClient();
        const { data, error } = await supabase
        .from('restiradores')
        .update({ ocupado: true })
        .eq('id', numeroRestirador)
        .select()
    if(error){ return {error, data:null}; }else{return true}
},
    solicitarComputadora: async (computadoraID) => {
        const { getClient } = require('../config/db.js');
        const supabase = getClient();
        const { data, error } = await supabase
        .from('computadoras')
        .update({ ocupado: true })
        .eq('id', computadoraID)
        .select()

        console.log("Resultado de solicitarComputadora:", {data, error});
    if(error){ return {error, data:null}; }else{return true}
},  // CORRECCIÓN en modeloUsoMaterial - solicitarLibro
solicitarLibro: async (libroID) => {
    console.log("ID del libro a solicitar:", libroID);
    
    try {
        const { modeloVerificacion } = require('./modeloVerificacionRecursos.js');
        const { getClient } = require('../config/db.js');
        const supabase = getClient();

        // Asegurar que libroID sea un número
        const id = parseInt(libroID);
        if (isNaN(id)) {
            return { 
                error: { message: "ID de libro inválido" }, 
                data: null 
            };
        }

        // 1. Primero verificar la disponibilidad
        const resultadoVerificacion = await modeloVerificacion.verificarSolicitudLibro({ ID: id });
        console.log("Resultado de verificación:", resultadoVerificacion);
        
        // 2. Si hay error en la verificación, retornarlo
        if (resultadoVerificacion && resultadoVerificacion.error) {
            return resultadoVerificacion;
        }
        
        // 3. resultadoVerificacion ahora debería ser el número de disponibilidad
        const disponibilidad = resultadoVerificacion;
        
        // 4. Validar que hay disponibilidad
        if (disponibilidad <= 0) {
            return { 
                error: { message: "No hay ejemplares disponibles" }, 
                data: null 
            };
        }

        // 5. Actualizar la cantidad disponible
        const { data, error } = await supabase
            .from('libros')
            .update({ cantidad_disponible: disponibilidad - 1 })
            .eq('id', id)
            .select();

        if (error) {
            return { error, data: null };
        }

        console.log("Cantidad disponible después de la solicitud:", data);
        return { error: null, data: data[0] };

    } catch (error) {
        console.error("Error en solicitarLibro:", error);
        return { error, data: null };
    }
}
};

modeloUsoMaterial.solicitarComputadora({ID:1}.ID);
module.exports = { modeloSolicitudes, modeloUsoMaterial };