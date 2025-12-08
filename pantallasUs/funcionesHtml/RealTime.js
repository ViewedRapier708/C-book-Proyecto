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

        console.log('🚀 [RealTime] Inicializando cliente Supabase...');
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Crear canal para la tabla SIN filtro de usuario (para pruebas)
        const channelName = `realtime-${tabla}-${Date.now()}`;
        console.log('📡 [RealTime] Creando canal:', channelName);
        console.log('📋 [RealTime] Tabla a monitorear:', tabla);

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
                    console.log('🔔🔔🔔 [RealTime] ¡CAMBIO DETECTADO!');
                    console.log('📋 Tabla:', tabla);
                    console.log('🔧 Evento:', payload.eventType);
                    console.log('📦 Payload completo:', payload);
                    
                    // Procesar según el tipo de evento
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

// Función para detectar cambios entre dos conjuntos de datos
function detectarCambios(anterior, actual) {
    const cambios = {
        hayaCambios: false,
        nuevos: [],
        modificados: [],
        eliminados: []
    };
    
    // Convertir arrays a maps para búsqueda más eficiente
    const mapAnterior = new Map(anterior.map(item => [item.id, item]));
    const mapActual = new Map(actual.map(item => [item.id, item]));
    
    // Detectar nuevos y modificados
    actual.forEach(itemActual => {
        const itemAnterior = mapAnterior.get(itemActual.id);
        
        if (!itemAnterior) {
            // Nuevo registro
            cambios.nuevos.push(itemActual);
            cambios.hayaCambios = true;
            console.log('➕ [RealTime] Nuevo registro detectado:', itemActual);
        } else {
            // Verificar si hay modificaciones
            const huboModificacion = JSON.stringify(itemAnterior) !== JSON.stringify(itemActual);
            if (huboModificacion) {
                cambios.modificados.push({
                    anterior: itemAnterior,
                    actual: itemActual,
                    diferencias: encontrarDiferencias(itemAnterior, itemActual)
                });
                cambios.hayaCambios = true;
                console.log('✏️ [RealTime] Registro modificado:', {
                    id: itemActual.id,
                    cambios: encontrarDiferencias(itemAnterior, itemActual)
                });
            }
        }
    });
    
    // Detectar eliminados
    anterior.forEach(itemAnterior => {
        if (!mapActual.has(itemAnterior.id)) {
            cambios.eliminados.push(itemAnterior);
            cambios.hayaCambios = true;
            console.log('🗑️ [RealTime] Registro eliminado:', itemAnterior);
        }
    });
    
    return cambios;
}

// Función auxiliar para encontrar diferencias específicas entre dos objetos
function encontrarDiferencias(obj1, obj2) {
    const diferencias = {};
    
    Object.keys(obj2).forEach(key => {
        if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
            diferencias[key] = {
                anterior: obj1[key],
                actual: obj2[key]
            };
        }
    });
    
    return diferencias;
}

// Función para detener la suscripción de Supabase Realtime
function detenerRealTime() {
    if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        realtimeChannel = null;
        console.log('⏹️ [RealTime] Suscripción detenida');
    }
}

// Array para almacenar todas las suscripciones activas
let suscripcionesActivas = [];

// Función para suscribirse a múltiples tablas
function iniciarRealTimeMultiTablas(tablas, callback) {
    console.log(`🚀 [RealTime] Suscribiendo a ${tablas.length} tablas:`, tablas);
    
    tablas.forEach(tabla => {
        const canal = iniciarSupabaseRealTime(tabla, (change) => {
            // Agregar nombre de tabla al cambio
            callback({ ...change, tabla });
        });
        
        if (canal) {
            suscripcionesActivas.push({ tabla, canal });
        }
    });
    
    console.log(`✅ [RealTime] Total de suscripciones activas: ${suscripcionesActivas.length}`);
}

// Función simplificada para iniciar RealTime en tablas de recursos
function iniciarRealTime(callback) {
    // Tablas de recursos a monitorear
    const tablasRecursos = [
        'restiradores',
        'ejemplares', 
        'computadoras',
        'guardarropas'
    ];
    
    // Callback por defecto si no se proporciona
    const defaultCallback = (change) => {
        console.log(`📬 [RealTime] Cambio en ${change.tabla}:`, change);
    };
    
    iniciarRealTimeMultiTablas(tablasRecursos, callback || defaultCallback);
}

// Función mejorada para detener todas las suscripciones
function detenerTodasSuscripciones() {
    console.log(`⏹️ [RealTime] Deteniendo ${suscripcionesActivas.length} suscripciones...`);
    
    suscripcionesActivas.forEach(({ tabla, canal }) => {
        canal.unsubscribe();
        console.log(`⏹️ [RealTime] Suscripción detenida: ${tabla}`);
    });
    
    suscripcionesActivas = [];
    console.log('✅ [RealTime] Todas las suscripciones detenidas');
}

