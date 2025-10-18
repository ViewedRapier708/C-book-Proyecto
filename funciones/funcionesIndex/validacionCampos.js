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
    var patron = /[A-Za-z\d@$!%*?&]/;
    var codigo = String.fromCharCode(teclado);
    return patron.test(codigo);
}
