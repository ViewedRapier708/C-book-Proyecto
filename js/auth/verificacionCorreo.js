// verificacionCorreo.js
// Bucle de polling que consulta al backend

<<<<<<< HEAD
=======
const API_BASE = window.API_BASE_URL || 'http://localhost:3000';

// Intenta obtener datos de registro desde localStorage o, si no existen, desde query params y los guarda.
function obtenerDatosRegistro() {
    const almacenados = localStorage.getItem('datosRegistro');
    if (almacenados) {
        try {
            return JSON.parse(almacenados);
        } catch (e) {
            console.warn('datosRegistro en localStorage no es válido, se limpiará', e);
            localStorage.removeItem('datosRegistro');
        }
    }

    // Fallback: intentar leer boleta y correo de la URL (?boleta=...&correo=...)
    const params = new URLSearchParams(window.location.search);
    const boleta = params.get('boleta');
    const correo = params.get('correo');
    if (boleta && correo) {
        const datos = { boleta, correo };
        try {
            localStorage.setItem('datosRegistro', JSON.stringify(datos));
        } catch (e) {
            console.warn('No se pudo guardar datosRegistro desde query params', e);
        }
        return datos;
    }

    return null;
}

>>>>>>> 1a1caeb681b5f56f22bb59c4f76f7bdc8d624129
// Variables de control
let intervalId = null;
const INTERVALO_VERIFICACION = 3000; // 3 segundos
const MAX_INTENTOS = 100; // ~5 minutos
let intentos = 0;

// Referencias a elementos del DOM
let estadoVerificando, estadoExito, estadoEsperando, estadoError, mensajeEstado, mensajeError, contadorIntentos, btnVerificar;

function inicializarElementos() {
    estadoVerificando = document.getElementById('estado-verificando');
    estadoExito = document.getElementById('estado-exito');
    estadoEsperando = document.getElementById('estado-esperando');
    estadoError = document.getElementById('estado-error');
    mensajeEstado = document.getElementById('mensaje-estado');
    mensajeError = document.getElementById('mensaje-error');
    contadorIntentos = document.getElementById('contador-intentos');
    btnVerificar = document.getElementById('btn-verificar');

    if (btnVerificar) {
        btnVerificar.addEventListener('click', reiniciarVerificacion);
    }
}

// Función principal de verificación - Llama al backend
async function verificarUsuario() {
    try {
        intentos++;
        
        if (mensajeEstado) {
            mensajeEstado.textContent = `Verificando... (intento ${intentos})`;
        }

        if (contadorIntentos) {
            contadorIntentos.textContent = `Intento ${intentos} de ${MAX_INTENTOS}`;
        }

        console.log('Verificando... intento', intentos); //debug

        // Obtener datos del localStorage o de query params
        const datosRegistro = obtenerDatosRegistro();
        if (!datosRegistro) {
            mostrarEstadoError('No hay datos de registro. Por favor, regístrate primero.');
            detenerVerificacion();
            return;
        }

        const { boleta, correo, grupo } = datosRegistro;

        // Llamar al backend con los datos
        const API_BASE = window.API_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${API_BASE}/auth/verificar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ boleta, correo, grupo })
        });

        const data = await res.json();
        console.log('Verificación response:', data); //debug

        if (!res.ok && data.error) {
            // Error del servidor
            if (data.error.includes('sesión')) {
                mostrarEstadoError('No hay sesión activa. Por favor, regístrate nuevamente.');
                detenerVerificacion();
                return;
            }
        }

        if (data.confirmado) {
            // ¡Éxito! Correo confirmado y usuario creado
            console.log('¡Correo confirmado!'); //debug
            // Limpiar localStorage
            localStorage.removeItem('datosRegistro');
            detenerVerificacion();
            mostrarEstadoExito();
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 3000);
        } else {
            // Aún no confirmado
            mostrarEstadoEsperando();
            
            if (intentos >= MAX_INTENTOS) {
                detenerVerificacion();
                mostrarEstadoError('Tiempo de espera agotado. Verifica tu correo y vuelve a intentarlo.');
            }
        }

    } catch (err) {
        console.error('Error en verificación:', err);
        
        if (intentos >= MAX_INTENTOS) {
            detenerVerificacion();
            mostrarEstadoError('Error de conexión. Intenta más tarde.');
        }
    }
}

// Iniciar el bucle de verificación
function iniciarVerificacion() {
    if (intervalId) {
        clearInterval(intervalId);
    }
    
    intentos = 0;
    mostrarEstadoVerificando();
    
    // Primera verificación inmediata
    verificarUsuario();
    
    // Iniciar el intervalo para verificaciones periódicas
    intervalId = setInterval(verificarUsuario, INTERVALO_VERIFICACION);
    
    console.log('Bucle de verificación iniciado'); //debug
}

// Detener el bucle de verificación
function detenerVerificacion() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('Bucle de verificación detenido'); //debug
    }
}

// Funciones para mostrar estados
function mostrarEstadoVerificando() {
    if (estadoVerificando) estadoVerificando.style.display = 'block';
    if (estadoExito) estadoExito.style.display = 'none';
    if (estadoEsperando) estadoEsperando.style.display = 'none';
    if (estadoError) estadoError.style.display = 'none';
}

function mostrarEstadoExito() {
    if (estadoVerificando) estadoVerificando.style.display = 'none';
    if (estadoExito) estadoExito.style.display = 'block';
    if (estadoEsperando) estadoEsperando.style.display = 'none';
    if (estadoError) estadoError.style.display = 'none';
}

function mostrarEstadoEsperando() {
    if (estadoVerificando) estadoVerificando.style.display = 'none';
    if (estadoExito) estadoExito.style.display = 'none';
    if (estadoEsperando) estadoEsperando.style.display = 'block';
    if (estadoError) estadoError.style.display = 'none';
    if (contadorIntentos) {
        contadorIntentos.textContent = `Intento ${intentos} de ${MAX_INTENTOS}`;
    }
}

function mostrarEstadoError(mensaje) {
    if (estadoVerificando) estadoVerificando.style.display = 'none';
    if (estadoExito) estadoExito.style.display = 'none';
    if (estadoEsperando) estadoEsperando.style.display = 'none';
    if (estadoError) estadoError.style.display = 'block';
    if (mensajeError) mensajeError.textContent = mensaje;
}

// Reiniciar verificación manualmente
function reiniciarVerificacion() {
    intentos = 0;
    mostrarEstadoVerificando();
    iniciarVerificacion();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    inicializarElementos();
    
    // Iniciar verificación automática
    iniciarVerificacion();
});

// Detener verificación si el usuario sale de la página
window.addEventListener('beforeunload', detenerVerificacion);
