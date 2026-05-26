function normalizeApiBase(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function isLocalHostname(hostname = '') {
  return ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(hostname);
}

export function resolveApiBase({ envApiBase, location } = {}) {
  const normalizedBase = normalizeApiBase(envApiBase);

  if (!location || !normalizedBase) {
    return normalizedBase;
  }

  if (isLocalHostname(location.hostname)) {
    return normalizedBase;
  }

  try {
    const apiUrl = new URL(normalizedBase);
    if (apiUrl.origin === location.origin) {
      return normalizedBase;
    }
  } catch {
    return normalizedBase;
  }

  // En despliegues web preferimos /auth same-origin para evitar cookies third-party.
  return '';
}

const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const runtimeLocation = typeof window !== 'undefined' ? window.location : undefined;
const API_BASE = resolveApiBase({
  envApiBase: viteEnv.VITE_API_URL,
  location: runtimeLocation,
});
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

export function authUrl(endpoint) {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  console.log(`Constructed URL: ${API_BASE}/auth${normalizedEndpoint}`);
  return `${API_BASE}/auth${normalizedEndpoint}`;
}

async function request(endpoint, options = {}) {
  let url = authUrl(endpoint);
  const { params, ...fetchOptions } = options;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) searchParams.set(key, String(value));
    }
    const qs = searchParams.toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }
  console.log(`Requesting ${fetchOptions.method || 'GET'} ${url}`);

  const config = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...fetchOptions.headers },
    ...fetchOptions,
  };
  const res = await fetch(url, config);

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const err = new Error(
      `El servidor no está disponible (${res.status}). Verifica que el backend esté ejecutándose.`
    );
    err.status = res.status;
    throw err;
  }

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401 && !endpoint.startsWith('/login')) {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }
    const msg = data.error || data.message || `Error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (endpoint, config = {}) => request(endpoint, { method: 'GET', ...config }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
