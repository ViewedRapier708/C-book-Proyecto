function VizualizarPsw(checkboxId, inputId) {
    var checkbox = document.getElementById(checkboxId);
    var input = document.getElementById(inputId);
    if (checkbox.checked) {
        input.type = "text";
    } else {
        input.type = "password";
    }
}