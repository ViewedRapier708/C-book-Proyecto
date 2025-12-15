(function initializeApiBase() {
  const DEFAULT_PORT = 3000;
  const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

  function readMetaOverride() {
    const meta = document.querySelector('meta[name="api-base-url"]');
    return meta?.content?.trim();
  }

  function resolveBaseUrl() {
    const globalOverride = typeof window !== 'undefined' ? window.__API_BASE_URL__ : '';
    if (globalOverride && ABSOLUTE_URL_REGEX.test(globalOverride)) {
      return globalOverride.replace(/\/$/, '');
    }

    const metaOverride = readMetaOverride();
    if (metaOverride && ABSOLUTE_URL_REGEX.test(metaOverride)) {
      return metaOverride.replace(/\/$/, '');
    }

    const protocol = window.location?.protocol?.startsWith('http') ? window.location.protocol : 'http:';
    const hostname = window.location?.hostname || 'localhost';
    // Si ya estamos en un puerto, usarlo; de lo contrario, usar el DEFAULT_PORT
    const portSegment = window.location?.port ? `:${window.location.port}` : `:${DEFAULT_PORT}`;

    return `${protocol}//${hostname}${portSegment}`.replace(/\/$/, '');
  }

  window.API_BASE_URL = resolveBaseUrl();
})();
