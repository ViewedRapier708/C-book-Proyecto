const modal = document.getElementById('modalFormulario');
const modalTitulo = document.getElementById('modal-titulo');
const btnAgregar = document.getElementById('btn-agregar');
const btnCerrar = document.querySelector('.modal-cerrar');
const btnLimpiar = document.getElementById('btn-limpiar');

// Abrir modal para AGREGAR
btnAgregar.addEventListener('click', () => {
    modalTitulo.textContent = 'Nueva Computadora';
    limpiarFormulario();
    modal.classList.add('activo');
});

// Abrir modal para EDITAR (delegación de eventos para filas dinámicas)
document.querySelector('tbody').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-editar')) {
        const fila = e.target.closest('tr');
        
        // Cargar datos de la fila en el formulario
        document.getElementById('procesador').value = fila.cells[1].textContent;
        document.getElementById('ram').value = fila.cells[2].textContent;
        document.getElementById('carrera').value = fila.cells[3].textContent;
        document.getElementById('estado').value = fila.cells[4].textContent.toLowerCase();
        
        modalTitulo.textContent = 'Editar Computadora';
        modal.classList.add('activo');
    }
});

// Cerrar modal
function cerrarModal() {
    modal.classList.remove('activo');
}

btnCerrar.addEventListener('click', cerrarModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModal();
});

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('procesador').value = '';
    document.getElementById('programas').value = '';
    document.getElementById('carrera').value = '';
    document.getElementById('ram').value = '';
    document.getElementById('estado').value = 'disponible';
}

btnLimpiar.addEventListener('click', limpiarFormulario);