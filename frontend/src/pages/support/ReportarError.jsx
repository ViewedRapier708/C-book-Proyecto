import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bug, Eye, Zap, Hash, Lock, MoreHorizontal,
  Check, Send, Paperclip, X, ArrowLeft,
} from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';
import '../../styles/support.css';

const TIPOS = [
  { v: 'Funcional',   d: 'Algo no funciona como debería',    icon: Bug,         color: '#0284c7' },
  { v: 'Visual',      d: 'Diseño, textos cortados, etc.',    icon: Eye,         color: '#8b5cf6' },
  { v: 'Rendimiento', d: 'Carga lenta o cuelgues',           icon: Zap,         color: '#d97706' },
  { v: 'Datos',       d: 'Información incorrecta',           icon: Hash,        color: '#1f9d74' },
  { v: 'Acceso',      d: 'No puedo entrar o sin permisos',   icon: Lock,        color: '#dc4c3f' },
  { v: 'Otro',        d: 'No encaja con lo anterior',        icon: MoreHorizontal, color: '#64748b' },
];

const PRIORIDADES = [
  { v: 'Baja',  d: 'Puedo seguir trabajando',            color: '#1f9d74' },
  { v: 'Media', d: 'Afecta una tarea',                   color: '#d97706' },
  { v: 'Alta',  d: 'Bloquea operación de la biblioteca', color: '#dc4c3f' },
];

const MIS_REPORTES_RECIENTES = [
  { id: 'SOP-2841', titulo: 'Error al registrar préstamo: ISBN no válido', estado: 'Abierto'  },
  { id: 'SOP-2820', titulo: 'No puedo descargar reporte mensual de bajas', estado: 'Resuelto' },
  { id: 'SOP-2802', titulo: 'Catálogo no muestra portadas de libros nuevos', estado: 'Cerrado' },
];

function EstadoBadge({ estado }) {
  const map = { Nuevo: 'sup-estado-nuevo', Abierto: 'sup-estado-abierto', Pendiente: 'sup-estado-pendiente', 'En espera': 'sup-estado-espera', Resuelto: 'sup-estado-resuelto', Cerrado: 'sup-estado-cerrado' };
  return <span className={`sup-badge sup-badge--dot ${map[estado] ?? 'sup-badge-neutral'}`}>{estado}</span>;
}

export default function ReportarError() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState('Funcional');
  const [prioridad, setPrioridad] = useState('Media');
  const [descripcion, setDescripcion] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [archivos] = useState(['captura-error.png · 248 KB', 'console-network.log · 4 KB']);

  const handleEnviar = () => {
    if (!descripcion.trim()) return;
    setEnviado(true);
    setTimeout(() => navigate(-1), 2500);
  };

  if (enviado) {
    return (
      <AnimatedPage>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: '#1f9d7422' }}
          >
            <Check size={32} style={{ color: '#1f9d74' }} />
          </motion.div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Reporte enviado</h2>
          <p className="text-sm text-[var(--text-muted)] text-center max-w-sm">
            Tu ticket ha sido creado con estado <strong className="text-[var(--text-primary)]">Nuevo</strong>. El equipo de soporte recibirá una notificación de inmediato.
          </p>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            className="p-1.5 rounded-lg hover:bg-[var(--bg-glass)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#e89a4f' }}>
              CU-S01 · RF-01 / RF-02 / RF-03
            </p>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Reportar un error</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Describe lo que está fallando. El equipo de soporte recibirá una notificación inmediata.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

          {/* ── Formulario ── */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-5">

            {/* Tipo de error */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                Tipo de error <span style={{ color: '#dc4c3f' }}>*</span>
              </label>
              <div className="sup-type-grid">
                {TIPOS.map(t => (
                  <motion.div
                    key={t.v}
                    className={`sup-type-card ${tipo === t.v ? 'selected' : ''}`}
                    style={{ '--type-color': t.color }}
                    onClick={() => setTipo(t.v)}
                    whileTap={{ scale: 0.97 }}
                  >
                    <t.icon size={18} style={{ color: t.color, flexShrink: 0 }} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--text-primary)]">{t.v}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5 leading-tight">{t.d}</div>
                    </div>
                    {tipo === t.v && (
                      <div className="sup-type-card-check">
                        <Check size={11} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ¿Dónde ocurrió? */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                ¿Dónde ocurrió? <span style={{ color: '#dc4c3f' }}>*</span>
              </label>
              <select className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f] transition-colors">
                <option>Préstamos · Nuevo préstamo</option>
                <option>Catálogo · Búsqueda</option>
                <option>Usuarios · Registro</option>
                <option>Reportes · Exportar</option>
                <option>Otro módulo</option>
              </select>
            </div>

            {/* Prioridad sugerida */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">Prioridad sugerida</label>
              <div className="flex gap-2">
                {PRIORIDADES.map(p => (
                  <div
                    key={p.v}
                    className={`sup-prio-card ${prioridad === p.v ? 'selected' : ''}`}
                    style={{ '--prio-color': p.color }}
                    onClick={() => setPrioridad(p.v)}
                  >
                    <div className="text-sm font-bold text-[var(--text-primary)]">{p.v}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{p.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                Descripción <span style={{ color: '#dc4c3f' }}>*</span>
              </label>
              <p className="text-xs text-[var(--text-muted)]">
                Cuéntanos qué intentabas hacer, qué pasó y qué esperabas que pasara. Cuantos más detalles, más rápido lo resolveremos.
              </p>
              <textarea
                className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e89a4f] transition-colors resize-none"
                rows={5}
                placeholder="Ej: Al intentar registrar un préstamo escaneando el ISBN, el sistema responde 'ISBN no válido'..."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: descripcion.length > 0 ? '#1f9d74' : 'var(--text-muted)' }}>
                  {descripcion.length > 30 ? '● Buena descripción' : descripcion.length > 0 ? '● Agrega más detalles' : ''}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{descripcion.length} / 2000</span>
              </div>
            </div>

            {/* Adjuntos */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">Adjuntos (opcional)</label>
              <div className="sup-dropzone">
                <Paperclip size={22} style={{ color: '#e89a4f' }} />
                <div className="text-sm">Arrastra capturas o archivos · <span className="font-semibold cursor-pointer" style={{ color: '#e89a4f' }}>elige desde tu equipo</span></div>
                <div className="text-xs text-[var(--text-muted)]">PNG, JPG, PDF, TXT · máx. 10 MB</div>
              </div>
              {archivos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {archivos.map(a => (
                    <span key={a} className="flex items-center gap-1.5 sup-badge sup-badge-neutral">
                      📎 {a}
                      <button className="opacity-60 hover:opacity-100 transition-opacity"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex items-center justify-between pt-2">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)] transition-all"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </button>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                  Guardar borrador
                </button>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: '#c46f21' }}
                  disabled={!descripcion.trim()}
                  onClick={handleEnviar}
                >
                  <Send size={14} /> Enviar reporte
                </button>
              </div>
            </div>
          </div>

          {/* ── Panel lateral ── */}
          <div className="space-y-4">

            {/* Qué pasa al enviar */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                <Zap size={15} /> Qué pasa al enviar
              </h3>
              <div className="space-y-3">
                {[
                  { n: 1, t: 'Se crea un ticket',   d: 'ID único, estado inicial Nuevo, fecha y hora automáticas.' },
                  { n: 2, t: 'Se notifica al equipo', d: 'El módulo de soporte recibe la alerta de inmediato.' },
                  { n: 3, t: 'Un agente lo toma',    d: 'Lo verás en "Mis reportes" cuando alguien lo asigne.' },
                  { n: 4, t: 'Recibes el resultado', d: 'Te avisamos cuando se resuelva o si necesitan más info.' },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0" style={{ background: '#c46f21' }}>
                      {s.n}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{s.t}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mis reportes recientes */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Mis reportes recientes</h3>
              <div className="space-y-2">
                {MIS_REPORTES_RECIENTES.map(r => (
                  <div key={r.id} className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="sup-ticket-id text-xs">{r.id}</span>
                      <EstadoBadge estado={r.estado} />
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] leading-snug">{r.titulo}</div>
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
