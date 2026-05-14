import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUp, Clock, Calendar, User,
  CheckCircle2, PauseCircle, Shuffle, Lock, RefreshCcw,
  FileText, Send, Paperclip, Activity, Eye, Plus,
  Hand, Bug,
} from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';
import '../../styles/support.css';

// ── Mock data (se reemplazará con API) ───────────────────────────────
const MOCK_TICKETS = {
  'SOP-2841': {
    id: 'SOP-2841', tipo: 'Funcional', titulo: 'Error al registrar préstamo de libro: ISBN no válido',
    estado: 'Abierto', prioridad: 'Alta',
    solicitante: 'Laura Méndez', solicitanteRol: 'Admin Biblioteca · Zacatenco',
    agente: 'María Velázquez', creado: 'Hoy 09:14', actualizado: 'hace 12 min', tiempo: '2h 15m', sla: 0.6,
    descripcion: 'Al intentar registrar un préstamo escaneando el ISBN 978-607-32-1234-5, el sistema responde "ISBN no válido" aunque el libro está dado de alta y disponible en el catálogo.\n\nSucede con cualquier libro dado de alta a partir del 1 de mayo. Préstamos de meses anteriores funcionan normalmente.',
    pasos: [
      'Iniciar sesión como Admin Biblioteca (Zacatenco).',
      'Ir a Préstamos → Nuevo préstamo.',
      'Seleccionar al alumno por boleta.',
      'Escanear o pegar el ISBN 978-607-32-1234-5.',
      'Aparece "ISBN no válido" y el botón Confirmar queda deshabilitado.',
    ],
  },
};

const HISTORIAL = [
  { kind: 'created', actor: 'Laura Méndez',    hora: 'Hoy 09:14', texto: 'Reportó el error desde el sistema de biblioteca. Estado inicial Nuevo.' },
  { kind: 'taken',   actor: 'María Velázquez', hora: 'Hoy 09:32', texto: 'Estado cambió de Nuevo a Abierto.' },
  { kind: 'comment', actor: 'María Velázquez', hora: 'Hoy 09:48', texto: 'Reproducí el error en entorno de pruebas. Confirmo: la validación de ISBN-13 está rechazando el último dígito de control para libros nuevos.' },
  { kind: 'status',  actor: 'María Velázquez', hora: 'Hoy 10:22', texto: 'Estado cambió a Pendiente. Solicita información al usuario.', adjunto: 'Hola Laura, para reproducir el error necesito que me confirmes si el problema ocurre en todos los navegadores o solo en Chrome. ¿Podrías compartir también el ISBN de un libro que sí funcione?' },
  { kind: 'comment', actor: 'Laura Méndez',    hora: 'Hoy 10:55', texto: 'Confirmo que ocurre en Chrome y Edge. ISBN que sí funciona: 978-607-32-0987-1 (libro dado de alta el 24 de abril).' },
  { kind: 'time',    actor: 'María Velázquez', hora: 'Hoy 11:30', texto: '+1h 15m · "Reproducción en local y revisión del validador"' },
  { kind: 'status',  actor: 'María Velázquez', hora: 'Hoy 12:04', texto: 'Volvió a Abierto. Información recibida del solicitante. Continúa trabajo.' },
];

const PALETTE = ['#176d5a', '#c46f21', '#0284c7', '#8b5cf6', '#dc4c3f', '#1f9d74'];

function Avatar({ name }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('');
  const bg = PALETTE[name.charCodeAt(0) % PALETTE.length];
  return <div className="sup-avatar" style={{ background: bg }}>{initials}</div>;
}

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

export default function DetalleTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comentario, setComentario] = useState('');
  const [tabHistorial, setTabHistorial] = useState('todo');
  const [tabComposer, setTabComposer] = useState('comentario');
  const [timer] = useState('00:23:14');

  const ticket = MOCK_TICKETS[id] ?? MOCK_TICKETS['SOP-2841'];

  return (
    <AnimatedPage>
      <div className="space-y-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <button
            className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors"
            onClick={() => navigate('/admin/soporte/tickets')}
          >
            <ArrowLeft size={13} /> Bandeja
          </button>
          <span>/</span>
          <span className="font-bold text-[var(--text-primary)] sup-ticket-id">{ticket.id}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

          {/* ── Columna principal ── */}
          <div className="space-y-4">

            {/* Header del ticket */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="sup-ticket-id">{ticket.id}</span>
                <EstadoBadge estado={ticket.estado} />
                <span className="sup-badge sup-badge-funcional">{ticket.tipo}</span>
                <span className="sup-badge" style={{ background: 'rgba(220,76,63,0.15)', color: '#f87171' }}>Prioridad {ticket.prioridad}</span>
                <span className="ml-auto text-xs text-[var(--text-muted)]">actualizado {ticket.actualizado}</span>
              </div>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight mb-3 leading-snug">
                {ticket.titulo}
              </h2>
              <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)] mb-4">
                <span className="flex items-center gap-1.5"><User size={13} /> {ticket.solicitante} · {ticket.solicitanteRol}</span>
                <span className="flex items-center gap-1.5"><Calendar size={13} /> Creado {ticket.creado}</span>
                <span className="flex items-center gap-1.5"><Clock size={13} /> Tiempo registrado <strong className="text-[var(--text-primary)] ml-1">{ticket.tiempo}</strong></span>
              </div>
              <div className="h-px bg-[var(--border-color)] mb-4" />
              {/* Action bar */}
              <div className="flex flex-wrap gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all" style={{ background: '#c46f21' }}>
                  <Hand size={14} /> Tomar ticket
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all" style={{ background: '#d97706' }}>
                  <PauseCircle size={14} /> Cambiar estado
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all" style={{ background: '#1f9d74' }}>
                  <CheckCircle2 size={14} /> Resolver
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                  <Shuffle size={14} /> Reasignar
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                  <Clock size={14} /> Registrar tiempo
                </button>
                <div className="flex-1" />
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                  <Lock size={14} /> Cerrar
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                  <RefreshCcw size={14} /> Reabrir
                </button>
              </div>
            </div>

            {/* Descripción */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-3">
                <Bug size={15} /> Descripción del error
              </h3>
              <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line mb-3">
                {ticket.descripcion}
              </div>
              {ticket.pasos && (
                <>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Pasos para reproducir:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                    {ticket.pasos.map((p, i) => <li key={i}>{p}</li>)}
                  </ol>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                <span className="sup-badge sup-badge-neutral">📎 captura-error.png</span>
                <span className="sup-badge sup-badge-neutral">📎 console-network.log</span>
              </div>
            </div>

            {/* Historial */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Activity size={15} /> Historial cronológico
                </h3>
                <div className="flex bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg p-0.5 gap-0.5">
                  {['todo', 'comentarios', 'cambios'].map(t => (
                    <button key={t} onClick={() => setTabHistorial(t)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all ${tabHistorial === t ? 'bg-[var(--bg-glass-strong)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sup-timeline">
                {HISTORIAL.map((h, i) => (
                  <div key={i} className="sup-tl-item" data-kind={h.kind}>
                    <div className="text-xs text-[var(--text-secondary)] mb-1">
                      <strong className="text-[var(--text-primary)]">{h.actor}</strong>
                      {' · '}
                      <span className="text-[var(--text-muted)]">{h.hora}</span>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{h.texto}</div>
                    {h.adjunto && (
                      <div className="sup-tl-attached mt-2">{h.adjunto}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Compositor de respuesta */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Responder o registrar acción</h3>
                <div className="flex bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg p-0.5 gap-0.5">
                  {['comentario', 'nota interna'].map(t => (
                    <button key={t} onClick={() => setTabComposer(t)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all ${tabComposer === t ? 'bg-[var(--bg-glass-strong)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e89a4f] transition-colors resize-none min-h-[90px]"
                placeholder='Escribe la respuesta al solicitante. Escribe "/" para insertar una plantilla.'
                value={comentario}
                onChange={e => setComentario(e.target.value)}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                    <FileText size={12} /> Plantillas
                  </button>
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                    <Paperclip size={12} /> Adjuntar
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                    Guardar borrador
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all" style={{ background: '#c46f21' }}>
                    <Send size={12} /> Enviar respuesta
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ── Columna derecha ── */}
          <div className="space-y-4">

            {/* Detalles */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Detalles</h3>
              <DetailRow label="Estado"><EstadoBadge estado={ticket.estado} /></DetailRow>
              <DetailRow label="Prioridad">
                <span className="flex items-center gap-1 text-xs font-bold sup-prio-alta">
                  <ArrowUp size={12} /> Alta
                </span>
              </DetailRow>
              <DetailRow label="Tipo">
                <span className="sup-badge sup-badge-funcional">{ticket.tipo}</span>
              </DetailRow>
              <DetailRow label="Asignado a">
                <div className="flex items-center gap-2">
                  <Avatar name={ticket.agente} />
                  <span className="text-xs text-[var(--text-secondary)]">{ticket.agente}</span>
                </div>
              </DetailRow>
              <DetailRow label="Solicitante">
                <div>
                  <div className="text-xs font-medium text-[var(--text-primary)]">{ticket.solicitante}</div>
                  <div className="text-xs text-[var(--text-muted)]">{ticket.solicitanteRol}</div>
                </div>
              </DetailRow>
              <DetailRow label="Tiempo">
                <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{ticket.tiempo}</span>
              </DetailRow>
              <DetailRow label="Creado">
                <span className="text-xs text-[var(--text-secondary)]">{ticket.creado}</span>
              </DetailRow>
              <DetailRow label="SLA">
                <div style={{ width: 130 }}>
                  <div className="sup-sla-bar">
                    <div className="sup-sla-fill" style={{ width: `${ticket.sla * 100}%`, background: '#d97706' }} />
                  </div>
                  <div className="text-right text-xs text-[var(--text-muted)] mt-0.5">4h restantes</div>
                </div>
              </DetailRow>
            </div>

            {/* Cronómetro */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-3">
                <Clock size={14} /> Cronómetro
              </h3>
              <div className="rounded-xl p-4 text-center border border-[var(--border-color)]" style={{ background: 'rgba(196,111,33,0.08)' }}>
                <div className="font-mono text-3xl font-extrabold tracking-wider" style={{ color: '#e89a4f' }}>{timer}</div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mt-1">sesión actual</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#1f9d74' }}>
                  <PauseCircle size={13} /> Pausar
                </button>
                <button className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#c46f21' }}>
                  <Plus size={13} /> Registrar
                </button>
              </div>
            </div>

            {/* Atajos */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Atajos</h3>
              <div className="sup-shortcut-row"><span>Tomar ticket</span><kbd>T</kbd></div>
              <div className="sup-shortcut-row"><span>Resolver</span><kbd>R</kbd></div>
              <div className="sup-shortcut-row"><span>Insertar plantilla</span><kbd>/</kbd></div>
              <div className="sup-shortcut-row"><span>Enviar respuesta</span><kbd>⌘ ↵</kbd></div>
            </div>

            {/* Tickets relacionados */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-3">
                <Eye size={14} /> Tickets relacionados
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'SOP-2812', t: 'Validación de ISBN-13 falla en altas masivas' },
                  { id: 'SOP-2789', t: 'Préstamo no detecta libros recién dados de alta' },
                ].map(r => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] cursor-pointer hover:border-[var(--border-glow)] transition-all"
                    onClick={() => navigate(`/admin/soporte/tickets/${r.id}`)}
                  >
                    <div className="sup-ticket-id text-xs mb-1">{r.id}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{r.t}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
