// ========================================
// SISTEMA DE CARDS - PANEL USUARIO
// Renderizado dinámico de cards con paginación y filtros personalizados
// ========================================

// Estado global del sistema de cards
const UserCards = {
    datos: [],
    datosFiltrados: [],
    paginaActual: 1,
    cardsPorPagina: 12,
    tipoActual: null,
    cardSeleccionada: null
};

// ========================================
// CÁLCULO ADAPTATIVO DE CARDS POR PÁGINA
// ========================================

/**
 * Calcula cuántas cards mostrar según el viewport
 */
function calcularCardsPorPagina() {
    const anchoViewport = window.innerWidth;
    const altoViewport = window.innerHeight;
    
    let columnas, filas;
    
    if (anchoViewport > 1200) {
        columnas = 4;
        filas = altoViewport > 800 ? 3 : 2;
    } else if (anchoViewport > 992) {
        columnas = 3;
        filas = 2;
    } else if (anchoViewport > 768) {
        columnas = 2;
        filas = 3;
    } else {
        columnas = 1;
        filas = 4;
    }
    
    return Math.max(columnas * filas, 4);
}

// Recalcular al cambiar tamaño (con debounce)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const nuevoCards = calcularCardsPorPagina();
        if (nuevoCards !== UserCards.cardsPorPagina) {
            UserCards.cardsPorPagina = nuevoCards;
            UserCards.paginaActual = 1;
            if (UserCards.tipoActual) {
                renderizarCards();
            }
        }
    }, 250);
});

// ========================================
// TEMPLATES DE CARDS POR TIPO
// ========================================

/**
 * Genera el HTML de una card según el tipo de recurso
 */
function generarCardHTML(item, tipo, index) {
    const templates = {
        'libro': () => templateCardLibro(item, index),
        'restirador': () => templateCardRestirador(item, index),
        'area-consulta': () => templateCardAreaConsulta(item, index),
        'solicitudes': () => templateCardSolicitud(item, index),
        'solicitudes-libros': () => templateCardSolicitudLibro(item, index)
    };
    
    return templates[tipo] ? templates[tipo]() : templateCardGenerico(item, index);
}

/**
 * Card para Libros (solicitud de préstamo)
 * Preparada para futuras imágenes de portada
 */
function templateCardLibro(item, index) {
    // Los datos del libro vienen anidados en item.libros
    const libroInfo = item.libros || {};
    const titulo = libroInfo.titulo || item.titulo || 'Sin título';
    const autor = libroInfo.autor || item.autor || 'Autor desconocido';
    const clasificacion = libroInfo.clasificacion || item.clasificacion || 'N/A';
    const tipoMaterial = libroInfo.tipo_material || item.tipo_material || 'N/A';
    
    const disponible = item.Disponible === true || item.Disponible === 'Sí' || item.Disponible === 'Si' || item.disponible === true;
    const badgeClass = disponible ? 'badge-disponible' : 'badge-no-disponible';
    const badgeText = disponible ? 'Disponible' : 'No disponible';
    
    // URL de imagen (placeholder por ahora, preparado para futuras imágenes)
    const imagenUrl = item.imagen_url || item.portada || libroInfo.portada || null;
    const imagenHTML = imagenUrl 
        ? `<img src="${imagenUrl}" alt="Portada de ${titulo}" class="user-card-imagen" loading="lazy">`
        : `<div class="user-card-imagen-placeholder">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                   <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>
               </svg>
           </div>`;
    
    // Guardar el item con datos aplanados para el modal
    const itemParaModal = {
        ...item,
        titulo,
        autor,
        clasificacion,
        tipo_material: tipoMaterial
    };
    
    return `
        <div class="user-card card-libro ${disponible ? '' : 'no-disponible'}" data-index="${index}" data-recurso='${JSON.stringify(itemParaModal)}'>
            <div class="user-card-imagen-container">
                ${imagenHTML}
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="user-card-body">
                <h3 class="user-card-libro-titulo" title="${titulo}">${titulo}</h3>
                <p class="user-card-libro-autor">${autor}</p>
                <div class="user-card-libro-detalles">
                    <div class="user-card-dato">
                        <span class="user-card-label">Clasificación</span>
                        <span class="user-card-value">${clasificacion}</span>
                    </div>
                    <div class="user-card-dato">
                        <span class="user-card-label">Tipo</span>
                        <span class="user-card-value">${tipoMaterial}</span>
                    </div>
                    <div class="user-card-dato">
                        <span class="user-card-label">Año</span>
                        <span class="user-card-value">${item.anio || 'N/A'}</span>
                    </div>
                    <div class="user-card-dato">
                        <span class="user-card-label">Ejemplar</span>
                        <span class="user-card-value">#${item.numero_ejemplar || item.id || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Card para Restiradores
 */
function templateCardRestirador(item, index) {
    const disponible = item.Disponible === true || item.Disponible === 'Sí' || item.Disponible === 'Si';
    const badgeClass = disponible ? 'badge-disponible' : 'badge-no-disponible';
    const badgeText = disponible ? 'Disponible' : 'Ocupado';
    
    return `
        <div class="user-card card-restirador" data-index="${index}" data-recurso='${JSON.stringify(item)}'>
            <div class="user-card-header">
                <span class="user-card-titulo">Restirador #${item.no_restirador || item.id || 'N/A'}</span>
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="user-card-body">
                <div class="user-card-dato">
                    <span class="user-card-label">Observaciones</span>
                    <span class="user-card-value user-card-value-truncate" title="${item.Observacion || 'Sin observaciones'}">
                        ${item.Observacion || 'Sin observaciones'}
                    </span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Card para Área de Consulta
 */
function templateCardAreaConsulta(item, index) {
    const disponible = item.Disponible === true || item.Disponible === 'Sí' || item.Disponible === 'Si';
    const badgeClass = disponible ? 'badge-disponible' : 'badge-no-disponible';
    const badgeText = disponible ? 'Disponible' : 'Ocupado';
    
    return `
        <div class="user-card card-consulta" data-index="${index}" data-recurso='${JSON.stringify(item)}'>
            <div class="user-card-header">
                <span class="user-card-titulo">Mesa #${item.no_mesa || item.id || 'N/A'}</span>
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="user-card-body">
                <div class="user-card-dato">
                    <span class="user-card-label">Capacidad</span>
                    <span class="user-card-value">${item.capacidad || 'N/A'} personas</span>
                </div>
                <div class="user-card-dato">
                    <span class="user-card-label">Ubicación</span>
                    <span class="user-card-value">${item.ubicacion || 'Biblioteca'}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Card para Mis Solicitudes de Recursos (cancelar)
 */
function templateCardSolicitud(item, index) {
    // Convertir estado a string (puede venir como número del backend)
    const estadoRaw = item.estado ?? item.estado_asistencia_id ?? 'pendiente';
    const estado = obtenerNombreEstado(estadoRaw);
    let badgeClass = 'badge-pendiente';
    if (estado === 'aprobado' || estado === 'aceptado') badgeClass = 'badge-aprobado';
    if (estado === 'rechazado') badgeClass = 'badge-rechazado';
    if (estado === 'cancelado') badgeClass = 'badge-cancelado';
    
    const cardClass = estado === 'pendiente' ? 'pendiente' : estado;
    
    // Formatear hora
    const horaLimite = item.hora_limite || item.horaLimite || 'N/A';
    
    return `
        <div class="user-card card-solicitud ${cardClass}" data-index="${index}" data-recurso='${JSON.stringify(item)}'>
            <div class="user-card-header">
                <span class="user-card-titulo">${capitalizarPrimeraLetra(item.tipo || 'Recurso')} #${item.id_recurso || item.idRecurso || 'N/A'}</span>
                <span class="badge ${badgeClass}">${capitalizarPrimeraLetra(estado)}</span>
            </div>
            <div class="user-card-body">
                <div class="user-card-dato">
                    <span class="user-card-label">Fecha solicitud</span>
                    <span class="user-card-value">${formatearFecha(item.fecha_solicitud || item.fechaSolicitud)}</span>
                </div>
                <div class="user-card-dato">
                    <span class="user-card-label">Hora solicitud</span>
                    <span class="user-card-value">${item.hora_solicitud || item.horaSolicitud || 'N/A'}</span>
                </div>
                <div class="user-card-dato">
                    <span class="user-card-label">Hora límite</span>
                    <span class="user-card-value">${horaLimite}</span>
                </div>
            </div>
            ${estado === 'pendiente' ? `
            <div class="user-card-footer">
                <button class="btn-accion btn-accion-danger" onclick="cancelarSolicitudCard(${item.id || item.solicitud_id}, event)">
                    Cancelar
                </button>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Card para Mis Solicitudes de Libros
 */
function templateCardSolicitudLibro(item, index) {
    // Convertir estado a string (puede venir como número del backend)
    const estadoRaw = item.estado ?? item.estado_asistencia_id ?? 'pendiente';
    const estado = obtenerNombreEstado(estadoRaw);
    let badgeClass = 'badge-pendiente';
    if (estado === 'aprobado' || estado === 'aceptado' || estado === 'listo para recoger') badgeClass = 'badge-aprobado';
    if (estado === 'rechazado') badgeClass = 'badge-rechazado';
    if (estado === 'cancelado') badgeClass = 'badge-cancelado';
    if (estado === 'en préstamo' || estado === 'prestado') badgeClass = 'badge-en-uso';
    
    return `
        <div class="user-card card-solicitud ${estado.replace(/\s+/g, '-')}" data-index="${index}" data-recurso='${JSON.stringify(item)}'>
            <div class="user-card-header">
                <span class="user-card-titulo" title="${item.titulo || 'Sin título'}">${item.titulo || 'Sin título'}</span>
                <span class="badge ${badgeClass}">${capitalizarPrimeraLetra(estado)}</span>
            </div>
            <div class="user-card-body">
                <div class="user-card-dato">
                    <span class="user-card-label">Ejemplar</span>
                    <span class="user-card-value">#${item.numero_ejemplar || item.ejemplar || 'N/A'}</span>
                </div>
                <div class="user-card-dato">
                    <span class="user-card-label">Fecha solicitud</span>
                    <span class="user-card-value">${formatearFecha(item.fecha_solicitud || item.fechaSolicitud)}</span>
                </div>
                <div class="user-card-dato">
                    <span class="user-card-label">Fecha límite</span>
                    <span class="user-card-value">${formatearFecha(item.fecha_limite || item.fechaLimite)}</span>
                </div>
            </div>
            ${estado === 'pendiente' ? `
            <div class="user-card-footer">
                <button class="btn-accion btn-accion-danger" onclick="cancelarSolicitudLibroCard(${item.id || item.solicitud_id}, event)">
                    Cancelar
                </button>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Card genérica para cualquier tipo no especificado
 */
function templateCardGenerico(item, index) {
    const campos = Object.entries(item).slice(0, 4); // Mostrar máximo 4 campos
    
    return `
        <div class="user-card" data-index="${index}" data-recurso='${JSON.stringify(item)}'>
            <div class="user-card-header">
                <span class="user-card-titulo">${item.titulo || item.nombre || item.id || 'Item'}</span>
            </div>
            <div class="user-card-body">
                ${campos.map(([key, value]) => `
                    <div class="user-card-dato">
                        <span class="user-card-label">${formatearNombreCampoCard(key)}</span>
                        <span class="user-card-value">${formatearValorCard(value)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ========================================
// RENDERIZADO DE CARDS
// ========================================

/**
 * Renderiza las cards en el contenedor
 */
function renderizarCards() {
    const container = document.getElementById('user-cards-grid');
    if (!container) return;
    
    const inicio = (UserCards.paginaActual - 1) * UserCards.cardsPorPagina;
    const fin = inicio + UserCards.cardsPorPagina;
    const datosPagina = UserCards.datosFiltrados.slice(inicio, fin);
    
    if (datosPagina.length === 0) {
        container.innerHTML = `
            <div class="user-sin-resultados">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                </svg>
                <p>No se encontraron resultados</p>
                <button class="btn-recargar" onclick="limpiarFiltrosCards()">Mostrar todos</button>
            </div>
        `;
    } else {
        container.innerHTML = datosPagina.map((item, i) => 
            generarCardHTML(item, UserCards.tipoActual, inicio + i)
        ).join('');
        
        // Agregar eventos de click a las cards
        container.querySelectorAll('.user-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Evitar selección si se hizo click en un botón
                if (e.target.closest('.btn-accion')) return;
                seleccionarCard(card);
            });
        });
    }
    
    renderizarPaginacion();
    actualizarContadorCards();
}

/**
 * Renderiza los controles de paginación
 */
function renderizarPaginacion() {
    const container = document.getElementById('user-paginacion');
    if (!container) return;
    
    const totalPaginas = Math.ceil(UserCards.datosFiltrados.length / UserCards.cardsPorPagina);
    
    if (totalPaginas <= 1) {
        container.innerHTML = '';
        return;
    }
    
    // Generar dots (máximo 7 visibles)
    let dotsHTML = '';
    const maxDots = 7;
    let startDot = Math.max(1, UserCards.paginaActual - Math.floor(maxDots / 2));
    let endDot = Math.min(totalPaginas, startDot + maxDots - 1);
    
    if (endDot - startDot < maxDots - 1) {
        startDot = Math.max(1, endDot - maxDots + 1);
    }
    
    for (let i = startDot; i <= endDot; i++) {
        dotsHTML += `<span class="user-paginacion-dot ${i === UserCards.paginaActual ? 'active' : ''}" 
                          onclick="irAPaginaCards(${i})"></span>`;
    }
    
    container.innerHTML = `
        <div class="user-paginacion-nav">
            <button class="user-paginacion-btn ${UserCards.paginaActual === 1 ? 'disabled' : ''}" 
                    onclick="navegarPaginaCards(-1)" ${UserCards.paginaActual === 1 ? 'disabled' : ''}>
                ←
            </button>
            <div class="user-paginacion-dots">${dotsHTML}</div>
            <button class="user-paginacion-btn ${UserCards.paginaActual === totalPaginas ? 'disabled' : ''}" 
                    onclick="navegarPaginaCards(1)" ${UserCards.paginaActual === totalPaginas ? 'disabled' : ''}>
                →
            </button>
        </div>
        <span class="user-paginacion-info">${UserCards.paginaActual} / ${totalPaginas}</span>
    `;
}

/**
 * Actualiza el contador de resultados
 */
function actualizarContadorCards() {
    const contador = document.getElementById('user-contador');
    if (!contador) return;
    
    const total = UserCards.datos.length;
    const filtrados = UserCards.datosFiltrados.length;
    
    if (filtrados < total) {
        contador.textContent = `${filtrados} de ${total}`;
        contador.classList.add('user-contador-activo');
    } else {
        contador.textContent = `${total} elementos`;
        contador.classList.remove('user-contador-activo');
    }
}

// ========================================
// NAVEGACIÓN Y SELECCIÓN
// ========================================

/**
 * Navega entre páginas
 */
function navegarPaginaCards(direccion) {
    const totalPaginas = Math.ceil(UserCards.datosFiltrados.length / UserCards.cardsPorPagina);
    const nuevaPagina = UserCards.paginaActual + direccion;
    
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        UserCards.paginaActual = nuevaPagina;
        renderizarCards();
    }
}

/**
 * Ir a una página específica
 */
function irAPaginaCards(pagina) {
    UserCards.paginaActual = pagina;
    renderizarCards();
}

/**
 * Selecciona una card
 */
function seleccionarCard(card) {
    // Si la card ya está seleccionada, desseleccionarla
    if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        UserCards.cardSeleccionada = null;
        window.recursoSeleccionado = null;
        
        // Ocultar botón de solicitar
        const btnApartar = document.querySelector('.container-btn-apartar .btn-apartar');
        if (btnApartar) {
            btnApartar.style.display = 'none';
        }
        return;
    }
    
    // Remover selección previa
    document.querySelectorAll('.user-card.selected').forEach(c => c.classList.remove('selected'));
    
    // Seleccionar nueva card
    card.classList.add('selected');
    UserCards.cardSeleccionada = card;
    
    // Actualizar recurso seleccionado global (para modal)
    const recursoData = card.dataset.recurso;
    if (recursoData) {
        window.recursoSeleccionado = JSON.parse(recursoData);
    }
    
    // Mostrar botón de solicitar si existe
    const btnApartar = document.querySelector('.container-btn-apartar .btn-apartar');
    if (btnApartar) {
        btnApartar.style.display = 'inline-block';
    }
}

// ========================================
// FILTROS PERSONALIZADOS
// ========================================

/**
 * Aplica filtros a los datos
 */
function aplicarFiltrosCards() {
    const filtrosContainer = document.querySelector('.user-filtros-grupo');
    if (!filtrosContainer) {
        UserCards.datosFiltrados = [...UserCards.datos];
        UserCards.paginaActual = 1;
        renderizarCards();
        return;
    }
    
    const filtros = {};
    filtrosContainer.querySelectorAll('.user-filtro-select, .user-filtro-input').forEach(input => {
        // Soporta tanto data-campo como data-filtro
        const campo = input.dataset.campo || input.dataset.filtro;
        const valor = input.value.toLowerCase().trim();
        if (campo && valor) {
            filtros[campo] = valor;
        }
    });
    
    if (Object.keys(filtros).length === 0) {
        UserCards.datosFiltrados = [...UserCards.datos];
    } else {
        UserCards.datosFiltrados = UserCards.datos.filter(item => {
            return Object.entries(filtros).every(([campo, valorFiltro]) => {
                // Para selects con valor vacío, mostrar todos
                if (valorFiltro === 'todos' || valorFiltro === '') return true;
                
                // Filtro especial: busqueda (busca en título Y autor para libros)
                if (campo === 'busqueda') {
                    // Soporta datos anidados (item.libros.titulo) y planos (item.titulo)
                    const libroInfo = item.libros || {};
                    const titulo = String(libroInfo.titulo || item.titulo || '').toLowerCase();
                    const autor = String(libroInfo.autor || item.autor || '').toLowerCase();
                    const nombre = String(item.nombre || '').toLowerCase();
                    return titulo.includes(valorFiltro) || 
                           autor.includes(valorFiltro) || 
                           nombre.includes(valorFiltro);
                }
                
                // Filtro especial: tipo_material (maneja datos anidados)
                if (campo === 'tipo_material') {
                    const libroInfo = item.libros || {};
                    const tipoMaterial = String(libroInfo.tipo_material || item.tipo_material || '').toLowerCase();
                    return tipoMaterial.includes(valorFiltro);
                }
                
                // Filtro especial: disponibilidad (maneja diferentes formatos)
                if (campo === 'disponibilidad') {
                    const disponible = item.disponible === 1 || 
                                       item.disponible === true || 
                                       item.disponible === 'Sí' ||
                                       item.disponible === 'si';
                    if (valorFiltro === 'disponible') return disponible;
                    if (valorFiltro === 'no-disponible') return !disponible;
                    return true;
                }
                
                // Filtro estándar
                const valorItem = String(item[campo] || '').toLowerCase();
                return valorItem.includes(valorFiltro);
            });
        });
    }
    
    UserCards.paginaActual = 1;
    renderizarCards();
}

/**
 * Limpia todos los filtros
 */
function limpiarFiltrosCards() {
    const filtrosContainer = document.querySelector('.user-filtros-grupo');
    if (filtrosContainer) {
        filtrosContainer.querySelectorAll('.user-filtro-select, .user-filtro-input').forEach(input => {
            if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
        });
    }
    
    UserCards.datosFiltrados = [...UserCards.datos];
    UserCards.paginaActual = 1;
    renderizarCards();
}

// ========================================
// INICIALIZACIÓN
// ========================================

/**
 * Inicializa el sistema de cards para un tipo de recurso
 */
function inicializarCards(datos, tipo) {
    UserCards.datos = datos || [];
    UserCards.datosFiltrados = [...UserCards.datos];
    UserCards.tipoActual = tipo;
    UserCards.paginaActual = 1;
    UserCards.cardsPorPagina = calcularCardsPorPagina();
    UserCards.cardSeleccionada = null;
    
    renderizarCards();
    
    // Configurar eventos de filtros
    const filtros = document.querySelectorAll('.user-filtro-select, .user-filtro-input');
    filtros.forEach(filtro => {
        const evento = filtro.tagName === 'SELECT' ? 'change' : 'input';
        filtro.addEventListener(evento, debounceCards(aplicarFiltrosCards, 300));
    });
}

// ========================================
// UTILIDADES
// ========================================

/**
 * Debounce para filtros
 */
function debounceCards(func, wait) {
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

/**
 * Convierte ID de estado a nombre legible
 */
function obtenerNombreEstado(estadoRaw) {
    // Si ya es string, devolverlo en minúsculas
    if (typeof estadoRaw === 'string') {
        return estadoRaw.toLowerCase();
    }
    
    // Mapeo de IDs de estado a nombres
    const mapeoEstados = {
        1: 'pendiente',
        2: 'aprobado',
        3: 'rechazado',
        4: 'cancelado',
        5: 'en préstamo',
        6: 'devuelto',
        7: 'listo para recoger'
    };
    
    return mapeoEstados[estadoRaw] || 'pendiente';
}

/**
 * Capitaliza la primera letra
 */
function capitalizarPrimeraLetra(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formatea fecha para mostrar
 */
function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    } catch {
        return fecha;
    }
}

/**
 * Formatea nombre de campo
 */
function formatearNombreCampoCard(key) {
    const mapeo = {
        'no_computadora': 'No. PC',
        'no_restirador': 'No. Restirador',
        'no_mesa': 'No. Mesa',
        'fecha_solicitud': 'Fecha',
        'hora_limite': 'Hora límite',
        'id_recurso': 'ID Recurso'
    };
    return mapeo[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formatea valor para mostrar
 */
function formatearValorCard(value) {
    if (value === true || value === 'true' || value === 'Sí') return '✅ Sí';
    if (value === false || value === 'false' || value === 'No') return '❌ No';
    if (value === null || value === undefined || value === '') return '-';
    return value;
}

// ========================================
// ACCIONES DE CARDS (Cancelar solicitudes)
// ========================================

/**
 * Cancela una solicitud de recurso desde la card
 */
async function cancelarSolicitudCard(solicitudId, event) {
    event.stopPropagation();
    
    if (!confirm('¿Estás seguro de cancelar esta solicitud?')) return;
    
    try {
        const API_BASE = window.API_BASE_URL;
        const response = await fetch(`${API_BASE}/auth/cancelar-solicitud/${solicitudId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const resultado = await response.json();
        
        if (response.ok && resultado.success) {
            mostrarNotificacion('✅ Solicitud cancelada exitosamente', 'success');
            // Recargar datos
            if (typeof cargarDatosEnTabla === 'function') {
                cargarDatosEnTabla();
            }
        } else {
            mostrarNotificacion(`❌ ${resultado.error || 'No se pudo cancelar'}`, 'error');
        }
    } catch (error) {
        console.error('Error al cancelar:', error);
        mostrarNotificacion('❌ Error de conexión', 'error');
    }
}

/**
 * Cancela una solicitud de libro desde la card
 */
async function cancelarSolicitudLibroCard(solicitudId, event) {
    event.stopPropagation();
    
    if (!confirm('¿Estás seguro de cancelar esta solicitud de libro?')) return;
    
    try {
        const API_BASE = window.API_BASE_URL;
        const response = await fetch(`${API_BASE}/auth/cancelar-solicitud-libro/${solicitudId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const resultado = await response.json();
        
        if (response.ok && resultado.success) {
            mostrarNotificacion('✅ Solicitud de libro cancelada', 'success');
            if (typeof cargarDatosEnTabla === 'function') {
                cargarDatosEnTabla();
            }
        } else {
            mostrarNotificacion(`❌ ${resultado.error || 'No se pudo cancelar'}`, 'error');
        }
    } catch (error) {
        console.error('Error al cancelar:', error);
        mostrarNotificacion('❌ Error de conexión', 'error');
    }
}

// Exponer funciones globalmente
window.inicializarCards = inicializarCards;
window.renderizarCards = renderizarCards;
window.navegarPaginaCards = navegarPaginaCards;
window.irAPaginaCards = irAPaginaCards;
window.aplicarFiltrosCards = aplicarFiltrosCards;
window.limpiarFiltrosCards = limpiarFiltrosCards;
window.cancelarSolicitudCard = cancelarSolicitudCard;
window.cancelarSolicitudLibroCard = cancelarSolicitudLibroCard;
window.UserCards = UserCards;
