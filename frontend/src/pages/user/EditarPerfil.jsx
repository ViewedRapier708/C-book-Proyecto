import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Hash, Shield, GraduationCap, Mail, Save, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import AnimatedPage from '../../components/layout/AnimatedPage';

export default function EditarPerfil() {
  const { user, checkSession } = useAuth();
  const navigate = useNavigate();

  const [nuevoCorreo, setNuevoCorreo] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const correoOriginal = user?.email || '';
  const correoModificado = nuevoCorreo !== correoOriginal;

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!correoModificado) return;

    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(nuevoCorreo)) {
      toast.error('Ingresa un correo con formato válido');
      return;
    }

    setLoading(true);
    try {
      await authApi.updateAccount(user.boleta, 'correo', nuevoCorreo);
      toast.success('Correo actualizado correctamente');
      setGuardado(true);
      await checkSession();
      setTimeout(() => setGuardado(false), 3000);
    } catch (err) {
      toast.error(err.message || 'No se pudo actualizar el correo');
    } finally {
      setLoading(false);
    }
  };

  const campos = [
    { icon: Hash, label: 'Boleta', value: user?.boleta || '-', editable: false },
    { icon: User, label: 'Nombre', value: user?.nombre || '-', editable: false },
    { icon: GraduationCap, label: 'Grupo', value: user?.grupo || '-', editable: false },
    { icon: Shield, label: 'Rol', value: user?.rol || 'alumno', editable: false },
  ];

  return (
    <AnimatedPage>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/user/perfil')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--bg-glass)',
              color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-glass-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1>Editar Perfil</h1>
            <p>Actualiza tu información de cuenta</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-[860px] md:grid-cols-[1fr_1.6fr]">
        {/* Avatar & info de solo lectura */}
        <motion.div className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem', fontSize: '2.2rem', color: '#fff', fontWeight: 700,
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}>
              {(user?.boleta || 'U')[0].toUpperCase()}
            </div>
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem' }}>{user?.boleta || 'Usuario'}</h3>
            <span className={`badge ${user?.rol === 'Admin' ? 'badge-success' : 'badge-info'}`}>
              {user?.rol || 'alumno'}
            </span>
          </div>

          <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Información de cuenta
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {campos.map(({ icon: Icon, label, value }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-glass)', fontSize: '0.83rem',
              }}>
                <Icon size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text-muted)', minWidth: 52 }}>{label}:</span>
                <strong style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {value}
                </strong>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Formulario de edición */}
        <motion.div className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h3 style={{ margin: '0 0 0.35rem' }}>Datos editables</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Puedes actualizar tu dirección de correo electrónico.
          </p>

          <form onSubmit={handleGuardar}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 500 }}>
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={nuevoCorreo}
                  onChange={e => setNuevoCorreo(e.target.value)}
                  placeholder="tu@correo.com"
                  style={{
                    width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.2rem',
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary-light)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              {correoModificado && (
                <p style={{ fontSize: '0.78rem', color: 'var(--warning)', marginTop: '0.4rem' }}>
                  Correo original: {correoOriginal}
                </p>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <motion.button
                type="submit"
                disabled={!correoModificado || loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.7rem 1.25rem', borderRadius: 'var(--radius-sm)',
                  background: correoModificado && !loading ? 'var(--button-primary-bg)' : 'var(--bg-glass)',
                  border: '1px solid var(--border)', color: correoModificado && !loading ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.9rem', fontWeight: 600, cursor: correoModificado && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', width: '100%',
                }}
                whileHover={correoModificado && !loading ? { scale: 1.01 } : {}}
                whileTap={correoModificado && !loading ? { scale: 0.99 } : {}}
              >
                {guardado ? (
                  <><CheckCircle size={16} /> Guardado</>
                ) : loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid #fff4', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Guardando...</>
                ) : (
                  <><Save size={16} /> Guardar cambios</>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AnimatedPage>
  );
}
