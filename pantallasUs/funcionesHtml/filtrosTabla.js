// ========================================
// SISTEMA DE FILTROS PARA TABLAS
// ========================================

/**
 * Inicializa los filtros fuera de la tabla
 * Crea un contenedor de filtros arriba del container-tabla
 */
function inicializarFiltrosTabla() {
    const tabla = document.getElementById('tabla');
    const containerTabla = tabla?.closest('.container-tabla');
    const layout = containerTabla?.closest('.layout');
    if (!tabla || !containerTabla || !layout) return;

    // Verificar si ya existen filtros
    if (layout.querySelector('.filtros-container')) {
        return;
    }

    const thead = tabla.querySelector('thead');
    const headerRow = thead?.querySelector('tr');
    if (!headerRow) return;

    const headers = headerRow.querySelectorAll('th');

    // Preparar layout interno dentro del cuadro blanco (container-tabla)
    // Esto mantiene filtros y tabla dentro del mismo contenedor base.
    let tablaLayout = containerTabla.querySelector('.tabla-layout');
    let tablaWrapper = containerTabla.querySelector('.tabla-wrapper');

    if (!tablaLayout) {
        tablaLayout = document.createElement('div');
        tablaLayout.classList.add('tabla-layout');

        tablaWrapper = document.createElement('div');
        tablaWrapper.classList.add('tabla-wrapper');

        // Insertar el layout interno al inicio del contenedor blanco
        // y mover la tabla dentro del wrapper.
        containerTabla.insertBefore(tablaLayout, containerTabla.firstChild);
        tablaWrapper.appendChild(tabla);
        tablaLayout.appendChild(tablaWrapper);

        containerTabla.classList.add('container-tabla--with-filtros');
    }
    
    // Crear contenedor de filtros
    const filtrosContainer = document.createElement('div');
    filtrosContainer.classList.add('filtros-container');

    // Crear título y botón limpiar
    const filtrosHeader = document.createElement('div');
    filtrosHeader.classList.add('filtros-header');
    filtrosHeader.innerHTML = `
        <span class="filtros-titulo">🔍 Filtros de búsqueda</span>
        <button type="button" class="btn-limpiar-filtros" onclick="limpiarFiltros()">
            Limpiar filtros
        </button>
    `;
    filtrosContainer.appendChild(filtrosHeader);

    // Crear grid de filtros
    const filtrosGrid = document.createElement('div');
    filtrosGrid.classList.add('filtros-grid');

    headers.forEach((th, index) => {
        const filterItem = document.createElement('div');
        filterItem.classList.add('filtro-item');

        const label = document.createElement('label');
        label.textContent = th.textContent;
        label.classList.add('filtro-label');

        const input = document.createElement('input');
        input.type = 'text';
        input.classList.add('filtro-input');
        input.placeholder = th.textContent.substring(0, 12) + (th.textContent.length > 12 ? '...' : '');
        input.dataset.columnIndex = index;
        input.title = `Filtrar por: ${th.textContent}`;
        
        // Evento de filtrado en tiempo real
        input.addEventListener('input', debounce(function() {
            filtrarTabla();
        }, 300));

        // Limpiar filtro con Escape
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                filtrarTabla();
            }
        });

        filterItem.appendChild(label);
        filterItem.appendChild(input);
        filtrosGrid.appendChild(filterItem);
    });

    filtrosContainer.appendChild(filtrosGrid);

    // Insertar filtros dentro del cuadro blanco, al lado de la tabla
    // Siempre antes del wrapper de la tabla.
    tablaLayout = containerTabla.querySelector('.tabla-layout');
    tablaWrapper = containerTabla.querySelector('.tabla-wrapper');
    if (tablaLayout && tablaWrapper) {
        tablaLayout.insertBefore(filtrosContainer, tablaWrapper);
    }
    
}

/**
 * Filtra las filas de la tabla según los valores de los inputs
 */
function filtrarTabla() {
    const tabla = document.getElementById('tabla');
    const tbody = document.getElementById('Tbody') || tabla?.querySelector('tbody');
    const layout = tabla?.closest('.layout');
    if (!tabla || !tbody || !layout) return;

    const filtros = layout.querySelectorAll('.filtro-input');
    const filas = tbody.querySelectorAll('tr:not(.mensaje-sin-resultados)');

    // Obtener valores de filtros
    const valoresFiltros = Array.from(filtros).map(input => 
        input.value.toLowerCase().trim()
    );

    // Verificar si hay algún filtro activo
    const hayFiltroActivo = valoresFiltros.some(v => v !== '');

    let filasVisibles = 0;

    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        let mostrar = true;

        if (hayFiltroActivo) {
            mostrar = valoresFiltros.every((filtro, index) => {
                if (!filtro) return true;
                const celda = celdas[index];
                if (!celda) return true;
                const texto = celda.textContent.toLowerCase();
                return texto.includes(filtro);
            });
        }

        fila.style.display = mostrar ? '' : 'none';
        if (mostrar) filasVisibles++;
    });

    // Mostrar mensaje si no hay resultados
    mostrarMensajeNoResultados(tbody, filasVisibles, filas.length, hayFiltroActivo);
    
    // Actualizar contador
    actualizarContadorResultados(filasVisibles, filas.length);
}

/**
 * Actualiza el contador de resultados
 */
function actualizarContadorResultados(visibles, total) {
    const layout = document.getElementById('tabla')?.closest('.layout');
    if (!layout) return;
    
    let contador = layout.querySelector('.filtros-contador');
    
    if (!contador) {
        contador = document.createElement('span');
        contador.classList.add('filtros-contador');
        const header = layout.querySelector('.filtros-header');
        if (header) {
            header.insertBefore(contador, header.querySelector('.btn-limpiar-filtros'));
        }
    }

    const filtros = layout.querySelectorAll('.filtro-input');
    const hayFiltroActivo = Array.from(filtros).some(f => f.value.trim() !== '');

    if (hayFiltroActivo) {
        contador.textContent = `${visibles} de ${total} resultados`;
        contador.style.display = 'inline';
    } else {
        contador.style.display = 'none';
    }
}

/**
 * Muestra un mensaje cuando no hay resultados de filtrado
 */
function mostrarMensajeNoResultados(tbody, visibles, total, hayFiltro) {
    const mensajeExistente = tbody.querySelector('.mensaje-sin-resultados');
    if (mensajeExistente) {
        mensajeExistente.remove();
    }

    if (visibles === 0 && hayFiltro) {
        const numColumnas = tbody.closest('table').querySelectorAll('thead th').length;
        const tr = document.createElement('tr');
        tr.classList.add('mensaje-sin-resultados');
        tr.innerHTML = `
            <td colspan="${numColumnas}" style="
                text-align: center;
                padding: 2rem;
                color: #666;
                font-style: italic;
                background: #fafafa;
            ">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 2rem;">🔍</span>
                    <span>No se encontraron resultados</span>
                    <small style="color: #999;">Intenta con otros términos de búsqueda</small>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

/**
 * Limpia todos los filtros de la tabla
 */
function limpiarFiltros() {
    const filtros = document.querySelectorAll('.filtro-input');
    filtros.forEach(input => {
        input.value = '';
    });
    filtrarTabla();
}

/**
 * Debounce para evitar filtrados excesivos
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exponer funciones globalmente
window.inicializarFiltrosTabla = inicializarFiltrosTabla;
window.filtrarTabla = filtrarTabla;
window.limpiarFiltros = limpiarFiltros;
