import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Tag, Users, Share2, FileText, Plus, Pencil, Trash2,
  Check, Bug, Eye, Zap, Hash, Lock, MoreHorizontal,
  RefreshCcw, ArrowRight, Search,
} from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';
import '../../styles/support.css';

// ── Mock data ────────────────────────────────────────────────────────
const TIPOS_INCIDENCIA = [
  { name: 'Funcional',   desc: 'Algo no funciona como debería',          color: '#0284c7', tickets: 78,  activo: true,  icon: Bug          },
  { name: 'Visual',      desc: 'Diseño, textos o imagen',                color: '#8b5cf6', tickets: 42,  activo: true,  icon: Eye          },
  { name: 'Rendimiento', desc: 'Lentitud, cuelgues o tiempos de carga',  color: '#d97706', tickets: 51,  activo: true,  icon: Zap          },
  { name: 'Datos',       desc: 'Información incorrecta o inconsistente', color: '#1f9d74', tickets: 23,  activo: true,  icon: Hash         },
  { name: 'Acceso',      desc: 'Problemas de inicio de sesión',          color: '#dc4c3f', tickets: 19,  activo: true,  icon: Lock         },
  { name: 'Otro',        desc: 'Casos no clasificables',                  color: '#64748b', tickets: 7,   activo: false, icon: MoreHorizontal },
];

const AGENTES = [
  { n: 'María Velázquez', m: 'maria.v@cbook.mx',  rol: 'Administrador', estado: 'Activo',   carga: 8,  cap: 10, online: true  },
  { n: 'Iván Ramírez',    m: 'ivan.r@cbook.mx',   rol: 'Agente',        estado: 'Activo',   carga: 6,  cap: 10, online: true  },
  { n: 'Carlos Núñez',    m: 'carlos.n@cbook.mx', rol: 'Agente',        estado: 'Activo',   carga: 4,  cap: 10, online: false },
  { n: 'Andrea Soto',     m: 'andrea.s@cbook.mx', rol: 'Agente',        estado: 'Activo',   carga: 3,  cap: 10, online: true  },
  { n: 'Roberto Cruz',    m: 'roberto.c@cbook.mx',rol: 'Agente',        estado: 'Inactivo', carga: 0,  cap: 10, online: false },
];

const PLANTILLAS = [
  { t: 'Bienvenida',                        d: 'Hola {{solicitante}}, hemos recibido tu reporte y ya estamos revisándolo. Te avisaremos en cuanto tengamos novedades.', usos: 142 },
  { t: 'Solicitar información adicional',   d: 'Para reproducir el problema necesito que me confirmes: navegador, hora aproximada y si ocurre con todos los libros.', usos: 87  },
  { t: 'Confirmación de resolución',        d: 'Tu reporte ha sido resuelto. Si el problema vuelve a ocurrir, puedes reabrir el ticket o crear uno nuevo.', usos: 203 },
  { t: 'Escalado a desarrollo',             d: 'Hemos identificado el problema y lo hemos canalizado al equipo de desarrollo. Te informaremos cuando esté disponible la corrección.', usos: 34  },
  { t: 'Cierre por inactividad',            d: 'Cerramos este ticket por falta de respuesta. Si necesitas continuar, puedes reabrirlo en cualquier momento.', usos: 21  },
];

const PALETTE = ['#176d5a', '#c46f21', '#0284c7', '#8b5cf6', '#dc4c3f', '#1f9d74'];

function Avatar({ name }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('');
  const bg = PALETTE[name.charCodeAt(0) % PALETTE.length];
  return <div className="sup-avatar sup-avatar-sm" style={{ background: bg }}>{initials}</div>;
}

const TABS = [
  { id: 'tipos',      label: 'Tipos de incidencia', icon: Tag,      cu: 'CU-S11' },
  { id: 'agentes',    label: 'Agentes',              icon: Users,    cu: 'CU-S12' },
  { id: 'distrib',    label: 'Distribución',         icon: Share2,   cu: 'CU-S13' },
  { id: 'plantillas', label: 'Plantillas',           icon: FileText, cu: 'CU-S14' },
];

// ── Tab: Tipos ───────────────────────────────────────────────────────
function TabTipos() {
  const [tipos, setTipos] = useState(TIPOS_INCIDENCIA);

  const toggle = (name) => setTipos(prev => prev.map(t => t.name === name ? { ...t, activo: !t.activo } : t));

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <p className="text-sm text-[var(--text-muted)]">
          Categorías que el administrador verá al reportar un error. Los cambios aplican inmediatamente.
        </p>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#c46f21' }}>
          <Plus size={14} /> Nuevo tipo
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tipos.map((t, i) => (
          <motion.div
            key={t.name}
            className="sup-config-card"
            style={{ '--card-color': t.color, opacity: t.activo ? 1 : 0.55 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: t.activo ? 1 : 0.55, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${t.color}22`, color: t.color }}>
                <t.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-[var(--text-primary)]">{t.name}</span>
                  {!t.activo && <span className="sup-badge sup-badge-neutral">Inactivo</span>}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{t.desc}</div>
              </div>
              <button className="p-1 rounded-lg hover:bg-[var(--bg-glass)] text-[var(--text-muted)] transition-colors flex-shrink-0">
                <MoreHorizontal size={14} />
              </button>
            </div>
            <div className="h-px bg-[var(--border-color)] my-3" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">
                <strong className="text-[var(--text-primary)]">{t.tickets}</strong> tickets activos
              </span>
              <div className="flex items-center gap-2">
                <button className="p-1 rounded-lg hover:bg-[var(--bg-glass)] text-[var(--text-muted)] transition-colors">
                  <Pencil size={13} />
                </button>
                <button className="p-1 rounded-lg hover:bg-[var(--bg-glass)] text-[var(--text-muted)] transition-colors disabled:opacity-30" disabled={t.tickets > 0}>
                  <Trash2 size={13} />
                </button>
                <label className="sup-switch">
                  <input type="checkbox" checked={t.activo} onChange={() => toggle(t.name)} />
                  <span className="sup-switch-track" />
                </label>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Agentes ─────────────────────────────────────────────────────
function TabAgentes() {
  const [filtro, setFiltro] = useState('Todos');
  const agentes = filtro === 'Todos' ? AGENTES : AGENTES.filter(a => a.estado === filtro);

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <p className="text-sm text-[var(--text-muted)]">Gestiona las cuentas del personal que atiende los tickets.</p>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#c46f21' }}>
          <Plus size={14} /> Invitar agente
        </button>
      </div>
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users size={15} /> Agentes ({AGENTES.length})
          </h3>
          <div className="flex bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg p-0.5 gap-0.5">
            {['Todos', 'Activos', 'Inactivos'].map(f => (
              <button key={f} onClick={() => setFiltro(f === 'Activos' ? 'Activo' : f === 'Inactivos' ? 'Inactivo' : 'Todos')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${(filtro === f || (filtro === 'Activo' && f === 'Activos') || (filtro === 'Inactivo' && f === 'Inactivos')) ? 'bg-[var(--bg-glass-strong)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Agente</th>
                <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-32">Rol</th>
                <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-24">Estado</th>
                <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-32">Carga actual</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {agentes.map(a => (
                <tr key={a.m} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-glass)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <Avatar name={a.n} />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[var(--bg-card)]"
                          style={{ background: a.online ? '#1f9d74' : '#738296' }} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-primary)]">{a.n}</div>
                        <div className="text-xs text-[var(--text-muted)]">{a.m}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select className="px-2 py-1 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none" defaultValue={a.rol}>
                      <option>Agente</option>
                      <option>Administrador</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`sup-badge sup-badge--dot ${a.estado === 'Activo' ? 'sup-estado-resuelto' : 'sup-badge-neutral'}`}>{a.estado}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.estado === 'Activo' ? (
                      <div>
                        <div className="sup-sla-bar w-24">
                          <div className="sup-sla-fill" style={{ width: `${(a.carga / a.cap) * 100}%`, background: a.carga / a.cap > 0.8 ? '#dc4c3f' : '#e89a4f' }} />
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{a.carga}/{a.cap}</div>
                      </div>
                    ) : <span className="text-xs text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded hover:bg-[var(--bg-glass-strong)] text-[var(--text-muted)] transition-colors"><Pencil size={13} /></button>
                      <button className="p-1 rounded hover:bg-[var(--bg-glass-strong)] text-[var(--text-muted)] transition-colors"><MoreHorizontal size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Distribución ────────────────────────────────────────────────
function TabDistribucion() {
  const [activa, setActiva] = useState(true);
  const [estrategia, setEstrategia] = useState('balanceada');
  const activos = AGENTES.filter(a => a.estado === 'Activo');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Config panel */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Share2 size={15} /> Distribución automática
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Cómo se reparten los tickets nuevos</p>
          </div>
          <label className="sup-switch">
            <input type="checkbox" checked={activa} onChange={() => setActiva(!activa)} />
            <span className="sup-switch-track" />
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Estrategia</label>
          <div className="flex gap-2">
            <label
              className={`sup-strat-card ${estrategia === 'balanceada' ? 'selected' : ''}`}
              onClick={() => setEstrategia('balanceada')}
            >
              <input type="radio" name="strat" hidden />
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-glass-strong)]" style={{ color: '#e89a4f' }}>
                <RefreshCcw size={15} />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">Balanceada</div>
                <div className="text-xs text-[var(--text-muted)]">Asigna al agente con menor carga</div>
              </div>
            </label>
            <label
              className={`sup-strat-card ${estrategia === 'secuencial' ? 'selected' : ''}`}
              onClick={() => setEstrategia('secuencial')}
            >
              <input type="radio" name="strat" hidden />
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-glass-strong)]" style={{ color: '#e89a4f' }}>
                <ArrowRight size={15} />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">Secuencial</div>
                <div className="text-xs text-[var(--text-muted)]">Por turnos en orden fijo</div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Agentes participantes</label>
          <div className="space-y-2">
            {activos.map(a => (
              <label key={a.m} className="sup-participant-row">
                <input type="checkbox" defaultChecked className="accent-[#c46f21]" />
                <Avatar name={a.n} />
                <span className="flex-1 text-sm text-[var(--text-primary)]">{a.n}</span>
                <span className="text-xs text-[var(--text-muted)]">cap. {a.cap}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Reglas adicionales</label>
          <div className="space-y-1">
            <label className="sup-rule-row"><input type="checkbox" defaultChecked className="accent-[#c46f21]" /><span>Respetar horario laboral del agente</span></label>
            <label className="sup-rule-row"><input type="checkbox" defaultChecked className="accent-[#c46f21]" /><span>Saltar agentes que excedan su capacidad</span></label>
            <label className="sup-rule-row"><input type="checkbox" className="accent-[#c46f21]" /><span>Asignar tickets de "Acceso" sólo a Administradores</span></label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-1.5 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">Restablecer</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#c46f21' }}>Guardar cambios</button>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Vista previa</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
            Si llegara un ticket nuevo ahora, se asignaría a:
          </p>
          <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'rgba(2,132,199,0.06)', borderColor: '#0284c7' }}>
            <Avatar name="Andrea Soto" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Andrea Soto</div>
              <div className="text-xs text-[var(--text-muted)]">Carga 3/10 · menor de los activos</div>
            </div>
            <ArrowRight size={15} style={{ color: '#e89a4f' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Plantillas ──────────────────────────────────────────────────
function TabPlantillas() {
  const [seleccionada, setSeleccionada] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [contenido, setContenido] = useState(PLANTILLAS[0].d);

  const filtradas = PLANTILLAS.filter(p => p.t.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <p className="text-sm text-[var(--text-muted)]">Textos predefinidos que los agentes pueden insertar al atender un ticket.</p>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#c46f21' }}>
          <Plus size={14} /> Nueva plantilla
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* List */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
          <div className="p-3 border-b border-[var(--border-color)]">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                className="w-full pl-8 pr-2 py-1.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                placeholder="Filtrar plantillas..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          {filtradas.map((p, i) => (
            <div
              key={p.t}
              className={`sup-tpl-row ${seleccionada === i ? 'selected' : ''}`}
              onClick={() => { setSeleccionada(i); setContenido(p.d); }}
            >
              <div className="flex items-center justify-between mb-0.5">
                <strong className="text-xs font-semibold text-[var(--text-primary)]">{p.t}</strong>
                <span className="text-xs text-[var(--text-muted)]">{p.usos} usos</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] line-clamp-2">{p.d}</div>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Editando plantilla</div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">{PLANTILLAS[seleccionada]?.t}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                <Trash2 size={12} /> Eliminar
              </button>
              <button className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                Duplicar
              </button>
              <button className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#c46f21' }}>
                Guardar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Título</label>
            <input
              className="w-full px-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f] transition-colors"
              defaultValue={PLANTILLAS[seleccionada]?.t}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Disparador automático</label>
            <select className="w-full px-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none">
              <option>Manual (sólo al insertar)</option>
              <option>Cuando se toma el ticket</option>
              <option>Cuando se cambia a Pendiente</option>
              <option>Cuando se resuelve</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Contenido</label>
            <div className="sup-editor-toolbar">
              <button><strong>B</strong></button>
              <button><em>I</em></button>
              <button><span style={{ textDecoration: 'underline' }}>U</span></button>
              <div className="sup-editor-sep" />
              <button>≡</button>
              <button>🔗</button>
              <div className="sup-editor-sep" />
              <button>{'{{ }}'}</button>
            </div>
            <textarea
              className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-none text-sm text-[var(--text-secondary)] focus:outline-none resize-none"
              style={{ borderRadius: '0 0 8px 8px' }}
              rows={4}
              value={contenido}
              onChange={e => setContenido(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['{{solicitante}}', '{{ticket_id}}', '{{tipo_error}}', '{{agente}}'].map(v => (
                <button key={v} className="sup-var-chip">
                  <Plus size={10} /> {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Vista previa</label>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] text-sm text-[var(--text-secondary)] leading-relaxed">
              {contenido
                .replace('{{solicitante}}', '<strong class="text-[var(--text-primary)]">Laura Méndez</strong>')
                .split('{{ticket_id}}').join('SOP-2841')}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────
export default function ConfiguracionSoporte() {
  const [tab, setTab] = useState('tipos');

  const TabContent = {
    tipos:     <TabTipos />,
    agentes:   <TabAgentes />,
    distrib:   <TabDistribucion />,
    plantillas: <TabPlantillas />,
  }[tab];

  return (
    <AnimatedPage>
      <div className="space-y-5">

        {/* Header */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#e89a4f' }}>
            Módulo de soporte · Configuración
          </p>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">Configuración</h1>
          <p className="text-sm text-[var(--text-muted)]">Administra tipos de incidencia, agentes, distribución y plantillas de respuesta.</p>
        </div>

        {/* Config tabs */}
        <div className="sup-cfg-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`sup-cfg-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={14} />
              {t.label}
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--bg-glass)] text-[var(--text-muted)] font-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}>
                {t.cu}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {TabContent}
        </motion.div>

      </div>
    </AnimatedPage>
  );
}
