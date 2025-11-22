window.onload = function() {
    setInterval(verificarCuenta(), 5000);
}
function verificarCuenta(datos){
    const datosRegistro = JSON.parse(localStorage.getItem('datosRegistro'));
    if(!datosRegistro){
        console.log("No hay datos de registro en localStorage");
        return;
    }
    fetch('http://localhost:3000/auth/verifyUser', {
        method: 'POST',
        headers: {  'Content-Type': 'application/json' },
        body: JSON.stringify({
            correo: datosRegistro.correo
        })
    }).then(res => res.json())
    .then(data => {
        if(data.verificado){
            console.log("Cuenta verificada");
            localStorage.removeItem('datosRegistro');
            window.location.href = '/pantallasUs/postInicio.html';
        } else {
            console.log("Cuenta no verificada aún");
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}