(function initializeApiBase() {
  const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
  const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

  function readMetaOverride() {
    const meta = document.querySelector('meta[name="api-base-url"]');
    return meta?.content?.trim();
  }

  function isLocalAbsoluteUrl(url) {
    try {
      const parsed = new URL(url);
      return LOCAL_HOSTS.has(parsed.hostname);
    } catch {
      return false;
    }
  }

  function resolveBaseUrl() {
    const globalOverride = typeof window !== 'undefined' ? window.__API_BASE_URL__ : '';
    if (globalOverride && ABSOLUTE_URL_REGEX.test(globalOverride)) {
      return globalOverride.replace(/\/$/, '');
    }

    const metaOverride = readMetaOverride();
    if (metaOverride && ABSOLUTE_URL_REGEX.test(metaOverride)) {
      // Evita que un deploy en Vercel se quede apuntando a localhost por el meta tag.
      const currentHost = window.location?.hostname || '';
      const currentIsLocal = LOCAL_HOSTS.has(currentHost);
      const metaIsLocal = isLocalAbsoluteUrl(metaOverride);

      if (!(metaIsLocal && !currentIsLocal)) {
        return metaOverride.replace(/\/$/, '');
      }
    }

    // Por defecto, usar el mismo origen (ideal para Vercel: front + api en el mismo dominio)
    if (window.location?.origin) {
      return window.location.origin.replace(/\/$/, '');
    }

    return 'http://localhost:3000';
  }

  window.API_BASE_URL = resolveBaseUrl();
})();
