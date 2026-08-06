import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  Bug,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Hand,
  Lock,
  PauseCircle,
  RefreshCcw,
  Send,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../../components/layout/AnimatedPage';
import CollapsibleText from '../../components/ui/CollapsibleText';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { soporteApi } from '../../api/soporte';
import { isSupportRole } from '../../utils/authRoutes';
import '../../styles/support.css';

const BASE_STATE_OPTIONS = ['Nuevo', 'Abierto', 'Pendiente', 'En espera'];

function EstadoBadge({ estado }) {
  const map = {
    Nuevo: 'sup-estado-nuevo',
    Abierto: 'sup-estado-abierto',
    Pendiente: 'sup-estado-pendiente',
    'En espera': 'sup-estado-espera',
    Resuelto: 'sup-estado-resuelto',
    Cerrado: 'sup-estado-cerrado',
  };
  return <span className={`sup-badge sup-badge--dot ${map[estado] ?? 'sup-badge-neutral'}`}>{estado}</span>;
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[var(--border-color)] last:border-0">
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatMinutes(minutes) {
  const value = Number(minutes) || 0;
  const h = Math.floor(value / 60);
  const m = value % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function actorName(user = {}) {
  return user?.nombre || user?.full_name || user?.email || user?.correo || user?.boleta || '';
}

function isTicketAssignedToUser(ticket = {}, user = {}) {
  if (!ticket?.agente) return false;
  if (ticket?.assignedAgentId && user?.supabaseUserId) {
    return ticket.assignedAgentId === user.supabaseUserId;
  }
  return ticket.agente === actorName(user);
}

function isTicketClosed(ticket = {}) {
  return ticket.estadoRaw === 'closed' || ticket.estado === 'Cerrado';
}

function isTicketResolved(ticket = {}) {
  return ticket.estadoRaw === 'resolved' || ticket.estado === 'Resuelto';
}

function getStateOptions(ticket = {}) {
  if (isTicketClosed(ticket)) return ['Cerrado', 'Reabrir'];
  if (isTicketResolved(ticket)) return ['Resuelto', 'Cerrado', 'Reabrir'];
  const options = [...BASE_STATE_OPTIONS];
  if (ticket.agente) {
    options.push('Resuelto', 'Cerrado');
  }
  return options;
}

function getSelectedState(ticket = {}) {
  const options = getStateOptions(ticket);
  return options.includes(ticket.estado) ? ticket.estado : (options[0] || ticket.estado || 'Abierto');
}

function getHistoryAppearance(tipo) {
  const appearances = {
    created: { label: 'Creado', bg: 'rgba(34,197,94,0.12)', color: '#86efac' },
    assigned: { label: 'Asignado', bg: 'rgba(196,111,33,0.14)', color: '#f6ad55' },
    status_changed: { label: 'Estado', bg: 'rgba(37,99,235,0.14)', color: '#93c5fd' },
    time_logged: { label: 'Tiempo', bg: 'rgba(168,85,247,0.14)', color: '#d8b4fe' },
    comment_added: { label: 'Sistema', bg: 'rgba(148,163,184,0.14)', color: '#cbd5e1' },
  };
  return appearances[tipo] || { label: 'Evento', bg: 'rgba(148,163,184,0.14)', color: '#cbd5e1' };
}

export default function DetalleTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSupport = isSupportRole(user?.rol);
  const [ticket, setTicket] = useState(null);
  const [comentario, setComentario] = useState('');
  const [interno, setInterno] = useState(false);
  const [estado, setEstado] = useState('Abierto');
  const [solutionDescription, setSolutionDescription] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [solutionModalAction, setSolutionModalAction] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reopenModalFor, setReopenModalFor] = useState(null);

  const backPath = isSupport
    ? '/soporte/tickets'
    : user?.rol === 'Admin'
      ? '/admin/soporte/mis-reportes'
      : '/user/soporte/mis-reportes';

  const syncTicketState = (data) => {
    setTicket(data);
    setEstado(getSelectedState(data));
    setSolutionDescription(data?.solucion || '');
    setSolutionModalAction(null);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { ticket: data } = await soporteApi.getTicket(id);
      syncTicketState(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const runAction = async (action, okMessage) => {
    setBusy(true);
    setError('');
    try {
      const { ticket: updated } = await action();
      syncTicketState(updated);
      toast.success(okMessage);
      return updated;
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el ticket');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const historyItems = useMemo(() => ticket?.history || [], [ticket]);
  const messageItems = useMemo(() => ticket?.comentarios || [], [ticket]);

  if (loading) {
    return <AnimatedPage><div className="py-16 text-center text-sm text-[var(--text-muted)]">Cargando ticket...</div></AnimatedPage>;
  }

  if (error && !ticket) {
    return (
      <AnimatedPage>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      </AnimatedPage>
    );
  }

  const isClosed = isTicketClosed(ticket);
  const isResolved = isTicketResolved(ticket);
  const ticketTaken = Boolean(ticket.agente);
  const assignedToCurrentUser = isSupport && isTicketAssignedToUser(ticket, user);
  const assignedToOtherUser = isSupport && ticketTaken && !assignedToCurrentUser;
  const canMutateSupportTicket = isSupport && !busy && !assignedToOtherUser;
  const canTake = canMutateSupportTicket && !isClosed && !isResolved && !ticketTaken;
  const canResolve = canMutateSupportTicket && !isClosed && !isResolved && ticketTaken;
  const canClose = canMutateSupportTicket && !isClosed && ticketTaken;
  const canReopen = canMutateSupportTicket && ticketTaken && (isClosed || isResolved);
  const canReply = isSupport ? canMutateSupportTicket && !isClosed : !isClosed;
  const stateOptions = getStateOptions(ticket);
  const canManageState = canMutateSupportTicket && stateOptions.length > 0 && (!isClosed || canReopen);
  const selectedStateBlockedByMissingAssignment = ['Resuelto', 'Cerrado', 'Reabrir'].includes(estado) && !ticketTaken;
  const stateSaveDisabled = busy
    || !canManageState
    || estado === ticket.estado
    || selectedStateBlockedByMissingAssignment;
  const isSolutionModalOpen = Boolean(solutionModalAction);
  const isCloseSolutionModal = solutionModalAction === 'Cerrado';

  const resolveStatusPayload = (nextEstado, overrideComment = '') => {
    if (['Resuelto', 'Cerrado'].includes(nextEstado)) {
      if (!ticketTaken) {
        setError(nextEstado === 'Resuelto'
          ? 'Debes tomar el ticket antes de resolverlo'
          : 'Debes tomar el ticket antes de cerrarlo');
        return null;
      }
      const finalSolution = String(overrideComment || solutionDescription || '').trim();
      if (!finalSolution) {
        setError('Debes escribir la descripcion final de la solucion');
        return null;
      }
      return finalSolution;
    }

    return '';
  };

  const handleStatusChange = async (nextEstado, okMessage, overrideComment = '') => {
    const payload = resolveStatusPayload(nextEstado, overrideComment);
    if (payload === null) return null;

    const updated = await runAction(
      () => soporteApi.changeStatus(ticket.id, nextEstado, payload),
      okMessage,
    );

    if (!updated) return null;
    if (nextEstado === 'Reabrir') {
      setReopenReason('');
    }
    return updated;
  };

  const handleCommentSubmit = async () => {
    const updated = await runAction(
      () => soporteApi.addComment(ticket.id, comentario, interno),
      'Comentario guardado',
    );
    if (updated) {
      setComentario('');
    }
  };

  const openSolutionModal = (action) => {
    setError('');
    setSolutionModalAction(action);
  };

  const closeSolutionModal = () => {
    if (!busy) setSolutionModalAction(null);
  };

  const handleSolutionModalConfirm = async () => {
    if (!solutionModalAction) return;
    const okMessage = solutionModalAction === 'Cerrado' ? 'Ticket cerrado' : 'Ticket resuelto';
    const updated = await handleStatusChange(solutionModalAction, okMessage, solutionDescription.trim());
    if (!updated) return;
    setSolutionModalAction(null);
  };

  const handleQuickClose = () => openSolutionModal('Cerrado');
  const handleQuickResolve = () => openSolutionModal('Resuelto');

  const handleStateSave = async () => {
    if (estado === 'Resuelto' || estado === 'Cerrado') {
      openSolutionModal(estado);
      return;
    }
    if (estado === 'Reabrir') {
      setError('');
      setReopenReason('');
      setReopenModalFor('support');
      return;
    }
    await handleStatusChange(estado, 'Estado actualizado');
  };

  const handleReopenModalConfirm = async () => {
    if (!reopenReason.trim()) return;
    setBusy(true);
    setError('');
    try {
      const action = reopenModalFor === 'non-support'
        ? soporteApi.reopenTicket(ticket.id, reopenReason.trim())
        : soporteApi.changeStatus(ticket.id, 'Reabrir', reopenReason.trim());
      const { ticket: updated } = await action;
      syncTicketState(updated);
      setReopenReason('');
      setReopenModalFor(null);
      toast.success('Ticket reabierto');
    } catch (err) {
      setError(err.message || 'No se pudo reabrir el ticket');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <button className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors" onClick={() => navigate(backPath)}>
            <ArrowLeft size={13} /> {isSupport ? 'Bandeja' : 'Mis reportes'}
          </button>
          <span>/</span>
          <span className="font-bold text-[var(--text-primary)] sup-ticket-id">{ticket.folio}</span>
        </div>

        {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} /> {error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="sup-ticket-id">{ticket.folio}</span>
                <EstadoBadge estado={ticket.estado} />
                <span className="sup-badge sup-badge-funcional">{ticket.tipo}</span>
                <span className="sup-badge" style={{ background: 'rgba(220,76,63,0.15)', color: '#f87171' }}>Prioridad {ticket.prioridad}</span>
                <span className="ml-auto text-xs text-[var(--text-muted)]">actualizado {formatDate(ticket.actualizado)}</span>
              </div>
              <CollapsibleText text={ticket.titulo} maxLength={40} className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight mb-3 leading-snug block" />
              <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)] mb-4">
                <span className="flex items-center gap-1.5"><User size={13} /> {ticket.solicitante} - {ticket.solicitanteRol || ticket.solicitanteBoleta}</span>
                <span className="flex items-center gap-1.5"><Calendar size={13} /> Creado {formatDate(ticket.creado)}</span>
                <span className="flex items-center gap-1.5"><Clock size={13} /> Tiempo <strong className="text-[var(--text-primary)] ml-1">{formatMinutes(ticket.tiempoMinutos)}</strong></span>
              </div>

              {isSupport && (
                <div className="space-y-3 pt-3 border-t border-[var(--border-color)]">
                  {assignedToOtherUser && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                      Este ticket ya fue tomado por {ticket.agente}. El detalle queda en solo lectura para el resto del equipo.
                    </div>
                  )}
                  {!ticketTaken && !isResolved && !isClosed && (
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                      Toma el ticket antes de resolverlo.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {!ticketTaken && !isResolved && !isClosed && (
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#c46f21' }} disabled={!canTake} onClick={() => runAction(() => soporteApi.takeTicket(ticket.id), 'Ticket tomado')}>
                        <Hand size={14} /> Tomar ticket
                      </button>
                    )}
                    {ticketTaken && !isResolved && !isClosed && (
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#1f9d74' }} disabled={!canResolve} onClick={handleQuickResolve}>
                        <CheckCircle2 size={14} /> Resolver
                      </button>
                    )}
                    {isResolved && (
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] disabled:opacity-50" disabled={!canClose} onClick={handleQuickClose}>
                        <Lock size={14} /> Cerrar
                      </button>
                    )}
                    {isClosed && (
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#2563eb' }} disabled={!canReopen} onClick={() => { setReopenReason(''); setReopenModalFor('support'); }}>
                        <RefreshCcw size={14} /> Reabrir
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-3"><Bug size={15} /> Descripcion del error</h3>
              <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line sup-text-wrap mb-3">{ticket.descripcion}</div>
              <div className="text-xs text-[var(--text-muted)]">Modulo reportado: {ticket.modulo}</div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 text-left"
                onClick={() => setShowHistory((value) => !value)}
              >
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-[var(--text-primary)]" />
                  <span className="text-sm font-bold text-[var(--text-primary)]">Historial del ticket</span>
                  <span className="text-xs text-[var(--text-muted)]">{historyItems.length} eventos</span>
                </div>
                {showHistory ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
              </button>

              {showHistory && (
                <div className="mt-4 space-y-3">
                  {historyItems.length > 0 ? historyItems.map((item) => {
                    const appearance = getHistoryAppearance(item.tipo);
                    return (
                      <div key={item.id} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-glass)] px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="sup-badge" style={{ background: appearance.bg, color: appearance.color }}>{appearance.label}</span>
                          {item.estadoNuevo && <EstadoBadge estado={item.estadoNuevo} />}
                          <span className="ml-auto text-xs text-[var(--text-muted)]">{formatDate(item.creado)}</span>
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line sup-text-wrap">
                          {item.texto || `Evento: ${appearance.label}`}
                        </div>
                        {item.estadoAnterior && item.estadoNuevo && item.estadoAnterior !== item.estadoNuevo && (
                          <div className="mt-2 text-xs text-[var(--text-muted)]">
                            Cambio: {item.estadoAnterior} {'->'} {item.estadoNuevo}
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="text-sm text-[var(--text-muted)]">Sin historial registrado.</div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Mensajes del ticket</h3>
                <span className="text-xs text-[var(--text-muted)]">{messageItems.length} mensajes</span>
              </div>

              <div className="space-y-3">
                {messageItems.length > 0 ? messageItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border px-4 py-3"
                    style={item.interno
                      ? { borderColor: 'rgba(245, 158, 11, 0.35)', background: 'rgba(245, 158, 11, 0.08)' }
                      : { borderColor: 'var(--border-color)', background: 'var(--bg-glass)' }}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className="sup-badge"
                        style={item.interno
                          ? { background: 'rgba(245, 158, 11, 0.16)', color: '#fbbf24' }
                          : { background: 'rgba(37, 99, 235, 0.14)', color: '#93c5fd' }}
                      >
                        {item.interno ? 'Nota interna' : 'Mensaje'}
                      </span>
                      <span className="ml-auto text-xs text-[var(--text-muted)]">{formatDate(item.creado)}</span>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line sup-text-wrap">
                      {item.texto}
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-[var(--text-muted)]">Aun no hay mensajes en este ticket.</div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Responder</h4>
                  {isSupport && (
                    <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <input type="checkbox" checked={interno} onChange={(e) => setInterno(e.target.checked)} />
                      Nota interna
                    </label>
                  )}
                </div>
                <textarea className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none min-h-[90px] disabled:opacity-60" placeholder={isClosed ? 'Ticket cerrado: respuestas deshabilitadas.' : (isSupport && assignedToOtherUser ? 'Solo el agente asignado puede responder este ticket.' : 'Escribe una respuesta o informacion adicional.')} value={comentario} onChange={(e) => setComentario(e.target.value)} disabled={!canReply} />
                <div className="flex justify-end mt-3">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: '#c46f21' }} disabled={busy || !comentario.trim() || !canReply} onClick={handleCommentSubmit}>
                    <Send size={12} /> Enviar respuesta
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Detalles</h3>
              <DetailRow label="Estado"><EstadoBadge estado={ticket.estado} /></DetailRow>
              <DetailRow label="Prioridad"><span className="flex items-center gap-1 text-xs font-bold sup-prio-alta"><ArrowUp size={12} /> {ticket.prioridad}</span></DetailRow>
              <DetailRow label="Tipo"><span className="sup-badge sup-badge-funcional">{ticket.tipo}</span></DetailRow>
              <DetailRow label="Asignado">{ticket.agente || 'Sin asignar'}</DetailRow>
              <DetailRow label="Solicitante"><div><div className="text-xs font-medium text-[var(--text-primary)]">{ticket.solicitante}</div><div className="text-xs text-[var(--text-muted)]">{ticket.solicitanteCorreo || ticket.solicitanteBoleta}</div></div></DetailRow>
              <DetailRow label="Tiempo"><span className="font-mono text-sm font-bold text-[var(--text-primary)]">{formatMinutes(ticket.tiempoMinutos)}</span></DetailRow>
            </div>

            {isSupport && (
              <>
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-3"><PauseCircle size={14} /> Cambiar estado</h3>
                  <select className="w-full px-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] mb-2 disabled:opacity-60" value={estado} onChange={(e) => setEstado(e.target.value)} disabled={!canManageState}>
                    {stateOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <button className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: '#d97706' }} disabled={stateSaveDisabled} onClick={handleStateSave}>
                    Guardar estado
                  </button>
                </div>
              </>
            )}

            {!isSupport && (isResolved || isClosed) && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-3"><RefreshCcw size={14} /> Reabrir ticket</h3>
                <p className="text-xs text-[var(--text-muted)] mb-3">Si el problema persiste, puedes solicitar la reapertura de este ticket.</p>
                <button
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#2563eb' }}
                  disabled={busy}
                  onClick={() => { setReopenReason(''); setReopenModalFor('non-support'); }}
                >
                  <RefreshCcw size={14} /> Reabrir ticket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        open={isSolutionModalOpen}
        onClose={closeSolutionModal}
        title={isCloseSolutionModal ? 'Finalizar ticket' : 'Solucion del ticket'}
        footer={(
          <>
            <button
              type="button"
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-glass)] text-sm font-medium text-[var(--text-secondary)] disabled:opacity-50"
              onClick={closeSolutionModal}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: isCloseSolutionModal ? '#c46f21' : '#1f9d74' }}
              onClick={handleSolutionModalConfirm}
              disabled={busy || !solutionDescription.trim()}
            >
              {isCloseSolutionModal ? 'Cerrar ticket' : 'Confirmar resolucion'}
            </button>
          </>
        )}
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            {isCloseSolutionModal
              ? 'Estas seguro de finalizar este ticket? Describe la solucion final antes de cerrarlo.'
              : 'Indica cual fue la solucion aplicada a este ticket antes de marcarlo como resuelto.'}
          </p>
          <textarea
            className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none min-h-[140px] disabled:opacity-60"
            placeholder={isCloseSolutionModal ? 'Describe la solucion final del ticket.' : 'Describe con detalle la solucion aplicada.'}
            value={solutionDescription}
            onChange={(e) => setSolutionDescription(e.target.value)}
            disabled={busy}
          />
        </div>
      </Modal>
      <Modal
        open={Boolean(reopenModalFor)}
        onClose={() => { if (!busy) setReopenModalFor(null); }}
        title="Reabrir ticket"
        footer={(
          <>
            <button
              type="button"
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-glass)] text-sm font-medium text-[var(--text-secondary)] disabled:opacity-50"
              onClick={() => setReopenModalFor(null)}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#2563eb' }}
              onClick={handleReopenModalConfirm}
              disabled={busy || !reopenReason.trim()}
            >
              {busy ? 'Reabriendo...' : 'Reabrir ticket'}
            </button>
          </>
        )}
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            {reopenModalFor === 'non-support'
              ? 'Estas seguro de reabrir este ticket? Indica la razon por la que solicitas la reapertura.'
              : 'Estas seguro de reabrir este ticket? Indica la razon por la que se reabre.'}
          </p>
          <textarea
            className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none min-h-[120px] disabled:opacity-60"
            placeholder="Describe por que se reabre este ticket."
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            disabled={busy}
          />
        </div>
      </Modal>
    </AnimatedPage>
  );
}
