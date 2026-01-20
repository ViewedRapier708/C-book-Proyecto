// Sistema de carga dinámica de componentes para el panel de estudiantes

document.addEventListener('DOMContentLoaded', function() {
    const contentLoader = document.getElementById('content-loader');
    const pageTitle = document.getElementById('page-title');
    const navLinks = document.querySelectorAll('.nav-link');
    const containerWrapper = document.getElementById('container-wrapper');
    const tituloSeccion = document.getElementById('titulo-seccion');

    // Función para actualizar la vista del contenedor según el componente
    const actualizarVistaContenedor = (componentName, title) => {
        if (!containerWrapper) return;
        
        // Actualizar el título de la sección
        if (tituloSeccion) {
            tituloSeccion.textContent = title;
        }
        
        // Cambiar clases según el componente
        if (componentName === 'inicio') {
            containerWrapper.classList.add('vista-inicio');
            containerWrapper.classList.remove('vista-tablas');
        } else {
            containerWrapper.classList.add('vista-tablas');
            containerWrapper.classList.remove('vista-inicio');
        }
    };

    // Sistema de carga de componentes
    const loadComponent = (componentName, title) => {
        if (!contentLoader) return;
        const componentPath = `componentes/${componentName}.html`;

        // Actualizar vista del contenedor antes de cargar
        actualizarVistaContenedor(componentName, title);

        fetch(componentPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: No se pudo cargar ${componentName}`);
                }
                return response.text();
            })
            .then(html => {
                // Quitar la clase de entrada para resetear cualquier animación previa
                contentLoader.classList.remove('component-enter');

                // Insertar el HTML del componente cargado en el contenedor
                contentLoader.innerHTML = html;
                
                // Forzar reflow (lectura de layout) para que el navegador reconozca el cambio
                // y permita reiniciar la animación al volver a añadir la clase
                void contentLoader.offsetWidth;
                // Añadir la clase que activa la animación de entrada del contenedor
                contentLoader.classList.add('component-enter');// Animación de entrada del contenedor principal
                
                // Detectar si usa sistema de cards o tablas
                const cardsContainers = contentLoader.querySelectorAll('[data-usa-cards="true"]');
                const usaCards = cardsContainers.length > 0;
                
                // Seleccionar elementos que tendrán animaciones internas específicas
                const tables = contentLoader.querySelectorAll('.container-tabla');
                const buttons = contentLoader.querySelectorAll('.container-btn-apartar');
                
                // Añadir clases de animación a cada tabla encontrada
                tables.forEach(el => el.classList.add('component-enter-table'));
                // Añadir clases de animación a cada grupo de botones encontrado
                buttons.forEach(el => el.classList.add('component-enter-buttons'));
                
                // Actualizar el título de la página si el elemento existe
                if (pageTitle) {
                    pageTitle.textContent = title;
                }

                // Inicializar cards o tablas según corresponda
                if (usaCards || tables.length > 0) {
                    // Dar tiempo para que el DOM se actualice
                    setTimeout(() => {
                        // Cargar datos (la función detectará si usa cards o tablas)
                        if (typeof cargarDatosEnTabla === 'function') {
                            cargarDatosEnTabla()
                                .then(() => {
                                    // Solo inicializar filtros de tabla si no usa cards
                                    if (!usaCards && typeof inicializarFiltrosTabla === 'function') {
                                        inicializarFiltrosTabla();
                                    }
                                    // Iniciar realtime después de cargar los datos
                                    if (typeof configurarTiempoRealParaTablaActual === 'function') {
                                        configurarTiempoRealParaTablaActual();
                                    }
                                })
                                .catch(err => {
                                    console.error('Error al cargar datos:', err);
                                });
                        }
                        // Configurar botón Solicitar
                        const btnApartar = contentLoader.querySelector('.btn-apartar');
                        if (btnApartar && !btnApartar.hasAttribute('data-listener-added')) {
                            btnApartar.style.display = 'none';
                            btnApartar.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                            
                                if (typeof abrirModal === 'function') {
                                    abrirModal();

                                }
                            });
                            btnApartar.setAttribute('data-listener-added', 'true');
                        }

                        // Configurar botones del modal
                

                        // Configurar cierre del modal al hacer clic fuera
                        const modal = contentLoader.querySelector('#modal-confirmacion');
                        if (modal && !modal.hasAttribute('data-listener-added')) {
                            modal.addEventListener('click', function(e) {
                                if (e.target === modal && typeof cerrarModal === 'function') {
                                    cerrarModal();
                                }
                            });
                            modal.setAttribute('data-listener-added', 'true');
                        }
                    }, 100);
                }
            })
            .catch(err => {
                console.error('Error cargando componente:', err);
                contentLoader.innerHTML = `
                    <div style="padding: 20px; color: #d32f2f; background: #ffebee; border-radius: 4px;">
                        <h3>Error al cargar componente</h3>
                        <p>${err.message}</p>
                    </div>
                `;
            });
    };


    // Configurar eventos de los enlaces de navegación
   let linkActivo = null;

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Si se vuelve a hacer clic en el mismo link, no hace nada
        if (link === linkActivo) return;

        const component = link.getAttribute('data-component');
        const title = link.getAttribute('data-title');

        if (component && title) {

            // Liberar el link anterior
            if (linkActivo) {
                linkActivo.classList.remove('active');
                linkActivo.classList.remove('disabled');
            }

            // Bloquear el link actual
            link.classList.add('active');
            link.classList.add('disabled');

            linkActivo = link;

            // Cargar componente
            loadComponent(component, title);
        }
    });
});
    // Cargar componente inicial (inicio)
    const inicioLink = Array.from(navLinks).find(link => 
        link.getAttribute('data-component') === 'inicio'
    );
    
    if (inicioLink) {
        inicioLink.click();
    } else {
        // Si no existe enlace de inicio, cargar directamente
        loadComponent('inicio', 'BIENVENIDO USUARIO');
    }
});
