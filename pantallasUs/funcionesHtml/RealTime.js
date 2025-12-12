

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
                    const nuevoRegistro = payload?.new;
                    const AntiguoRegistro = payload?.old;
                    console.log('Nuevo' + nuevoRegistro);
                    console.log('Antiguo' + AntiguoRegistro);


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

async function cargarDatosTabla() {
    const tbody = document.getElementById('Tbody');
    const tipo = document.getElementById('tabla')?.getAttribute('data-tipo');
    console.log('Cargando datos de tipo: ' + tipo);
    if (!tbody || !tipo) {
        console.error('No se encontró tbody o data-tipo en la tabla');
        return;
    }

    const renderLista = (lista) => {
        tbody.innerHTML = '';
        lista.forEach(obj => {
            const tr = document.createElement('tr');
            Object.values(obj).forEach(valor => {
                const td = document.createElement('td');
                td.textContent = valor;
                tr.appendChild(td);
            });
            tr.dataset.recurso = JSON.stringify(obj);
            tbody.appendChild(tr);
        });
    };

    const peticion = await fetch(`http://localhost:3000/auth/recursos?tipo=${tipo}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    const respuesta = await peticion.json();

    console.log(respuesta);

    if (respuesta.error) {
        const errorMsj = `<div class="alert alert-danger animate__animated animate__slideInRight" style="margin: 10px;">${respuesta.error}</div>`;
        document.getElementById('alerta').innerHTML = errorMsj;
        return;
    }
    const lista = Array.isArray(respuesta?.data) ? respuesta.data : (Array.isArray(respuesta) ? respuesta : []);

    if (!Array.isArray(lista)) {
        console.error('Respuesta de recursos no es lista', respuesta);
        return;
    }

    renderLista(lista);
}

const ActualizarFilaTabla = (antiguo, nuevo) => {
    const tbody = document.getElementById('Tbody')
    const tipo = document.getElementById('tabla').getAttribute('data-tipo');
    const filas = tbody.querySelectorAll('tr');
   
    const recorrido = (filas, antiguo, nuevo) => {
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        celdas.forEach((celda,i) => {
            console.log('Antiguo' + antiguo[i]);
            console.log('Nuevo' + nuevo[i]);
            if (celda.textContent == antiguo[i]) {
                return; // Continuar con la siguiente fila si no coincide
            } else if (celda.textContent !== antiguo[i]) {
                celda.textContent = nuevo[i];
            }
        })
    });
}
    switch (tipo) {
        case 'computadora':
            recorrido(filas, antiguo, nuevo);
            break;
        case 'restirador':
            recorrido(filas, antiguo, nuevo);
            break;
        case 'libro':
            recorrido(filas, antiguo, nuevo);
            break;
        default:
            console.error('Tipo de recurso desconocido:', tipo);
            return;
    }
}
const eliminarFilaTabla = ( antiguo) => {
    const tbody = document.getElementById('Tbody')
    const tipo = document.getElementById('tabla').getAttribute('data-tipo');
    const filas = tbody.querySelectorAll('tr');
   
    const recorrido = (filas, antiguo) => {
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        celdas.forEach((celda,i) => {
            if (celda.textContent == antiguo[i]) {
                fila.remove();
            }
        })
    });
}
}