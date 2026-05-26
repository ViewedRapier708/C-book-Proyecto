const { getSupportClient } = require('../config/supportDb');

const STATUS_TO_DB = {
  Nuevo: 'new',
  Abierto: 'open',
  Pendiente: 'pending',
  'En espera': 'waiting',
  Resuelto: 'resolved',
  Cerrado: 'closed',
  Reabrir: 'open',
  new: 'new',
  open: 'open',
  pending: 'pending',
  waiting: 'waiting',
  resolved: 'resolved',
  closed: 'closed',
};

const STATUS_FROM_DB = {
  new: 'Nuevo',
  open: 'Abierto',
  pending: 'Pendiente',
  waiting: 'En espera',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const PRIORITY_TO_DB = {
  Baja: 'low',
  Media: 'medium',
  Alta: 'high',
  Urgente: 'urgent',
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
};

const PRIORITY_FROM_DB = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const SUPPORT_ROLES = {
  ADMIN: 'support_admin',
  AGENT: 'support_agent',
};

function isSupportStaff(user) {
  return user?.tipoCuenta === 'soporte' && [SUPPORT_ROLES.ADMIN, SUPPORT_ROLES.AGENT].includes(user?.rol);
}

function isSupportAdmin(user) {
  return user?.tipoCuenta === 'soporte' && user?.rol === SUPPORT_ROLES.ADMIN;
}

function requireSupportStaff(user) {
  if (!isSupportStaff(user)) {
    const err = new Error('Solo usuarios de soporte pueden realizar esta accion');
    err.status = 403;
    throw err;
  }
}

function requireSupportAdmin(user) {
  if (!isSupportAdmin(user)) {
    const err = new Error('Solo administradores de soporte pueden realizar esta accion');
    err.status = 403;
    throw err;
  }
}

function actorName(user = {}) {
  return user.nombre || user.full_name || user.email || user.correo || user.boleta || 'Usuario';
}

function isTicketAssignedToUser(ticket = {}, user = {}) {
  if (!ticket.agente) return false;
  if (ticket.assignedAgentId && user?.supabaseUserId) {
    return ticket.assignedAgentId === user.supabaseUserId;
  }
  return ticket.agente === actorName(user);
}

function requireAssignedTicket(ticket, message) {
  if (ticket?.agente) return;
  const err = new Error(message);
  err.status = 409;
  throw err;
}

function requireTicketOwner(ticket, user) {
  if (!ticket?.agente) return;
  if (isTicketAssignedToUser(ticket, user)) return;
  const err = new Error('Solo el agente asignado puede modificar este ticket');
  err.status = 403;
  throw err;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function calculateElapsedMinutes(startValue, endValue = new Date().toISOString()) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.max(1, Math.round(diffMs / 60000));
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function clasificarPrioridadAutomatica(tipo, descripcion) {
  const tipoNorm = normalizeText(tipo);
  const descNorm = normalizeText(descripcion);
  const content = `${tipoNorm} ${descNorm}`;

  const urgentTerms = [
    'caido', 'caida', 'caido', 'no sirve', 'no funciona nada', 'sistema caido',
    'produccion detenida', 'bloqueado', 'bloquea', 'urgente', 'critico', 'critica',
    'sin acceso', 'no puedo entrar', 'no inicia sesion', 'no inicia sesion',
    'no deja iniciar sesion', 'error 500', 'error 503', 'timeout total',
  ];
  const highTerms = [
    'no funciona', 'falla', 'falla al', 'error', 'se rompe', 'no carga',
    'imposible', 'no permite', 'no deja', 'datos incorrectos', 'duplicado',
    'perdida de datos', 'lento', 'muy lento',
  ];
  const lowTerms = [
    'detalle visual', 'alineacion', 'alineado', 'texto cortado', 'typo',
    'ortografia', 'color', 'icono', 'diseno', 'mejora', 'sugerencia',
  ];

  if (includesAny(content, urgentTerms)) return 'Urgente';
  if (includesAny(tipoNorm, ['acceso', 'login', 'sesion', 'seguridad']) && includesAny(descNorm, ['no puedo', 'no deja', 'bloquea', 'error'])) {
    return 'Urgente';
  }
  if (includesAny(content, highTerms)) return 'Alta';
  if (includesAny(tipoNorm, ['rendimiento', 'funcional', 'datos'])) return 'Alta';
  if (includesAny(content, lowTerms) || includesAny(tipoNorm, ['visual'])) return 'Baja';
  return 'Media';
}

function logDbSuccess(operation, details = {}) {
  console.log(`[SoporteDB:${operation}] OK`, details);
}

function logDbError(operation, error) {
  console.error(`[SoporteDB:${operation}] ERROR`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  });
}

function ticketSelect() {
  return `
    *,
    incident_types(id,name,description),
    ticket_comments(id,body,is_internal,created_at),
    ticket_history(id,event_type,comment,old_status,new_status,metadata,created_at)
  `;
}

function mapTicket(row = {}) {
  const history = [...(row.ticket_history || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const comments = [...(row.ticket_comments || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const baseMinutes = Number(row.total_work_minutes) || 0;
  const activeMinutes = row.assigned_at && row.status !== 'closed'
    ? calculateElapsedMinutes(row.assigned_at)
    : 0;

  return {
    id: row.id,
    folio: row.ticket_number,
    tipo: row.incident_types?.name || 'Otro',
    tipoDescripcion: row.incident_types?.description || '',
    titulo: row.title || row.description?.slice(0, 80) || 'Reporte sin titulo',
    modulo: row.module || 'Otro modulo',
    descripcion: row.description || '',
    estado: STATUS_FROM_DB[row.status] || row.status,
    estadoRaw: row.status,
    prioridad: PRIORITY_FROM_DB[row.priority] || row.priority,
    prioridadRaw: row.priority,
    solicitante: row.requester_name || row.requester_boleta || 'Sin solicitante',
    solicitanteRol: row.requester_role || '',
    solicitanteCorreo: row.requester_email || '',
    solicitanteBoleta: row.requester_boleta || '',
    assignedAgentId: row.assigned_agent_id || null,
    assignedAt: row.assigned_at || null,
    agente: row.assigned_agent_name || null,
    creado: row.created_at,
    actualizado: row.updated_at,
    resuelto: row.resolved_at,
    cerrado: row.closed_at,
    tiempoBaseMinutos: baseMinutes,
    tiempoMinutos: baseMinutes + activeMinutes,
    solucion: row.solution_description || '',
    history: history.map(mapHistory),
    comentarios: comments.map(mapComment),
  };
}

function mapHistory(row = {}) {
  return {
    id: row.id,
    tipo: row.event_type,
    texto: row.comment || '',
    estadoAnterior: STATUS_FROM_DB[row.old_status] || row.old_status,
    estadoNuevo: STATUS_FROM_DB[row.new_status] || row.new_status,
    metadata: row.metadata || {},
    creado: row.created_at,
  };
}

function mapComment(row = {}) {
  return {
    id: row.id,
    texto: row.body,
    interno: Boolean(row.is_internal),
    creado: row.created_at,
  };
}

async function listarTipos() {
  const supabase = getSupportClient();
  const { data, error } = await supabase
    .from('incident_types')
    .select('id,name,description,is_active')
    .order('name', { ascending: true });

  if (error) {
    logDbError('listarTipos', error);
    throw error;
  }
  logDbSuccess('listarTipos', { rows: data?.length || 0, names: (data || []).map((t) => t.name) });
  return data || [];
}

function mapSupportProfile(profile = {}) {
  return {
    userId: profile.user_id,
    nombre: profile.full_name,
    email: profile.email,
    telefono: profile.phone || '',
    boleta: profile.boleta || '',
    rol: profile.role,
    estado: profile.status,
    activo: profile.status === 'active',
    creado: profile.created_at,
    actualizado: profile.updated_at,
  };
}

function sanitizeSupportSessionUser(sessionUser = {}) {
  if (!sessionUser) return null;
  const { tokens, iat, exp, ...publicData } = sessionUser;
  return publicData;
}

async function buscarPerfilSoporte(userId) {
  const supabase = getSupportClient();
  const { data, error } = await supabase
    .from('support_profiles')
    .select('user_id,full_name,email,phone,boleta,role,status,created_at,updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logDbError('buscarPerfilSoporte.select', error);
    throw error;
  }

  return data;
}

async function loginSoporte(identifier, password) {
  const supabase = getSupportClient();
  
  // Check if identifier is a boleta (10 digits)
  const isBoleta = /^\d{10}$/.test(identifier);
  
  let email;
  if (isBoleta) {
    // Lookup support user by boleta
    const { data: profile, error } = await supabase
      .from('support_profiles')
      .select('email')
      .eq('boleta', identifier)
      .maybeSingle();
    
    if (error || !profile) {
      const err = new Error('Usuario o contrasena incorrectos');
      err.status = 401;
      throw err;
    }
    email = profile.email;
  } else {
    email = String(identifier || '').trim().toLowerCase();
  }

  if (!email || !password) {
    const err = new Error('Usuario o contrasena incorrectos');
    err.status = 400;
    throw err;
  }

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !data?.user || !data?.session) {
    const err = new Error('Usuario o contrasena incorrectos');
    err.status = 401;
    throw err;
  }

  const profile = await buscarPerfilSoporte(data.user.id);

  if (!profile) {
    const err = new Error('Rol no autorizado para el modulo de soporte');
    err.status = 403;
    throw err;
  }

  if (profile.status !== 'active') {
    const err = new Error('Cuenta inactiva. Contacte al administrador de soporte');
    err.status = 403;
    throw err;
  }

  if (![SUPPORT_ROLES.ADMIN, SUPPORT_ROLES.AGENT].includes(profile.role)) {
    const err = new Error('Rol no autorizado para el modulo de soporte');
    err.status = 403;
    throw err;
  }

  return {
    session: data.session,
    user: data.user,
    profile,
  };
}

async function refrescarSesionSoporte(refreshToken) {
  const supabase = getSupportClient();
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error) {
      logDbError('refrescarSesionSoporte', error);
      return { success: false, error: error.message };
    }

    return { success: true, session: data.session, user: data.user };
  } catch (err) {
    logDbError('refrescarSesionSoporte.catch', err);
    return { success: false, error: 'Error interno' };
  }
}

async function revocarSesionSoporte(accessToken) {
  const supabase = getSupportClient();
  try {
    if (!accessToken) return { success: false, error: 'Access token invalido' };

    const { error } = await supabase.auth.admin.signOut(accessToken);
    if (error) {
      logDbError('revocarSesionSoporte', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    logDbError('revocarSesionSoporte.catch', err);
    return { success: false, error: 'Error interno' };
  }
}

async function listarAgentes(user) {
  requireSupportAdmin(user);
  const supabase = getSupportClient();
  const { data, error } = await supabase
    .from('support_profiles')
    .select('user_id,full_name,email,phone,boleta,role,status,created_at,updated_at')
    .in('role', [SUPPORT_ROLES.ADMIN, SUPPORT_ROLES.AGENT])
    .order('created_at', { ascending: false });

  if (error) {
    logDbError('listarAgentes.select', error);
    throw error;
  }

  return (data || []).map(mapSupportProfile);
}

async function crearAgente(payload, user) {
  requireSupportAdmin(user);
  const supabase = getSupportClient();
  const nombre = String(payload.nombre || payload.fullName || '').trim();
  const email = String(payload.email || payload.correo || '').trim().toLowerCase();
  const password = String(payload.password || payload.contrasena || '').trim();
  const confirmPassword = String(payload.confirmPassword || payload.confirmarContrasena || '').trim();
  const telefono = String(payload.telefono || payload.phone || '').trim() || null;
  const boleta = String(payload.boleta || '').trim() || null;
  const rol = SUPPORT_ROLES.AGENT;
  const estado = 'active';

  if (!nombre || !email || !password) {
    const err = new Error('Nombre, correo y contrasena temporal son obligatorios');
    err.status = 400;
    throw err;
  }
  if (!confirmPassword) {
    const err = new Error('Debes confirmar la contrasena');
    err.status = 400;
    throw err;
  }
  if (password !== confirmPassword) {
    const err = new Error('La confirmacion de contrasena no coincide');
    err.status = 400;
    throw err;
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from('support_profiles')
    .select('user_id,email')
    .eq('email', email)
    .maybeSingle();

  if (existingError) {
    logDbError('crearAgente.existingProfile', existingError);
    throw existingError;
  }
  if (existingProfile) {
    const err = new Error('Ya existe una cuenta de soporte con ese correo');
    err.status = 409;
    throw err;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: nombre,
      role: rol,
      source: 'cbook_support',
    },
  });

  if (authError) {
    logDbError('crearAgente.auth', authError);
    const err = new Error(authError.message?.toLowerCase().includes('already') ? 'Ya existe una cuenta con ese correo' : authError.message);
    err.status = authError.message?.toLowerCase().includes('already') ? 409 : 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('support_profiles')
    .insert({
      user_id: authData.user.id,
      full_name: nombre,
      email,
      phone: telefono,
      boleta,
      role: rol,
      status: estado,
      created_by: user.supabaseUserId || user.userId || null,
    })
    .select('user_id,full_name,email,phone,boleta,role,status,created_at,updated_at')
    .single();

  if (error) {
    logDbError('crearAgente.profile', error);
    await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
    throw error;
  }

  return mapSupportProfile(data);
}


async function asegurarTipo(nombre) {
  const supabase = getSupportClient();
  const cleanName = String(nombre || 'Otro').trim() || 'Otro';
  const { data: existente, error } = await supabase
    .from('incident_types')
    .select('id,name,description,is_active')
    .ilike('name', cleanName)
    .maybeSingle();

  if (error) {
    logDbError('asegurarTipo.select', error);
    throw error;
  }
  if (existente) return existente;

  const { data, error: insertError } = await supabase
    .from('incident_types')
    .insert({ name: cleanName, description: 'Categoria creada desde C-Book', is_active: true })
    .select('id,name,description,is_active')
    .single();

  if (insertError) {
    logDbError('asegurarTipo.insert', insertError);
    throw insertError;
  }
  logDbSuccess('asegurarTipo.insert', { id: data?.id, name: data?.name });
  return data;
}

async function crearTicket(payload, user) {
  const supabase = getSupportClient();
  const tipo = await asegurarTipo(payload.tipo);
  const title = String(payload.titulo || payload.descripcion || '').trim().slice(0, 160);
  const description = String(payload.descripcion || '').trim();

  if (!description) {
    const err = new Error('La descripcion es obligatoria');
    err.status = 400;
    throw err;
  }

  const requesterEmail = user.email || user.correo || payload.correo || payload.email || null;
  const requesterName = user.nombre || payload.nombre || requesterEmail || 'Usuario externo';
  const requesterRole = user.rol || payload.rol || 'externo';
  const prioridadCalculada = clasificarPrioridadAutomatica(tipo?.name || payload.tipo, description);

  if (!requesterEmail && !user.boleta) {
    const err = new Error('El correo es obligatorio para reportar soporte');
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      incident_type_id: tipo.id,
      title: title || 'Reporte sin titulo',
      module: payload.modulo || 'Otro modulo',
      description,
      priority: PRIORITY_TO_DB[prioridadCalculada] || 'medium',
      requester_name: requesterName,
      requester_email: requesterEmail,
      requester_boleta: user.boleta || null,
      requester_role: requesterRole,
      status: 'new',
    })
    .select(ticketSelect())
    .single();

  if (error) {
    logDbError('crearTicket.insert', error);
    throw error;
  }
  logDbSuccess('crearTicket.insert', { id: data.id, ticket_number: data.ticket_number, requester_email: requesterEmail });
  await registrarHistorial(data.id, 'created', { ...user, nombre: requesterName, email: requesterEmail }, { new_status: 'new', comment: `Ticket creado por ${requesterName}` });
  await crearNotificacion(data.id, requesterEmail, 'ticket_created', `Nuevo ticket ${data.ticket_number}`, description);
  return obtenerTicket(data.id, user);
}

async function listarTickets(filtros = {}, user) {
  const supabase = getSupportClient();
  const page = Math.max(Number(filtros.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filtros.limit) || 50, 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('tickets')
    .select(ticketSelect(), { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (!isSupportStaff(user)) {
    query = query.eq('requester_boleta', user.boleta);
  }
  if (filtros.mine === 'true') {
    query = query.eq('requester_boleta', user.boleta);
  }
  if (filtros.estado && filtros.estado !== 'Todos') {
    query = query.eq('status', STATUS_TO_DB[filtros.estado] || filtros.estado);
  }
  if (filtros.prioridad && filtros.prioridad !== 'Todos') {
    query = query.eq('priority', PRIORITY_TO_DB[filtros.prioridad] || filtros.prioridad);
  }
  const { data, error, count } = await query;
  if (error) {
    logDbError('listarTickets.select', error);
    throw error;
  }

  let tickets = (data || []).map(mapTicket);
  if (filtros.q) {
    const q = filtros.q.toLowerCase();
    tickets = tickets.filter((t) =>
      [t.folio, t.titulo, t.solicitante, t.solicitanteBoleta, t.modulo].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )
    );
  }
  if (filtros.tipo && filtros.tipo !== 'Todos') {
    tickets = tickets.filter((t) => t.tipo === filtros.tipo);
  }
  logDbSuccess('listarTickets.select', { rows: tickets.length, total: count, filtros });
  return { tickets, total: count ?? tickets.length, page, limit };
}

async function obtenerTicket(id, user) {
  const supabase = getSupportClient();
  const { data, error } = await supabase
    .from('tickets')
    .select(ticketSelect())
    .or(`id.eq.${id},ticket_number.eq.${id}`)
    .maybeSingle();

  if (error) {
    logDbError('obtenerTicket.select', error);
    throw error;
  }
  if (!data) {
    const err = new Error('Ticket no encontrado');
    err.status = 404;
    throw err;
  }
  if (!isSupportStaff(user) && data.requester_boleta && data.requester_boleta !== user?.boleta) {
    const err = new Error('No tienes permiso para ver este ticket');
    err.status = 403;
    throw err;
  }
  if (
    isSupportStaff(user)
    && user?.rol === SUPPORT_ROLES.AGENT
    && data.assigned_agent_name
    && data.assigned_agent_name !== actorName(user)
  ) {
    const err = new Error(`Este ticket esta asignado a ${data.assigned_agent_name}`);
    err.status = 403;
    throw err;
  }
  logDbSuccess('obtenerTicket.select', { id: data.id, ticket_number: data.ticket_number, status: data.status });
  const mapped = mapTicket(data);
  if (!isSupportStaff(user)) {
    mapped.comentarios = mapped.comentarios.filter((c) => !c.interno);
    mapped.history = mapped.history.filter((h) => !String(h.texto || '').toLowerCase().includes('nota interna'));
  }
  return mapped;
}

async function tomarTicket(id, user) {
  requireSupportStaff(user);
  const supabase = getSupportClient();
  const current = await obtenerTicket(id, user);
  if (['resolved', 'closed'].includes(current.estadoRaw)) {
    const err = new Error('No se puede tomar un ticket resuelto o cerrado');
    err.status = 409;
    throw err;
  }
  if (current.agente) {
    const err = new Error(current.agente === actorName(user)
      ? 'Ya tienes asignado este ticket'
      : `Este ticket ya fue tomado por ${current.agente}`);
    err.status = 409;
    throw err;
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('tickets')
    .update({
      status: 'open',
      assigned_agent_id: user.supabaseUserId || null,
      assigned_agent_name: actorName(user),
      assigned_at: now,
      updated_at: now,
    })
    .eq('id', current.id)
    .is('assigned_agent_name', null)
    .select(ticketSelect())
    .maybeSingle();

  if (error) {
    logDbError('tomarTicket.update', error);
    throw error;
  }
  if (!data) {
    const latest = await obtenerTicket(id, user);
    const err = new Error(latest.agente
      ? `Este ticket ya fue tomado por ${latest.agente}`
      : 'No se pudo tomar el ticket');
    err.status = 409;
    throw err;
  }
  logDbSuccess('tomarTicket.update', { id: data.id, assigned_agent_name: actorName(user) });
  await registrarHistorial(current.id, 'assigned', user, {
    old_status: current.estadoRaw,
    new_status: 'open',
    comment: `Ticket tomado por ${actorName(user)}`,
  });
  return mapTicket(data);
}

async function cambiarEstado(id, estado, user, comentario = '') {
  requireSupportStaff(user);
  const supabase = getSupportClient();
  const current = await obtenerTicket(id, user);
  const action = String(estado || '').trim();
  const nextStatus = STATUS_TO_DB[action];
  const isReopenAction = action === 'Reabrir';
  if (!nextStatus) {
    const err = new Error('Estado no valido');
    err.status = 400;
    throw err;
  }
  if (current.agente) {
    requireTicketOwner(current, user);
  }
  if (current.estadoRaw === 'closed' && !isReopenAction) {
    const err = new Error('El ticket esta cerrado y no permite mas cambios');
    err.status = 409;
    throw err;
  }
  if (current.estadoRaw === 'resolved' && nextStatus === 'resolved') {
    const err = new Error('El ticket ya esta resuelto');
    err.status = 409;
    throw err;
  }

  const now = new Date().toISOString();
  const patch = { status: nextStatus, updated_at: now };
  const cleanComment = String(comentario || '').trim();
  if (isReopenAction) {
    if (!['resolved', 'closed'].includes(current.estadoRaw)) {
      const err = new Error('Solo se puede reabrir un ticket resuelto o cerrado');
      err.status = 409;
      throw err;
    }
    requireAssignedTicket(current, 'Debes tomar el ticket antes de reabrirlo');
    if (!cleanComment) {
      const err = new Error('Debes escribir la razon por la que se reabrio el ticket');
      err.status = 400;
      throw err;
    }
    patch.resolved_at = null;
    patch.closed_at = null;
    if (current.estadoRaw === 'closed') {
      patch.assigned_at = now;
    }
  } else if (nextStatus === 'resolved') {
    requireAssignedTicket(current, 'Debes tomar el ticket antes de resolverlo');
    if (!cleanComment) {
      const err = new Error('Debes escribir la descripcion final de la solucion');
      err.status = 400;
      throw err;
    }
    patch.resolved_at = now;
    patch.closed_at = null;
    patch.solution_description = cleanComment;
  } else if (nextStatus === 'closed') {
    requireAssignedTicket(current, 'Debes tomar el ticket antes de cerrarlo');
    if (!cleanComment) {
      const err = new Error('Debes escribir la descripcion final de la solucion');
      err.status = 400;
      throw err;
    }
    const tramoMinutos = current.assignedAt
      ? calculateElapsedMinutes(current.assignedAt, now)
      : 0;
    patch.closed_at = now;
    patch.assigned_at = null;
    patch.total_work_minutes = current.tiempoBaseMinutos + tramoMinutos;
    patch.solution_description = cleanComment;
  } else if (['resolved', 'closed'].includes(current.estadoRaw) && nextStatus === 'open') {
    const err = new Error('Debes escribir la razon por la que se reabrio el ticket');
    err.status = 400;
    throw err;
  }
  const { data, error } = await supabase
    .from('tickets')
    .update(patch)
    .eq('id', current.id)
    .select(ticketSelect())
    .single();

  if (error) {
    logDbError('cambiarEstado.update', error);
    throw error;
  }
  logDbSuccess('cambiarEstado.update', { id: data.id, old_status: current.estadoRaw, new_status: nextStatus });
  await registrarHistorial(current.id, 'status_changed', user, {
    old_status: current.estadoRaw,
    new_status: nextStatus,
    comment: cleanComment || `Estado cambiado a ${STATUS_FROM_DB[nextStatus]}`,
  });
  return mapTicket(data);
}

async function agregarComentario(id, body, isInternal, user) {
  const supabase = getSupportClient();
  const ticket = await obtenerTicket(id, user);
  if (ticket.estadoRaw === 'closed') {
    const err = new Error('No se puede responder un ticket cerrado');
    err.status = 409;
    throw err;
  }
  if (isInternal) requireSupportStaff(user);
  if (isSupportStaff(user) && ticket.agente) {
    requireTicketOwner(ticket, user);
  }

  const text = String(body || '').trim();
  if (!text) {
    const err = new Error('El comentario no puede estar vacio');
    err.status = 400;
    throw err;
  }

  const { error } = await supabase
    .from('ticket_comments')
    .insert({ ticket_id: ticket.id, body: text, is_internal: Boolean(isInternal) });

  if (error) {
    logDbError('agregarComentario.insert', error);
    throw error;
  }
  logDbSuccess('agregarComentario.insert', { ticket_id: ticket.id, isInternal: Boolean(isInternal) });
  await registrarHistorial(ticket.id, 'comment_added', user, {
    comment: `${isInternal ? 'Nota interna' : 'Comentario'} de ${actorName(user)}: ${text}`,
  });
  return obtenerTicket(ticket.id, user);
}

async function registrarTiempo(id, minutes, note, user) {
  requireSupportStaff(user);
  const err = new Error('El tiempo del ticket se calcula automaticamente');
  err.status = 409;
  throw err;
}

async function dashboard(user) {
  requireSupportStaff(user);
  const { tickets } = await listarTickets({ limit: 100 }, user);
  const abiertos = tickets.filter((t) => ['Nuevo', 'Abierto', 'Pendiente', 'En espera'].includes(t.estado));
  const resueltos = tickets.filter((t) => t.estado === 'Resuelto' || t.estado === 'Cerrado');
  const byType = tickets.reduce((acc, t) => {
    acc[t.tipo] = (acc[t.tipo] || 0) + 1;
    return acc;
  }, {});
  const byAgent = tickets.reduce((acc, t) => {
    const key = t.agente || 'Sin asignar';
    acc[key] = acc[key] || { name: key, open: 0, done: 0 };
    if (['Resuelto', 'Cerrado'].includes(t.estado)) acc[key].done += 1;
    else acc[key].open += 1;
    return acc;
  }, {});

  return {
    stats: {
      total: tickets.length,
      abiertos: abiertos.length,
      pendientes: tickets.filter((t) => ['Pendiente', 'En espera'].includes(t.estado)).length,
      resueltos: resueltos.length,
      tiempoMedioMinutos: resueltos.length ? Math.round(resueltos.reduce((s, t) => s + t.tiempoMinutos, 0) / resueltos.length) : 0,
    },
    cola: abiertos.slice(0, 8),
    tipos: Object.entries(byType).map(([name, value]) => ({ name, value })),
    agentes: Object.values(byAgent),
  };
}

async function configuracion(user) {
  requireSupportAdmin(user);
  const supabase = getSupportClient();
  const [tipos, plantillas, asignacion, agentes] = await Promise.all([
    listarTipos(),
    supabase.from('response_templates').select('id,title,body,is_active').order('title'),
    supabase.from('assignment_settings').select('*').maybeSingle(),
    listarAgentes(user),
  ]);

  if (plantillas.error) {
    logDbError('configuracion.plantillas', plantillas.error);
    throw plantillas.error;
  }
  if (asignacion.error) {
    logDbError('configuracion.asignacion', asignacion.error);
    throw asignacion.error;
  }
  logDbSuccess('configuracion', {
    tipos: tipos.length,
    plantillas: plantillas.data?.length || 0,
    asignacion: Boolean(asignacion.data),
  });

  return {
    tipos,
    plantillas: plantillas.data || [],
    asignacion: asignacion.data || null,
    agentes,
  };
}

async function registrarHistorial(ticketId, eventType, user, payload = {}) {
  const supabase = getSupportClient();
  const { error } = await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    event_type: eventType,
    old_status: payload.old_status || null,
    new_status: payload.new_status || null,
    comment: payload.comment || null,
    metadata: { actor: actorName(user), ...(payload.metadata || {}) },
  });
  if (error) {
    logDbError('registrarHistorial.insert', error);
    throw error;
  }
  logDbSuccess('registrarHistorial.insert', { ticketId, eventType });
}

async function crearNotificacion(ticketId, email, eventKey, subject, body) {
  if (!email) return;
  const supabase = getSupportClient();
  const { error } = await supabase.from('notifications').insert({
    ticket_id: ticketId,
    recipient_email: email,
    event_key: eventKey,
    subject,
    body,
    status: 'queued',
  });
  if (error) {
    logDbError('crearNotificacion.insert', error);
    return;
  }
  logDbSuccess('crearNotificacion.insert', { ticketId, eventKey, recipient_email: email });
}

module.exports = {
  SUPPORT_ROLES,
  isSupportStaff,
  isSupportAdmin,
  sanitizeSupportSessionUser,
  loginSoporte,
  refrescarSesionSoporte,
  revocarSesionSoporte,
  listarAgentes,
  crearAgente,
  listarTipos,
  crearTicket,
  listarTickets,
  obtenerTicket,
  tomarTicket,
  cambiarEstado,
  agregarComentario,
  registrarTiempo,
  dashboard,
  configuracion,
};

