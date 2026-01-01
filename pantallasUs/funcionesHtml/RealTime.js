

// Configuración de Supabase
const SUPABASE_URL = 'https://yondcnkwcekmkovdeaso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbmRjbmt3Y2VrbWtvdmRlYXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2ODYyMDQsImV4cCI6MjA3NjI2MjIwNH0.4NqF_hCv7RiXrOjO9fxfRHPzikpZ61siqMZV_rlUQew';

// Variable para almacenar la suscripción activa
let realtimeChannels = []; // Ahora es un array para múltiples canales
let supabaseClient = null;

// Mapeo de tipos de tabla frontend -> nombres reales en Supabase (puede ser array)
const TABLA_SUPABASE = {
    'computadora': ['computadoras'],
    'libro': ['libros', 'ejemplares'], // Escucha ambas tablas
    'restirador': ['restiradores'],
    'areaconsulta': ['area_consulta'],
    'solicitudes': ['solicitudes']
};

const formatDisponible = (valor) => {
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    if (valor === null || valor === undefined) return '-';
    if (valor === 'Sí' || valor === 'No') return valor;
    return valor;
};
const mapRowValues = (tipo, obj) => {
    if (Array.isArray(obj)) return obj;
    const recurso = obj || {};

    // Para libros (tabla ejemplares)
    if (tipo === 'libro') {
        const libro = recurso.libros || {};
        return [//Retorna un array con los valores en el orden correcto
            libro.titulo || recurso.titulo || '-',
            libro.autor || recurso.autor || '-',
            libro.clasificacion || recurso.clasificacion || '-',
            libro.tipo_material || recurso.tipo_material || '-',
            recurso.anio ?? '-',
            recurso.numero_ejemplar ?? '-',
            recurso.Disponibilidad ?? recurso.disponibilidad ?? recurso.estatus_item ?? '-'
        ];
    }

    // Para computadoras
    if (tipo === 'computadora') {
        return [
            recurso.no_computadora ?? recurso.numero ?? '-',
            recurso.Observacion ?? recurso.observacion ?? '-',
            recurso.procesador ?? '-',
            recurso.programas ?? '-',
            recurso.carrera ?? '-',
            recurso.En_funcionamiento ?? recurso.en_funcionamiento ?? '-',
            recurso.Disponible ?? recurso.disponible ?? '-'
        ];
    }

    // Para restiradores
    if (tipo === 'restirador') {
        return [
            recurso.no_restirador ?? recurso.id ?? '-',
            recurso.Observacion ?? recurso.observacion ?? '-',
            recurso.Disponible ?? recurso.disponible ?? '-',
            recurso.estado_de_material ?? '-'
        ];
    }

    return Object.values(recurso);
};

const getRowKey = (tipo, obj) => {
    const recurso = obj;
    if (tipo === 'libro') return recurso.numero_ejemplar || recurso.id || recurso.libros?.isbn || null;
    if (tipo === 'computadora') return recurso.no_computadora || recurso.id || null;
    if (tipo === 'restirador') return recurso.no_restirador || recurso.id || null;
    return recurso.id || recurso._id || null;
};

const appendRow = (tipoTabla, obj) => {
    const tbody = document.getElementById('Tbody');
    const tipoActual = document.getElementById('tabla')?.getAttribute('data-tipo');
    if (!tbody || tipoTabla !== tipoActual) return;

    const tr = document.createElement('tr');
    const fila = mapRowValues(tipoTabla, obj);
    fila.forEach((valor) => {
        const td = document.createElement('td');
        td.textContent = formatDisponible(valor);
        tr.appendChild(td);
    });
    tr.dataset.recurso = JSON.stringify(obj);
    tr.dataset.rowKey = getRowKey(tipoTabla, obj);
    tbody.appendChild(tr);



};

// Función para inicializar Supabase Realtime según documentación oficial
async function iniciarSupabaseRealTime(tipoFrontend, callback) {
    try {
        // Verificar que Supabase esté disponible
        if (typeof window.supabase === 'undefined') {
            return null;
        }

        // Obtener las tablas a escuchar (puede ser un array)
        const tablasSupabase = TABLA_SUPABASE[tipoFrontend];

        if (!supabaseClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }

        // Cerrar canales previos si existen
        if (realtimeChannels.length > 0) {
            realtimeChannels.forEach(channel => {
                supabaseClient.removeChannel(channel);
            });
            realtimeChannels = [];
        }

        // Función común para manejar cambios
        const handleChange = (payload) => {
            const nuevoRegistro = payload?.new;
            const antiguoRegistro = payload?.old;
            //console.log(`📥 [RealTime] Evento en ${payload.table}:`, payload.eventType);
            // console.log('Nuevo', nuevoRegistro);
            //   console.log('Antiguo', antiguoRegistro);

            if (typeof callback === 'function') {
                callback(payload);
                return;
            }

            // Para cualquier cambio, recargar la tabla completa
            //         console.log('🔄 [RealTime] Recargando tabla...');
            if (typeof cargarDatosTabla === 'function') {
                cargarDatosTabla().then(() => {
                    //   console.log('✅ [RealTime] Tabla actualizada');
                    if (typeof inicializarEventosTabla === 'function') {
                        inicializarEventosTabla();
                    }
                });
            }
        };

        // Crear un canal para cada tabla
        for (const tablaSupabase of tablasSupabase) {
            const channelName = `realtime-${tablaSupabase}-${Date.now()}`;

            const channel = supabaseClient
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: tablaSupabase
                    },
                    handleChange
                )
                .subscribe((status) => {
                    console.log(`📊 [RealTime] ${tablaSupabase}: ${status}`);
                    if (status === 'SUBSCRIBED') {
                        //            console.log(`✅ [RealTime] Conectado a: ${tablaSupabase}`);
                    } else if (status === 'CHANNEL_ERROR') {
                        //          console.error(`❌ [RealTime] Error en ${tablaSupabase} - Habilita Realtime en Supabase`);
                    }
                });

            realtimeChannels.push(channel);
        }

        //  console.log(`🎯 [RealTime] Escuchando ${tablasSupabase.length} tabla(s): ${tablasSupabase.join(', ')}`);
        //    console.log('⚠️ IMPORTANTE: Habilita Realtime en Supabase Dashboard → Database → Replication');

        return realtimeChannels;
    } catch (error) {
        console.error('❌ [RealTime] Error al inicializar:', error);
        return null;
    }
}

// Función para iniciar realtime en la tabla actual (llamada desde userLoader.js)
async function iniciarRealtimeEnTablaActual() {
    const tablaEl = document.getElementById('tabla');
    const tipo = tablaEl?.getAttribute('data-tipo');
    if (!tipo) {
        //   console.log('📋 [RealTime] No hay tabla con data-tipo en el componente actual');
        return;
    }

    // console.log(`🚀 [RealTime] Iniciando realtime para tabla: ${tipo}`);
    await iniciarSupabaseRealTime(tipo);
}

// Arranque automático: si ya existe una tabla al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    const tablaEl = document.getElementById('tabla');
    const tipo = tablaEl?.getAttribute('data-tipo');
    if (!tipo) {
        // console.log('📋 [RealTime] DOMContentLoaded: No hay tabla inicial, esperando carga de componente...');
        return;
    }

    await cargarDatosTabla();
    iniciarSupabaseRealTime(tipo);
});

async function cargarDatosTabla() {
    const tbody = document.getElementById('Tbody');
    const tipo = document.getElementById('tabla')?.getAttribute('data-tipo');
    if (!tbody || !tipo) {
        console.error('No se encontró tbody o data-tipo en la tabla');
        return;
    }

    const renderLista = (lista) => {
        tbody.innerHTML = ''
        const formatDisponible = (valor) => {
            if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
            if (valor === null || valor === undefined) return '-';
            if (valor === 'Sí' || valor === 'No') return valor;
            return valor;
        };

        lista.forEach((obj) => {
            const tr = document.createElement('tr');
            const fila = mapRowValues(tipo, obj);

            fila.forEach((valor) => {
                const td = document.createElement('td');
                td.textContent = formatDisponible(valor);
                tr.appendChild(td);
            });

            tr.dataset.recurso = JSON.stringify(obj);
            tr.dataset.rowKey = getRowKey(tipo, obj) || '';

            // Agregar clase y evento de clic para selección
            tr.classList.add('fila-recurso');
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', function () {
                // Usar la función global desde window
                if (typeof window.seleccionarFila === 'function') {
                    window.seleccionarFila(this);
                } else {
                    console.error('seleccionarFila no está definida');
                }
            });

            tbody.appendChild(tr);
        });

        // console.log(`✅ ${lista.length} filas renderizadas con eventos de clic`);
    };
    const apiBase = window.API_BASE_URL;
    let lista = [];
    if (tipo === 'solicitudes') {
        // Obtener boleta del usuario autenticado
        let boleta = null;
        try {
            const userData = localStorage.getItem('user_data');
            boleta = userData ? JSON.parse(userData).boleta : null;
        } catch (e) { boleta = null; }
        if (!boleta) {
            console.error('No se encontró boleta en user_data');
            return;
        }
        const resp = await fetch(`${apiBase}/auth/solicitudes?boleta=${boleta}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
        });
        const data = await resp.json();
        if (data.success && data.solicitudes) {
            // Unir todas las solicitudes en una sola lista
            lista = [
                ...(data.solicitudes.computadoras || []),
                ...(data.solicitudes.restiradores || []),
                ...(data.solicitudes.libros || [])
            ];
        } else {
            console.error('No se pudieron obtener las solicitudes:', data.message);
            return;
        }
    } else {
        const peticion = await fetch(`${apiBase}/auth/recursos?tipo=${tipo}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        const respuesta = await peticion.json();
        lista = Array.isArray(respuesta?.data) ? respuesta.data : (Array.isArray(respuesta) ? respuesta : []);
        if (!Array.isArray(lista)) {
            console.error('Respuesta de recursos no es lista', respuesta);
            return;
        }
    }
    renderLista(lista);
}

const ActualizarFilaTabla = (antiguo, nuevo) => {
    const tbody = document.getElementById('Tbody');
    const tipo = document.getElementById('tabla')?.getAttribute('data-tipo');
    if (!tbody || !tipo) return;

    const filas = Array.from(tbody.querySelectorAll('tr'));
    const antiguoVals = mapRowValues(tipo, antiguo);
    const nuevoVals = mapRowValues(tipo, nuevo);
    const rowKey = getRowKey(tipo, antiguo);

    const formatDisponible = (valor) => {
        if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
        if (valor === null || valor === undefined) return '-';
        if (valor === 'Sí' || valor === 'No') return valor;
        return valor;
    };

    const target = rowKey
        ? filas.find((fila) => fila.dataset.rowKey === String(rowKey))
        : filas.find((fila) => {
            const celdas = Array.from(fila.querySelectorAll('td'));
            return antiguoVals.every((valor, idx) => celdas[idx] && celdas[idx].textContent == valor);
        });

    if (!target) {
        console.warn('No se encontró la fila a actualizar');
        return;
    }

    const celdas = target.querySelectorAll('td');
    nuevoVals.forEach((valor, i) => {
        if (celdas[i]) celdas[i].textContent = formatDisponible(valor);
    });

    target.dataset.recurso = JSON.stringify(nuevo || {});
    target.dataset.rowKey = getRowKey(tipo, nuevo) || target.dataset.rowKey || '';
};

const eliminarFilaTabla = (antiguo) => {
    const tbody = document.getElementById('Tbody');
    const tipo = document.getElementById('tabla')?.getAttribute('data-tipo');
    if (!tbody || !tipo) return;

    const filas = Array.from(tbody.querySelectorAll('tr'));
    const antiguoVals = mapRowValues(tipo, antiguo);
    const rowKey = getRowKey(tipo, antiguo);

    const target = rowKey
        ? filas.find((fila) => fila.dataset.rowKey === String(rowKey))
        : filas.find((fila) => {
            const celdas = Array.from(fila.querySelectorAll('td'));
            return antiguoVals.every((valor, idx) => celdas[idx] && celdas[idx].textContent == valor);
        });

    if (target) {
        target.remove();
    } else {
        console.warn('No se encontró la fila a eliminar');
    }
};