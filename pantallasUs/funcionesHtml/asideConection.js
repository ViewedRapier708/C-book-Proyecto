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

        // Si replace es true, elimina asides previos
        if (replace) {
            const prev = container.querySelectorAll('aside');
            prev.forEach(n => n.remove());
        } else {
            // Evita insertar duplicados exactos (opcional)
            if (container.querySelector('aside')) {
                return container.querySelector('aside');
            }
        }

        const aside = document.createElement('aside');

        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
            aside.innerHTML = await res.text();
            container.appendChild(aside);
            return aside;
        } catch (err) {
            console.error('Error loading aside:', err);
            throw err;
        }
    }

    // Exponer la función globalmente para poder crear el aside desde otros scripts
    window.createAside = createAside;

    // Auto-inject al cargar la página (opcional)
    document.addEventListener('DOMContentLoaded', () => {
        // Si quieres evitar la auto-inyección elimina esta llamada.
        createAside().catch(() => {/* manejo ya en la función */});
    });
})();