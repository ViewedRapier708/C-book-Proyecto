// Sistema de Filtros para Biblioteca Digital - CECyT 9
// Autor: Desarrollado para el sistema de gestión de biblioteca

// Variables globales
let librosOriginales = [];
let librosFiltrados = [];

// Referencias al DOM
const toggleBtn = document.getElementById('toggleFiltrosBtn');
const panelFiltros = document.getElementById('panelFiltros');
const filtroEditorial = document.getElementById('filtroEditorial');
const filtroDisponibilidad = document.getElementById('filtroDisponibilidad');
const filtroBusqueda = document.getElementById('filtroBusqueda');
const btnAplicar = document.getElementById('btnAplicarFiltros');
const btnLimpiar = document.getElementById('btnLimpiarFiltros');
const btnResetear = document.getElementById('btnResetearBusqueda');
const tablaBody = document.getElementById('tablaLibrosBody');
const mensajeSinResultados = document.getElementById('mensajeSinResultados');
const textoContador = document.getElementById('textoContador');

// Inicialización
document.addEventListener('DOMContentLoaded', inicializarFiltros);

function inicializarFiltros() {
    // Event listeners
    toggleBtn.addEventListener('click', togglePanelFiltros);
    btnAplicar.addEventListener('click', aplicarFiltros);
    btnLimpiar.addEventListener('click', limpiarFiltros);
    btnResetear.addEventListener('click', limpiarFiltros);
    
    // Aplicar filtros al presionar Enter en el buscador
    filtroBusqueda.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            aplicarFiltros();
        }
    });

    // Cargar datos iniciales
    cargarLibros();
}

// Toggle del panel de filtros
function togglePanelFiltros() {
    panelFiltros.classList.toggle('oculto');
    toggleBtn.classList.toggle('activo');
}

// Cargar libros desde la base de datos o array de prueba
async function cargarLibros() {
    try {
        // AQUÍ CONECTAS CON TU SUPABASE
        // const { data, error } = await supabase.from('libros').select('*');
        
        // Por ahora, datos de ejemplo:
        librosOriginales = [
            {
                id_libro: 'LIB001',
                titulo: 'Cálculo Diferencial e Integral',
                edicion: '5ta',
                editorial: 'Pearson',
                tomo: '1',
                cantidad_disponible: 5
            },
            {
                id_libro: 'LIB002',
                titulo: 'Física para Ciencias e Ingeniería',
                edicion: '9na',
                editorial: 'Cengage',
                tomo: '1',
                cantidad_disponible: 0
            },
            {
                id_libro: 'LIB003',
                titulo: 'Química Orgánica',
                edicion: '3ra',
                editorial: 'McGraw-Hill',
                tomo: '2',
                cantidad_disponible: 3
            },
            {
                id_libro: 'LIB004',
                titulo: 'Programación en C++',
                edicion: '7ma',
                editorial: 'Pearson',
                tomo: '1',
                cantidad_disponible: 8
            },
            {
                id_libro: 'LIB005',
                titulo: 'Álgebra Lineal',
                edicion: '4ta',
                editorial: 'Cengage',
                tomo: '1',
                cantidad_disponible: 2
            }
        ];

        librosFiltrados = [...librosOriginales];
        
        // Poblar opciones de editoriales
        poblarEditoriales();
        
        // Renderizar libros
        renderizarLibros(librosOriginales);
        
    } catch (error) {
        mostrarMensajeError('Error al cargar los libros de la base de datos');
    }
}

// Poblar select de editoriales dinámicamente
function poblarEditoriales() {
    const editorialesUnicas = [...new Set(librosOriginales.map(libro => libro.editorial))];
    
    filtroEditorial.innerHTML = '<option value="todos">Todas</option>';
    
    editorialesUnicas.forEach(editorial => {
        const option = document.createElement('option');
        option.value = editorial;
        option.textContent = editorial;
        filtroEditorial.appendChild(option);
    });
}

// Renderizar libros en la tabla
function renderizarLibros(libros) {
    tablaBody.innerHTML = '';
    
    if (libros.length === 0) {
        mensajeSinResultados.classList.remove('oculto');
        actualizarContador(0);
        return;
    }
    
    mensajeSinResultados.classList.add('oculto');
    
    libros.forEach((libro, index) => {
        const fila = document.createElement('tr');
        fila.className = 'filtered-in';
        fila.style.animationDelay = `${index * 0.05}s`;
        
        const disponible = libro.cantidad_disponible > 0;
        
        fila.innerHTML = `
            <td>${libro.id_libro}</td>
            <td>${libro.titulo}</td>
            <td>${libro.edicion}</td>
            <td>${libro.editorial}</td>
            <td>${libro.tomo}</td>
            <td class="${disponible ? 'disponible' : 'agotado'}">
                ${libro.cantidad_disponible} ${disponible ? '✓' : '✗'}
            </td>
        `;
        
        // Click para seleccionar libro
        fila.addEventListener('click', () => {
            fila.classList.toggle('selected');
        });
        
        tablaBody.appendChild(fila);
    });
    
    actualizarContador(libros.length);
}

// Aplicar filtros
function aplicarFiltros() {
    const editorialSeleccionada = filtroEditorial.value;
    const disponibilidadSeleccionada = filtroDisponibilidad.value;
    const busqueda = filtroBusqueda.value.toLowerCase().trim();
    
    librosFiltrados = librosOriginales.filter(libro => {
        // Filtro por editorial
        const cumpleEditorial = editorialSeleccionada === 'todos' || 
                                libro.editorial === editorialSeleccionada;
        
        // Filtro por disponibilidad
        let cumpleDisponibilidad = true;
        if (disponibilidadSeleccionada === 'disponible') {
            cumpleDisponibilidad = libro.cantidad_disponible > 0;
        } else if (disponibilidadSeleccionada === 'agotado') {
            cumpleDisponibilidad = libro.cantidad_disponible === 0;
        }
        
        // Filtro por búsqueda de texto
        const cumpleBusqueda = busqueda === '' || 
                               libro.titulo.toLowerCase().includes(busqueda) ||
                               libro.id_libro.toLowerCase().includes(busqueda);
        
        return cumpleEditorial && cumpleDisponibilidad && cumpleBusqueda;
    });
    
    renderizarLibros(librosFiltrados);
    
    // Cerrar panel después de aplicar
    panelFiltros.classList.add('oculto');
    toggleBtn.classList.remove('activo');
}

// Limpiar todos los filtros
function limpiarFiltros() {
    filtroEditorial.value = 'todos';
    filtroDisponibilidad.value = 'todos';
    filtroBusqueda.value = '';
    
    librosFiltrados = [...librosOriginales];
    renderizarLibros(librosOriginales);
    
    // Cerrar panel
    panelFiltros.classList.add('oculto');
    toggleBtn.classList.remove('activo');
}

// Actualizar contador de resultados
function actualizarContador(cantidad) {
    textoContador.innerHTML = `Mostrando <strong>${cantidad}</strong> ${cantidad === 1 ? 'libro' : 'libros'}`;
}

// Mostrar mensaje de error
function mostrarMensajeError(mensaje) {
    const alerta = document.createElement('div');
    alerta.className = 'mensaje-alerta error';
    alerta.textContent = mensaje;
    
    const container = document.querySelector('.container-solicitud-libros');
    container.insertBefore(alerta, container.firstChild);
    
    setTimeout(() => {
        alerta.remove();
    }, 5000);
}

// Estilos adicionales para disponibilidad
const style = document.createElement('style');
style.textContent = `
    tbody td.disponible {
        color: #28a745;
        font-weight: 600;
    }
    tbody td.agotado {
        color: #dc3545;
        font-weight: 600;
    }
`;
document.head.appendChild(style);