function registro(event){
        event.preventDefault();
    //Se recuperan los datos del formulario
    const boleta=document.getElementById("boleta").value;
    const correo=document.getElementById("correo").value;
    const password=document.getElementById("password").value;
    const confPsw=document.getElementById("confPsw").value;
    const mensajeDiv=document.querySelector('.messaje');
    if(boleta==="" || correo==="" || password===""){
       mensajeDiv.textContent='Por favor, complete todos los campos';
       mensajeDiv.style.color='red';
       return;
    }
}
function verificarConfirmacion(){
    //En esta funcion se verificara si el usuario ya confirmo su correo, esto se hara mediante un bucle que cheque cada 3 segundos si el usuario ya confirmo su correo

}
