import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import AnimatedPage from '../../components/layout/AnimatedPage';

export default function CambiarCorreo() {
  const { user, checkSession } = useAuth();
  const navigate = useNavigate();

  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [confirmarCorreo, setConfirmarCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nuevoCorreo || !confirmarCorreo) {
      setError('Completa todos los campos');
      return;
    }

    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(nuevoCorreo)) {
      setError('El formato del correo no es válido');
      return;
    }

    if (nuevoCorreo !== confirmarCorreo) {
      setError('Los correos no coinciden');
      return;
    }

    if (nuevoCorreo === (user?.email || '')) {
      setError('El nuevo correo es igual al actual');
      return;
    }

    setLoading(true);
    try {
      await authApi.updateAccount(user.boleta, 'correo', nuevoCorreo);
      setExito(true);
      toast.success('Correo actualizado correctamente');
      await checkSession();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el correo');
    } finally {
      setLoading(false);
    }
  };

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
            <h1>Recuperación de Correo</h1>
            <p>Actualiza la dirección de correo de tu cuenta</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520 }}>
        {exito ? (
          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '2.5rem 2rem' }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--success-bg)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <CheckCircle size={32} color="var(--success)" />
            </div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem' }}>¡Correo actualizado!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              Tu dirección de correo ha sido actualizada exitosamente a <strong style={{ color: 'var(--text-primary)' }}>{nuevoCorreo}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/user/perfil')}
                style={{
                  padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-sm)',
                  background: 'var(--button-primary-bg)', border: '1px solid var(--border)',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Ir a mi perfil
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {/* Info del correo actual */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-glass)', marginBottom: '1.5rem',
              border: '1px solid var(--border)',
            }}>
              <Mail size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Correo actual</div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {user?.email || 'No disponible'}
                </strong>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                  background: 'var(--danger-bg)', border: '1px solid rgba(220,76,63,0.25)',
                  marginBottom: '1.25rem', color: 'var(--danger)', fontSize: '0.85rem',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  Nuevo correo electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    value={nuevoCorreo}
                    onChange={e => setNuevoCorreo(e.target.value)}
                    placeholder="nuevo@correo.com"
                    autoComplete="email"
                    style={{
                      width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.1rem',
                      background: 'var(--bg-input)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary-light)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  Confirmar nuevo correo
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    value={confirmarCorreo}
                    onChange={e => setConfirmarCorreo(e.target.value)}
                    placeholder="nuevo@correo.com"
                    autoComplete="email"
                    style={{
                      width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.1rem',
                      background: 'var(--bg-input)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary-light)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                {confirmarCorreo && nuevoCorreo !== confirmarCorreo && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.35rem' }}>
                    Los correos no coinciden
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  width: '100%', padding: '0.75rem',
                  background: loading ? 'var(--bg-glass)' : 'var(--button-primary-bg)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  color: loading ? 'var(--text-muted)' : '#fff',
                  fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                whileHover={!loading ? { scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.99 } : {}}
              >
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid #fff4', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Actualizando...</>
                ) : (
                  <><Send size={16} /> Actualizar correo</>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AnimatedPage>
  );
}
