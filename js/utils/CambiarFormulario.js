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

// ========================================
// FUNCIÓN DE REGISTRO (VALIDACIONES)
// ========================================

function registro(event) {
    event.preventDefault();
    
    // Expresiones regulares para validación
    const regularExpCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const regularExpPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,16}$/;
    
    // Recuperar datos del formulario de registro
    const boleta = document.getElementById('boleta-registro').value;
    const grupo = document.getElementById('grupo').value;
    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password-registro').value;
    const confPsw = document.getElementById('confirmar-password').value;
    const mensajeDiv = document.querySelector('#form-registro .messaje');

    // Validaciones
    if (boleta === '' || grupo === '' || correo === '' || password === '' || confPsw === '') {
        mensajeDiv.textContent = 'Por favor, complete todos los campos';
        mensajeDiv.style.color = 'red';
        return;
    }
    
    if (boleta.length < 10) {
        mensajeDiv.textContent = 'La boleta debe tener 10 caracteres';
        mensajeDiv.style.color = 'red';
        return;
    }
    
    if (grupo.length < 1) {
        mensajeDiv.textContent = 'Ingrese un grupo válido';
        mensajeDiv.style.color = 'red';
        return;
    }
    
    if (!regularExpCorreo.test(correo)) {
        mensajeDiv.textContent = 'El formato del correo es incorrecto';
        mensajeDiv.style.color = 'red';
        return;
    }
    
    if (!regularExpPassword.test(password)) {
        mensajeDiv.textContent = 'La contraseña debe tener entre 6 y 16 caracteres, incluir mayúscula, minúscula, número y carácter especial (@$!%*?&)';
        mensajeDiv.style.color = 'red';
        return;
    }
    
    if (password !== confPsw) {
        mensajeDiv.textContent = 'Las contraseñas no coinciden';
        mensajeDiv.style.color = 'red';
        return;
    }

    // Si todas las validaciones pasan
    mensajeDiv.textContent = '¡Registro exitoso!';
    mensajeDiv.style.color = 'green';
    
    // Aquí puedes agregar la petición al servidor
    // fetch('/api/registro', { ... })
    
    console.log('Datos del registro:', { boleta, grupo, correo, password });
    
    // Opcional: después de 2 segundos, volver al login
    setTimeout(() => {
        mostrarLogin();
        // Limpiar campos del registro
        document.getElementById('form-registro').reset();
    }, 2000);
}