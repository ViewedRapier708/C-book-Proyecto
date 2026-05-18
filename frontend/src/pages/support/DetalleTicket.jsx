import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUp, Clock, Calendar, User,
  CheckCircle2, PauseCircle, Lock, RefreshCcw,
  Send, Activity, Hand, Bug, AlertCircle, Timer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { useAuth } from '../../context/AuthContext';
import { soporteApi } from '../../api/soporte';
import '../../styles/support.css';

const ESTADOS = ['Nuevo', 'Abierto', 'Pendiente', 'En espera', 'Resuelto', 'Cerrado'];

function EstadoBadge({ estado }) {
  const map = { Nuevo: 'sup-estado-nuevo', Abierto: 'sup-estado-abierto', Pendiente: 'sup-estado-pendiente', 'En espera': 'sup-estado-espera', Resuelto: 'sup-estado-resuelto', Cerrado: 'sup-estado-cerrado' };
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

export default function DetalleTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Admin';
  const [ticket, setTicket] = useState(null);
  const [comentario, setComentario] = useState('');
  const [interno, setInterno] = useState(false);
  const [estado, setEstado] = useState('Abierto');
  const [minutes, setMinutes] = useState(15);
  const [timeNote, setTimeNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const backPath = isAdmin ? '/admin/soporte/tickets' : '/user/soporte/mis-reportes';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { ticket: data } = await soporteApi.getTicket(id);
      setTicket(data);
      setEstado(data.estado || 'Abierto');
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
      setTicket(updated);
      setEstado(updated.estado);
      toast.success(okMessage);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el ticket');
    } finally {
      setBusy(false);
    }
  };

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

  return (
    <AnimatedPage>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <button className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors" onClick={() => navigate(backPath)}>
            <ArrowLeft size={13} /> {isAdmin ? 'Bandeja' : 'Mis reportes'}
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
              <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight mb-3 leading-snug">{ticket.titulo}</h2>
              <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)] mb-4">
                <span className="flex items-center gap-1.5"><User size={13} /> {ticket.solicitante} - {ticket.solicitanteRol || ticket.solicitanteBoleta}</span>
                <span className="flex items-center gap-1.5"><Calendar size={13} /> Creado {formatDate(ticket.creado)}</span>
                <span className="flex items-center gap-1.5"><Clock size={13} /> Tiempo <strong className="text-[var(--text-primary)] ml-1">{formatMinutes(ticket.tiempoMinutos)}</strong></span>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--border-color)]">
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#c46f21' }} disabled={busy} onClick={() => runAction(() => soporteApi.takeTicket(ticket.id), 'Ticket tomado')}>
                    <Hand size={14} /> Tomar ticket
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#1f9d74' }} disabled={busy} onClick={() => runAction(() => soporteApi.changeStatus(ticket.id, 'Resuelto', 'Ticket marcado como resuelto'), 'Ticket resuelto')}>
                    <CheckCircle2 size={14} /> Resolver
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] disabled:opacity-50" disabled={busy} onClick={() => runAction(() => soporteApi.changeStatus(ticket.id, 'Cerrado', 'Ticket cerrado'), 'Ticket cerrado')}>
                    <Lock size={14} /> Cerrar
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] disabled:opacity-50" disabled={busy} onClick={() => runAction(() => soporteApi.changeStatus(ticket.id, 'Abierto', 'Ticket reabierto'), 'Ticket reabierto')}>
                    <RefreshCcw size={14} /> Reabrir
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-3"><Bug size={15} /> Descripcion del error</h3>
              <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line mb-3">{ticket.descripcion}</div>
              <div className="text-xs text-[var(--text-muted)]">Modulo reportado: {ticket.modulo}</div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2"><Activity size={15} /> Historial</h3>
              </div>
              <div className="sup-timeline">
                {(ticket.history || []).map((h) => (
                  <div key={h.id} className="sup-tl-item" data-kind={h.tipo}>
                    <div className="text-xs text-[var(--text-muted)] mb-1">{formatDate(h.creado)}</div>
                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{h.texto || `Evento: ${h.tipo}`}</div>
                  </div>
                ))}
                {(ticket.comentarios || []).map((c) => (
                  <div key={c.id} className="sup-tl-item" data-kind="comment">
                    <div className="text-xs text-[var(--text-muted)] mb-1">{formatDate(c.creado)} {c.interno ? '- nota interna' : '- comentario'}</div>
                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{c.texto}</div>
                  </div>
                ))}
                {(ticket.history || []).length === 0 && (ticket.comentarios || []).length === 0 && (
                  <div className="text-sm text-[var(--text-muted)]">Sin historial registrado.</div>
                )}
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Responder</h3>
                {isAdmin && (
                  <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <input type="checkbox" checked={interno} onChange={(e) => setInterno(e.target.checked)} />
                    Nota interna
                  </label>
                )}
              </div>
              <textarea className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none min-h-[90px]" placeholder="Escribe una respuesta o informacion adicional." value={comentario} onChange={(e) => setComentario(e.target.value)} />
              <div className="flex justify-end mt-3">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: '#c46f21' }} disabled={busy || !comentario.trim()} onClick={() => runAction(() => soporteApi.addComment(ticket.id, comentario, interno), 'Comentario guardado').then(() => setComentario(''))}>
                  <Send size={12} /> Enviar respuesta
                </button>
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

            {isAdmin && (
              <>
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-3"><PauseCircle size={14} /> Cambiar estado</h3>
                  <select className="w-full px-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] mb-2" value={estado} onChange={(e) => setEstado(e.target.value)}>
                    {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: '#d97706' }} disabled={busy || estado === ticket.estado} onClick={() => runAction(() => soporteApi.changeStatus(ticket.id, estado, `Estado cambiado a ${estado}`), 'Estado actualizado')}>
                    Guardar estado
                  </button>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-3"><Timer size={14} /> Registrar tiempo</h3>
                  <input type="number" min="1" className="w-full px-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] mb-2" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                  <input className="w-full px-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] mb-2" placeholder="Nota opcional" value={timeNote} onChange={(e) => setTimeNote(e.target.value)} />
                  <button className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: '#1f9d74' }} disabled={busy} onClick={() => runAction(() => soporteApi.logTime(ticket.id, minutes, timeNote), 'Tiempo registrado')}>
                    Registrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
