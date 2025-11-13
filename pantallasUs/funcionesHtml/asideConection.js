// /c:/Users/Alumno/Desktop/C-book-Proyecto/pantallasUs/funcionesHtml/asideConection.js

(function() {
    // Crea/inyecta el aside y devuelve la promesa que resuelve con el elemento creado.
    async function createAside({ path = './componentes/asideComponente.html', replace = false } = {}) {
        // Asegura que el DOM esté listo
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }

        // Busca o crea el contenedor
        let container = document.querySelector('.container-aside');
        if (!container) {
            container = document.createElement('div');
            container.className = 'container-aside';
            document.body.appendChild(container);
        }

        const aside = document.createElement('aside');
        aside.id = 'site-aside';
        aside.setAttribute('role', 'navigation');
        aside.setAttribute('aria-label', 'Menú lateral');

        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
            aside.innerHTML = await res.text();
            container.appendChild(aside);

            // Ensure toggle button and overlay exist for mobile UX
            setupMenuToggle({ asideContainer: container, aside });
            return aside;
        } catch (err) {
            console.error('Error loading aside:', err);
            throw err;
        }
    }

    function setupMenuToggle({ asideContainer, aside }) {
        // Create or get toggle button
        let toggle = document.querySelector('.menu-toggle');
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.className = 'menu-toggle';
            toggle.type = 'button';
            toggle.setAttribute('aria-label', 'Abrir menú');
            toggle.setAttribute('aria-controls', 'site-aside');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = '☰';
            document.body.appendChild(toggle);
        }

        // Create or get overlay
        let overlay = document.querySelector('.menu-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'menu-overlay';
            document.body.appendChild(overlay);
        }

        const openMenu = () => {
            aside.classList.add('open');
            asideContainer.classList.add('open');
            overlay.classList.add('show', 'active');
            document.body.classList.add('menu-open');
            toggle.setAttribute('aria-expanded', 'true');
            // Focus first link for accessibility
            const firstLink = aside.querySelector('a, button');
            if (firstLink) firstLink.focus({ preventScroll: true });
        };

        const closeMenu = () => {
            aside.classList.remove('open');
            asideContainer.classList.remove('open');
            overlay.classList.remove('show', 'active');
            document.body.classList.remove('menu-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.focus({ preventScroll: true });
        };

        const toggleMenu = () => {
            if (aside.classList.contains('open') || asideContainer.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }
        };

        toggle.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', closeMenu);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });
    }

    // Exponer la función globalmente para poder crear el aside desde otros scripts
    window.createAside = createAside;

    // Auto-inject al cargar la página (opcional)
    document.addEventListener('DOMContentLoaded', () => {
        // Si quieres evitar la auto-inyección elimina esta llamada.
        createAside().catch(() => {/* manejo ya en la función */});
    });
})();