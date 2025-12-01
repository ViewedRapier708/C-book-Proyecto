// ========================================
// FUNCIONES PARA CAMBIAR ENTRE FORMULARIOS
// ========================================

/**
 * Cambia del formulario de inicio de sesión al de registro
 */
function mostrarRegistro() {
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const titulo = document.querySelector('.container-title h2');
    
    // Cambiar título
    titulo.textContent = 'REGISTRO DE CUENTA';
    
    // Ocultar login, mostrar registro
    formLogin.style.display = 'none';
    formRegistro.style.display = 'block';
    
    // Limpiar mensajes previos
    const mensajes = document.querySelectorAll('.messaje');
    mensajes.forEach(msg => msg.textContent = '');
}

/**
 * Cambia del formulario de registro al de inicio de sesión
 */
function mostrarLogin() {
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const titulo = document.querySelector('.container-title h2');
    
    // Cambiar título
    titulo.textContent = 'INICIAR SESIÓN';
    
    // Ocultar registro, mostrar login
    formRegistro.style.display = 'none';
    formLogin.style.display = 'block';
    
    // Limpiar mensajes previos
    const mensajes = document.querySelectorAll('.messaje');
    mensajes.forEach(msg => msg.textContent = '');
}

