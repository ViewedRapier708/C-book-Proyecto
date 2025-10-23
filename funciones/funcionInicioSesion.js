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
          boletaEl.value = '';
        passwordEl.value = '';
        alert('Inicio de sesión exitoso');
        // Redirigir a la página de usuario. Asegurarse de la ruta relativa correcta desde index.html
        // index.html está en la raíz del proyecto, y la página objetivo está en ./pantallasUs/postInicio.html
        window.location.href = './pantallasUs/postInicio.html';
        return true;
    } else {
        // Borrar campos
        // Limpiar campos y mostrar mensaje de error
        boletaEl.value = '';
        passwordEl.value = '';
        alert('Usuario o contraseña incorrectos');
        return false;
    }
}