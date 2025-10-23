const usuarioValidos = {
    "123456": "password1",
    "234567": "password2",
    "345678": "password3"
};
//Funcion de auxiliar antes de la conexion con la base de datos
function iniciarSesion(e){
    e.preventDefault();
    const Nboleta = document.getElementById('boleta').value;
    const password = document.getElementById('password').value;

    if (usuarioValidos[Nboleta] === password) {
        alert('Inicio de sesión exitoso');
        window.location.href = './PantallaPostInicio/postInicio.html';
    } else {
        //Borrar campos
        document.getElementById('boleta').value = '';
        document.getElementById('password').value = '';
       alert('Usuario o contraseña incorrectos');
    }

} 
 