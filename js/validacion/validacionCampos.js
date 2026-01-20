
//Funciones para validar los campos de los formularios al momento de escribir
function ValidarCamposNumericos(e) {
    var teclado =(document.all)? e.keyCode : e.which
    if (teclado== 8 ) return true;
    var patron =/[0-9]/;
    var codigo=String.fromCharCode(teclado);
    return patron.test(codigo);
}
function ValidarCamposPassword(e) {
    var teclado = (document.all) ? e.keyCode : e.which;
    if (teclado == 8) return true; // Backspace
    var patron = /[A-Za-z\d@$!%*?&.\ ]/;
    var codigo = String.fromCharCode(teclado);
    return patron.test(codigo);
}
function ValidarCamposLetras(e) {
    var teclado = (document.all) ? e.keyCode : e.which;
    if (teclado == 8) return true; // Backspace
    var patron = /[A-Za-z\s\'\á\é\í\ó\ú]/;
    var codigo = String.fromCharCode(teclado);
    return patron.test(codigo);
}

//Funcion para enviar el formulario despues de validar los campos
function EnviarFormulario() {
    if (ValidarCamposVacios()) {
        // Si los campos están vacíos, no se envía el formulario
        alert("Por favor, complete todos los campos.");
        return false;
    }
    // Si todos los campos son válidos, se puede enviar el formulario
    document.getElementById("form-registro").submit();
}
