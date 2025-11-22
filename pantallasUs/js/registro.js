function registro(event){
        event.preventDefault();
    //Se recuperan los datos del formulario
    const regularExpCorreo=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const regularExpPassword=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,16}$/;
    const boleta=document.getElementById("boleta").value;
    const correo=document.getElementById("correo").value;
    const password=document.getElementById("password").value;
    const confPsw=document.getElementById("confPsw").value;
    const mensajeDiv=document.querySelector('.messaje');

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
    //Almacenar los datos en un objeto y guardarlos en localStorage
    const datosRegistro={
        boleta:boleta,
        correo:correo,
        password:password,
        confPsw:confPsw
    };
    localStorage.setItem('datosRegistro', JSON.stringify(datosRegistro));

    //Petición al servidor
    const respuesta=fetch('http://localhost:3000/registro',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify({
            boleta:boleta,
            correo:correo,
            password:password,
            confPsw:confPsw
        })
    });
    respuesta.then(res=>res.json())
    .then(data=>{
        if(data.error){
            mensajeDiv.textContent = data.error;
            mensajeDiv.style.color = 'red';
            return;
        }
        window.location.href = '/pantallasUs/confirmacionCorreo.html';
       
    })
    .catch(error => {
        //Depuracion de errores
        return console.error('Error:', error);
    });
}