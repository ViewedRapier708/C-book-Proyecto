
function registrarUsuario(boleta) {
const boleta = document.getElementById("boleta").value;  
    if (boletasValidas.includes(boleta)) {
        const datosUsuario = {
            boleta: boleta,
            email: document.getElementById("correo").value
        };
    } else {
        alert("Boleta inválida. Registro fallido.");
        return;
    }
}

function agregarUsuario(boleta, nombre, apellido, email,password) {
    // Aquí puedes agregar la lógica para almacenar los datos del usuario
    alert("Usuario registrado: " + JSON.stringify({ boleta, nombre, apellido, email }));
    // Verificar que la boleta no exista ya
    if (usuarioValidos[boleta]) {
        console.warn("La boleta ya existe en usuarioValidos:", boleta);
        return ;
    }
    //Verifiacion de contraseña correcta
    if(password.length < 6){
        alert("");
        return ;
    }
    usuarioValidos[boleta] = password;
    console.log("Usuario agregado a usuarioValidos:", { boleta, nombre, apellido, email, password });
    return password;
}