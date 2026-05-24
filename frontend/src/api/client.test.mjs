import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveApiBase } from './client.js';

test('uses same-origin auth on deployed hosts even when VITE_API_URL points to Azure', () => {
  const base = resolveApiBase({
    envApiBase: 'https://backendcbook-gfh3fdhpfbc0hrfs.mexicocentral-01.azurewebsites.net/',
    location: {
      origin: 'https://c-book-proyecto.vercel.app',
      hostname: 'c-book-proyecto.vercel.app',
      protocol: 'https:',
    },
  });

  assert.equal(base, '');
});

test('keeps explicit remote API base during localhost development', () => {
  const base = resolveApiBase({
    envApiBase: 'https://backendcbook-gfh3fdhpfbc0hrfs.mexicocentral-01.azurewebsites.net/',
    location: {
      origin: 'http://localhost:5173',
      hostname: 'localhost',
      protocol: 'http:',
    },
  });

  assert.equal(
    base,
    'https://backendcbook-gfh3fdhpfbc0hrfs.mexicocentral-01.azurewebsites.net'
  );
});

test('normalizes trailing slashes for same-origin API base values', () => {
  const base = resolveApiBase({
    envApiBase: 'https://c-book-proyecto.vercel.app/',
    location: {
      origin: 'https://c-book-proyecto.vercel.app',
      hostname: 'c-book-proyecto.vercel.app',
      protocol: 'https:',
    },
  });

  assert.equal(base, 'https://c-book-proyecto.vercel.app');
});
