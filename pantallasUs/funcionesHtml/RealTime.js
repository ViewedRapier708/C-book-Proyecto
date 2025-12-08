// Configuración de Supabase
const SUPABASE_URL = 'https://yondcnkwcekmkovdeaso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbmRjbmt3Y2VrbWtvdmRlYXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2ODYyMDQsImV4cCI6MjA3NjI2MjIwNH0.4NqF_hCv7RiXrOjO9fxfRHPzikpZ61siqMZV_rlUQew';

// Variable para almacenar la suscripción activa
let realtimeChannel = null;

// Función para inicializar Supabase Realtime según documentación oficial
async function iniciarSupabaseRealTime(tabla, callback) {
    try {
        // Verificar que Supabase esté disponible
        if (typeof window.supabase === 'undefined') {
            console.error('❌ [RealTime] Supabase no está cargado. Agrega el CDN en el HTML.');
            return null;
        }

        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Crear canal para la tabla SIN filtro de usuario (para pruebas)
        const channelName = `realtime-${tabla}-${Date.now()}`;
     

        realtimeChannel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*', // Escuchar INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: tabla
                    // SIN filtro para detectar TODOS los cambios
                },
                (payload) => {

                    switch (payload.eventType) {
                        case 'INSERT':
                            console.log('➕ [RealTime] Nuevo registro:', payload.new);
                            callback({ type: 'INSERT', data: payload.new });
                            break;
                        case 'UPDATE':
                            console.log('✏️ [RealTime] Registro actualizado:', {
                                antes: payload.old,
                                después: payload.new
                            });
                            callback({ type: 'UPDATE', data: payload.new, old: payload.old });
                            break;
                        case 'DELETE':
                            console.log('🗑️ [RealTime] Registro eliminado:', payload.old);
                            callback({ type: 'DELETE', data: payload.old });
                            break;
                    }
                }
            )
            .subscribe((status) => {
                console.log('📊 [RealTime] Estado de suscripción:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅✅✅ [RealTime] CONECTADO EXITOSAMENTE');
                    console.log('⏳ [RealTime] Esperando cambios en:', tabla);
                    console.log('💡 [RealTime] Haz INSERT/UPDATE/DELETE en Supabase para verlos aquí');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ [RealTime] Error en el canal');
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ [RealTime] Timeout en la suscripción');
                }
            });

        return realtimeChannel;
    } catch (error) {
        console.error('❌ [RealTime] Error al inicializar:', error);
        return null;
    }
}

const cargarDatosTabla = async (tipo,informacion={}) => {
    const tbody= document.getElementById('Tbody')
    const tipo=document.getElementById('tabla').getAttribute('data-tipo');
    console.log('Cargando datos para tipo:', tipo);
    console.log('Información adicional:', informacion);
    switch (tipo) {
        case 'computadora':
            Object.values(informacion).forEach(valor => {
                console.log('Procesando registro de computadora:', valor);

            });
            break;
        case 'restirador':
  
            break;
        case 'libro':

            break;
        default:
            console.error('Tipo de recurso desconocido:', tipo);
            return;
    }
}