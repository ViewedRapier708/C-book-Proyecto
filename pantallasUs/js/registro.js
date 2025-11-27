async function registro(event){

        event.preventDefault();
    const url='http://localhost:3000/registro';
        //Se recuperan los datos del formulario
    const regularExpCorreo=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const regularExpPassword=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,16}$/;
    const boleta=document.getElementById("boleta").value;
    const correo=document.getElementById("correo").value;
    const password=document.getElementById("password").value;
    const confPsw=document.getElementById("confPsw").value;
    const mensajeDiv=document.querySelector('.messaje');
    const grupo=document.getElementById("grupo").value;

    //Validaciones para el registro
    if(boleta==="" || correo==="" || password===""){
       mensajeDiv.textContent='Por favor, complete todos los campos';
       mensajeDiv.style.color='red';
       return;
    }else if(boleta.length < 10){
        mensajeDiv.textContent='La boleta debe tener al menos 10 caracteres';
        mensajeDiv.style.color='red';
        return;
    }else if(!regularExpCorreo.test(correo)){
        mensajeDiv.textContent='El formato del correo es incorrecto';
        mensajeDiv.style.color='red';
        return;
    }else if(!regularExpPassword.test(password)){
        mensajeDiv.textContent='La contraseña debe tener entre 6 y 16 caracteres, incluir al menos una letra mayúscula, una letra minúscula, un número y un carácter especial';
        mensajeDiv.style.color='red';
        return;
    }
    else if(password.length < 6 || password.length > 16){
        mensajeDiv.textContent='El formato del correo es incorrecto';
        mensajeDiv.style.color='red';
        return;
    }
    else if(password!==confPsw){
        mensajeDiv.textContent='Las contraseñas no coinciden';
        mensajeDiv.style.color='red';
        return;
    }
    const response=0//Completar
    if (response.error){
        mensajeDiv.textContent=response.error;
        mensajeDiv.style.color='red';
        return;
    }
    if (!response.error) {
    const datosRegistro={
        boleta:boleta,
        correo:correo,
        grupo:grupo
    };   

    localStorage.setItem('datosRegistro', JSON.stringify(datosRegistro));
    //Redirigir a la página de confirmación de correo
    window.location.href='confirmacionCorreo.html';
    }

    

  
     // Guardar la boleta en el almacenamiento local
    //Petición al servidor
}
