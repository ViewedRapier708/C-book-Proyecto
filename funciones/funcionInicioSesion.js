const usuarioValidos = {
    "123456": "password1",
    "234567": "password2",
    "345678": "password3"
};
//Funcion de auxiliar antes de la conexion con la base de datos
function iniciarSesion(event) {
    // Si la función se usa como handler de submit, prevenir el comportamiento por defecto
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    const boletaEl = document.getElementById('boleta');
    const passwordEl = document.getElementById('password');

    // Verificar que los elementos existan en el DOM
    if (!boletaEl || !passwordEl) {
        alert('No se encontraron los campos de boleta o contraseña en la página.');
        return false;
    }

    const Nboleta = boletaEl.value.trim();
    const password = passwordEl.value;

    // Verificar si usuarioValidos existe y tiene datos
    if (usuarioValidos && usuarioValidos[Nboleta] === password) {
        // GUARDAR LA SESIÓN
        sessionStorage.setItem('sesionActiva', 'true');
        sessionStorage.setItem('boleta', Nboleta);
        // Opcional: guardar timestamp de inicio de sesión
        sessionStorage.setItem('tiempoInicio', new Date().getTime());
        
        boletaEl.value = '';
        passwordEl.value = '';
        alert('Inicio de sesión exitoso');
        
        // Usar replace en lugar de href para evitar volver atrás
        window.location.replace('./pantallasUs/postInicio.html');
        return true;
    } else {
        // Limpiar campos y mostrar mensaje de error
        boletaEl.value = '';
        passwordEl.value = '';
        alert('Usuario o contraseña incorrectos');
        return false;
    }
}