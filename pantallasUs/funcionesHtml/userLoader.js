// Sistema de carga dinámica de componentes para el panel de estudiantes

document.addEventListener('DOMContentLoaded', function() {
    const contentLoader = document.getElementById('content-loader');
    const pageTitle = document.getElementById('page-title');
    const navLinks = document.querySelectorAll('.nav-link');

    // Sistema de carga de componentes
    const loadComponent = (componentName, title) => {
        if (!contentLoader) return;
        const componentPath = `componentes/${componentName}.html`;

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

                // Inicializar eventos de la tabla después de cargar el componente
                if (tables.length > 0) {
                    // Dar tiempo para que el DOM se actualice
                    setTimeout(() => {
                        // Cargar datos de la tabla del componente recién inyectado
                        if (typeof cargarDatosTabla === 'function') {
                            console.log('Solicitando datos para la tabla...');
                            cargarDatosTabla()
                                .then(() => {
                                    console.log('✅ Datos cargados en la tabla');
                                    
                                    // Inicializar filtros de la tabla
                                    if (typeof inicializarFiltrosTabla === 'function') {
                                        console.log('Inicializando filtros de tabla...');
                                        inicializarFiltrosTabla();
                                    }
                                    // Iniciar realtime después de cargar los datos
                                    if (typeof iniciarRealtimeEnTablaActual === 'function') {
                                        console.log('Iniciando Supabase Realtime...');
                                        iniciarRealtimeEnTablaActual();
                                    }
                                })
                                .catch(err => {
                                    console.error('Error al cargar datos de tabla:', err);
                                });
                        }
                        // Configurar botón Solicitar
                        const btnApartar = contentLoader.querySelector('.btn-apartar');
                        if (btnApartar && !btnApartar.hasAttribute('data-listener-added')) {
                            console.log('Configurando botón Solicitar...');
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
                        const btnConfirmar = contentLoader.querySelector('#btn-confirmar-solicitud');
                        if (btnConfirmar && !btnConfirmar.hasAttribute('data-listener-added')) {
                            btnConfirmar.addEventListener('click', function(e) {
                                e.preventDefault();
                                if (typeof confirmarSolicitud === 'function') {
                                    confirmarSolicitud();
                                }
                            });
                            btnConfirmar.setAttribute('data-listener-added', 'true');
                        }

                        const btnCancelar = contentLoader.querySelector('#btn-cancelar-solicitud');
                        if (btnCancelar && !btnCancelar.hasAttribute('data-listener-added')) {
                            btnCancelar.addEventListener('click', function(e) {
                                e.preventDefault();
                                if (typeof cerrarModal === 'function') {
                                    cerrarModal();
                                }
                            });
                            btnCancelar.setAttribute('data-listener-added', 'true');
                        }

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
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const component = link.getAttribute('data-component');
            const title = link.getAttribute('data-title');

            if (component && title) {
                // Actualizar estado activo
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

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
