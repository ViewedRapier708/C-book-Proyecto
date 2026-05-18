const { getSupportClient } = require('../config/supportDb');

const STATUS_TO_DB = {
  Nuevo: 'new',
  Abierto: 'open',
  Pendiente: 'pending',
  'En espera': 'waiting',
  Resuelto: 'resolved',
  Cerrado: 'closed',
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

function requireAdmin(user) {
  if (user?.rol !== 'Admin') {
    const err = new Error('Solo administradores pueden realizar esta accion');
    err.status = 403;
    throw err;
  }
}

function actorName(user = {}) {
  return user.nombre || user.email || user.correo || user.boleta || 'Usuario';
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
    agente: row.assigned_agent_name || null,
    creado: row.created_at,
    actualizado: row.updated_at,
    resuelto: row.resolved_at,
    cerrado: row.closed_at,
    tiempoMinutos: row.total_work_minutes || 0,
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
      priority: PRIORITY_TO_DB[payload.prioridad] || 'medium',
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

  if (user?.rol !== 'Admin') {
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
  if (user?.rol !== 'Admin' && data.requester_boleta && data.requester_boleta !== user?.boleta) {
    const err = new Error('No tienes permiso para ver este ticket');
    err.status = 403;
    throw err;
  }
  logDbSuccess('obtenerTicket.select', { id: data.id, ticket_number: data.ticket_number, status: data.status });
  const mapped = mapTicket(data);
  if (user?.rol !== 'Admin') {
    mapped.comentarios = mapped.comentarios.filter((c) => !c.interno);
    mapped.history = mapped.history.filter((h) => !String(h.texto || '').toLowerCase().includes('nota interna'));
  }
  return mapped;
}

async function tomarTicket(id, user) {
  requireAdmin(user);
  const supabase = getSupportClient();
  const current = await obtenerTicket(id, user);
  const { data, error } = await supabase
    .from('tickets')
    .update({
      status: 'open',
      assigned_agent_name: actorName(user),
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id)
    .select(ticketSelect())
    .single();

  if (error) {
    logDbError('tomarTicket.update', error);
    throw error;
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
  requireAdmin(user);
  const supabase = getSupportClient();
  const current = await obtenerTicket(id, user);
  const nextStatus = STATUS_TO_DB[estado];
  if (!nextStatus) {
    const err = new Error('Estado no valido');
    err.status = 400;
    throw err;
  }

  const now = new Date().toISOString();
  const patch = { status: nextStatus, updated_at: now };
  if (nextStatus === 'resolved') patch.resolved_at = now;
  if (nextStatus === 'closed') patch.closed_at = now;
  if (current.estadoRaw === 'closed' && nextStatus !== 'closed') patch.reopened_at = now;

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
    comment: comentario || `Estado cambiado a ${STATUS_FROM_DB[nextStatus]}`,
  });
  return mapTicket(data);
}

async function agregarComentario(id, body, isInternal, user) {
  const supabase = getSupportClient();
  const ticket = await obtenerTicket(id, user);
  if (isInternal) requireAdmin(user);

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
  requireAdmin(user);
  const supabase = getSupportClient();
  const ticket = await obtenerTicket(id, user);
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) {
    const err = new Error('Los minutos deben ser mayores a cero');
    err.status = 400;
    throw err;
  }

  const { error: insertError } = await supabase
    .from('ticket_time_entries')
    .insert({ ticket_id: ticket.id, minutes: Math.round(value), note: note || null, agent_user_id: null });
  if (insertError) {
    logDbError('registrarTiempo.insert', insertError);
    throw insertError;
  }

  const { error: updateError } = await supabase
    .from('tickets')
    .update({ total_work_minutes: ticket.tiempoMinutos + Math.round(value), updated_at: new Date().toISOString() })
    .eq('id', ticket.id);
  if (updateError) {
    logDbError('registrarTiempo.updateTicket', updateError);
    throw updateError;
  }
  logDbSuccess('registrarTiempo', { ticket_id: ticket.id, minutes: Math.round(value) });

  await registrarHistorial(ticket.id, 'time_logged', user, {
    comment: `${actorName(user)} registro ${Math.round(value)} min${note ? `: ${note}` : ''}`,
  });
  return obtenerTicket(ticket.id, user);
}

async function dashboard(user) {
  requireAdmin(user);
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
  requireAdmin(user);
  const supabase = getSupportClient();
  const [tipos, plantillas, asignacion] = await Promise.all([
    listarTipos(),
    supabase.from('response_templates').select('id,title,body,is_active').order('title'),
    supabase.from('assignment_settings').select('*').maybeSingle(),
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
