/**
 * Script para gestión de Restiradores en el panel de administrador
 */

let restiradoresData = [];
let modoEdicion = false;
let restiradorEditando = null;

// Cargar datos al mostrar el componente
async function cargarRestiradores() {
    try {
        restiradoresData = await obtenerRestiradores();
        mostrarRestiradoresEnTabla();
        actualizarEstadisticasRestiradores();
    } catch (error) {
        console.error('Error cargando restiradores:', error);
        alert('Error al cargar los restiradores');
    }
}

// Mostrar restiradores en la tabla
function mostrarRestiradoresEnTabla() {
    const tbody = document.querySelector('.container-restiradores tbody');
    
    if (!tbody) return;

    if (restiradoresData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No hay restiradores registrados</td></tr>';
        return;
    }

    tbody.innerHTML = restiradoresData.map(restirador => `
        <tr>
            <td>${restirador.no_restirador || 'N/A'}</td>
            <td>${restirador.no_inventario || 'N/A'}</td>
            <td>
                <span class="badge ${restirador.Disponible ? 'badge-disponible' : 'badge-ocupado'}">
                    ${restirador.Disponible ? 'Disponible' : 'No disponible'}
                </span>
                ${restirador.estado_de_material ? 
                    '<span class="badge badge-success">Buen estado</span>' : 
                    '<span class="badge badge-warning">Mal estado</span>'}
            </td>
            <td>
                <button class="btn-editar" onclick="editarRestirador(${restirador.id})">✏️ Editar</button>
                <button class="btn-eliminar" onclick="eliminarRestiradorConfirm(${restirador.id})">🗑️ Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// Actualizar estadísticas
function actualizarEstadisticasRestiradores() {
    const total = restiradoresData.length;
    const disponibles = restiradoresData.filter(r => r.Disponible && r.estado_de_material).length;
    const enUso = restiradoresData.filter(r => !r.Disponible).length;
    const mantenimiento = restiradoresData.filter(r => !r.estado_de_material).length;

    const estadisticasContainer = document.querySelector('.columna-estadisticas .container-datos-sistema');
    
    if (estadisticasContainer) {
        estadisticasContainer.innerHTML = `
            <h3>Estadísticas Restiradores</h3>
            <div class="dato-item">
                <span class="dato-label">Total Restiradores:</span>
                <span class="dato-value">${total}</span>
            </div>
            <div class="dato-item">
                <span class="dato-label">Disponibles:</span>
                <span class="dato-value">${disponibles}</span>
            </div>
            <div class="dato-item">
                <span class="dato-label">En Uso:</span>
                <span class="dato-value">${enUso}</span>
            </div>
            <div class="dato-item">
                <span class="dato-label">Mantenimiento:</span>
                <span class="dato-value">${mantenimiento}</span>
            </div>
            <div class="dato-item">
                <span class="dato-label">Última Actualización:</span>
                <span class="dato-value">${new Date().toLocaleDateString()}</span>
            </div>
        `;
    }
}

// Abrir modal para agregar
function abrirModalAgregar() {
    modoEdicion = false;
    restiradorEditando = null;
    
    document.getElementById('modal-titulo').textContent = 'Nuevo Restirador';
    document.getElementById('no_inventario').value = '';
    document.getElementById('no_restirador').value = '';
    document.getElementById('observacion').value = '';
    
    document.getElementById('modalFormulario').style.display = 'flex';
}

// Editar restirador
function editarRestirador(id) {
    modoEdicion = true;
    restiradorEditando = restiradoresData.find(r => r.id === id);
    
    if (!restiradorEditando) return;
    
    document.getElementById('modal-titulo').textContent = 'Editar Restirador';
    document.getElementById('no_inventario').value = restiradorEditando.no_inventario || '';
    document.getElementById('no_restirador').value = restiradorEditando.no_restirador || '';
    document.getElementById('observacion').value = restiradorEditando.Observacion || '';
    
    // Agregar campos de disponibilidad si no existen
    let disponibleField = document.getElementById('disponible');
    let estadoField = document.getElementById('estado_material');
    
    if (!disponibleField) {
        const formContainer = document.querySelector('.container-formulario');
        formContainer.innerHTML += `
            <div class="form-group">
                <label for="disponible">Disponible:</label>
                <select id="disponible">
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                </select>
            </div>
            <div class="form-group">
                <label for="estado_material">Estado del Material:</label>
                <select id="estado_material">
                    <option value="true">Buen estado</option>
                    <option value="false">Requiere mantenimiento</option>
                </select>
            </div>
        `;
        disponibleField = document.getElementById('disponible');
        estadoField = document.getElementById('estado_material');
    }
    
    disponibleField.value = restiradorEditando.Disponible ? 'true' : 'false';
    estadoField.value = restiradorEditando.estado_de_material ? 'true' : 'false';
    
    document.getElementById('modalFormulario').style.display = 'flex';
}

// Guardar restirador
async function guardarRestirador() {
    const no_inventario = document.getElementById('no_inventario').value.trim();
    const no_restirador = parseInt(document.getElementById('no_restirador').value);
    const observacion = document.getElementById('observacion').value.trim() || 'N/A';
    
    if (!no_inventario || !no_restirador) {
        alert('Por favor, completa todos los campos requeridos');
        return;
    }
    
    try {
        if (modoEdicion && restiradorEditando) {
            // Actualizar
            const disponible = document.getElementById('disponible')?.value === 'true';
            const estado_material = document.getElementById('estado_material')?.value === 'true';
            
            const resultado = await actualizarRestirador({
                id: restiradorEditando.id,
                no_inventario,
                no_restirador,
                Disponible: disponible,
                estado_de_material: estado_material,
                Observacion: observacion
            });
            
            if (resultado.success) {
                alert('Restirador actualizado exitosamente');
                cerrarModal();
                await cargarRestiradores();
            }
        } else {
            // Crear
            const resultado = await crearRestirador({
                no_inventario,
                no_restirador,
                Observacion: observacion
            });
            
            if (resultado.success) {
                alert('Restirador creado exitosamente');
                cerrarModal();
                await cargarRestiradores();
            }
        }
    } catch (error) {
        alert(error.message || 'Error al guardar el restirador');
    }
}

// Eliminar restirador
async function eliminarRestiradorConfirm(id) {
    if (!confirm('¿Estás seguro de eliminar este restirador?')) {
        return;
    }
    
    try {
        const resultado = await eliminarRestirador(id);
        
        if (resultado.success) {
            alert('Restirador eliminado exitosamente');
            await cargarRestiradores();
        }
    } catch (error) {
        alert(error.message || 'Error al eliminar el restirador');
    }
}

// Cerrar modal
function cerrarModal() {
    document.getElementById('modalFormulario').style.display = 'none';
    modoEdicion = false;
    restiradorEditando = null;
}

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('no_inventario').value = '';
    document.getElementById('no_restirador').value = '';
    document.getElementById('observacion').value = '';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Solo ejecutar si estamos en la página de restiradores
    if (!document.querySelector('.container-restiradores')) return;
    
    // Cargar datos
    cargarRestiradores();
    
    // Botón agregar
    const btnAgregar = document.getElementById('btn-agregar');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', abrirModalAgregar);
    }
    
    // Botón guardar
    const btnGuardar = document.getElementById('btn-guardar');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarRestirador);
    }
    
    // Botón limpiar
    const btnLimpiar = document.getElementById('btn-limpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormulario);
    }
    
    // Botón cerrar modal
    const btnCerrar = document.querySelector('.modal-cerrar');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarModal);
    }
    
    // Cerrar modal al hacer clic fuera
    const modalOverlay = document.getElementById('modalFormulario');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                cerrarModal();
            }
        });
    }
});
