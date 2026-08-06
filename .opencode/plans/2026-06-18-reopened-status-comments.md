# Ticket Reopened Status + Comments on Status Changes

## Summary

Add a new `reopened` status to the ticket state machine, save the reopen/resolve/close reason comments to the `ticket_comments` table, and set `reopened_at` timestamp when reopening.

## Changes

### 1. Database — Supabase

Add value to enum:
```sql
ALTER TYPE ticket_status ADD VALUE 'reopened';
```

### 2. Backend — `back/src/models/ModeloSoporte.js`

#### Status mappings
- `STATUS_TO_DB`: `Reabrir: 'reopened'` (was `'open'`), add `reopened: 'reopened'`
- `STATUS_FROM_DB`: add `reopened: 'Reabierto'`

#### `reabrirTicket()` (line 809)
- `status: 'open'` → `status: 'reopened'`
- Add `reopened_at: now` to update payload
- After `registrarHistorial()`, insert into `ticket_comments`:
  `{ ticket_id, body: cleanComment }` (omit `is_internal`, `author_user_id`)
- Update history `new_status` from `'open'` → `'reopened'`

#### `cambiarEstado()` (line 714)

**Reopen block** (line 743):
- Add `patch.reopened_at = now`
- After `registrarHistorial()`, insert into `ticket_comments` with `{ ticket_id, body: cleanComment }`

**Resolved block** (line 760):
- After `registrarHistorial()`, insert into `ticket_comments` with `{ ticket_id, body: cleanComment }`

**Closed block** (line 770):
- After `registrarHistorial()`, insert into `ticket_comments` with `{ ticket_id, body: cleanComment }`

**Fallback check** (line 784):
- Update to include `'reopened'`:
  `(nextStatus === 'open' || nextStatus === 'reopened')`

### 3. Frontend

#### `BandejaTickets.jsx`
- `ESTADOS_FILTRO`: add `'Reabierto'`
- `EstadoBadge` map: add `Reabierto: 'sup-estado-reabierto'`

#### `MisReportes.jsx`
- `ESTADOS_FILTRO`: add `'Reabierto'`
- `EstadoBadge` map: add `Reabierto: 'sup-estado-reabierto'`
- `abiertos` count (line 86): add `'Reabierto'` to the open-states array

#### `DetalleTicket.jsx`
- `EstadoBadge` map: add `Reabierto: 'sup-estado-reabierto'`

#### `frontend/src/styles/support.css`
- Add `.sup-estado-reabierto` class

### 4. State flow

From `Reabierto`, the same transitions apply as `Abierto`: can change to Pendiente, En espera, Resuelto, Cerrado. The `Reabrir` action is only available for Resuelto or Cerrado tickets (unchanged).
