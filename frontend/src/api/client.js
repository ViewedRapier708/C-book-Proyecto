const API_BASE = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

export function authUrl(endpoint) {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  console.log(`Constructed URL: ${API_BASE}/auth${normalizedEndpoint}`);
  return `${API_BASE}/auth${normalizedEndpoint}`;
}

async function request(endpoint, options = {}) {
  const url = authUrl(endpoint);
  console.log(`Requesting ${options.method || 'GET'} ${url}`);

  const config = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
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
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
