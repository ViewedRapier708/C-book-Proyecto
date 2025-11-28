// verificacionCorreo.js
// Bucle de polling que consulta al backend

// Variables de control
let intervalId = null;
const INTERVALO_VERIFICACION = 3000; // 3 segundos
const MAX_INTENTOS = 100; // ~5 minutos
let intentos = 0;

// Referencias a elementos del DOM
let estadoVerificando, estadoExito, estadoEsperando, estadoError, mensajeEstado, mensajeError;

function inicializarElementos() {
    estadoVerificando = document.getElementById('estado-verificando');
    estadoExito = document.getElementById('estado-exito');
    estadoEsperando = document.getElementById('estado-esperando');
    estadoError = document.getElementById('estado-error');
    mensajeEstado = document.getElementById('mensaje-estado');
    mensajeError = document.getElementById('mensaje-error');
}

// Función principal de verificación - Llama al backend
async function verificarUsuario() {
    try {
        intentos++;
        
        if (mensajeEstado) {
            mensajeEstado.textContent = `Verificando... (intento ${intentos})`;
        }

        console.log('Verificando... intento', intentos); //debug

        // Obtener datos del localStorage
        const datosRegistro = localStorage.getItem('datosRegistro');
        if (!datosRegistro) {
            mostrarEstadoError('No hay datos de registro. Por favor, regístrate primero.');
            detenerVerificacion();
            return;
        }

        const { boleta, correo, grupo } = JSON.parse(datosRegistro);

        // Llamar al backend con los datos
        const res = await fetch('http://localhost:3000/auth/verificar', {
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
    mostrarEstadoVerificando();
    iniciarVerificacion();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    inicializarElementos();
    
    // Botón para reintentar verificación

    // Iniciar verificación automática
    iniciarVerificacion();
});

// Detener verificación si el usuario sale de la página
window.addEventListener('beforeunload', detenerVerificacion);
