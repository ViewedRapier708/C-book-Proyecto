import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Lock, Eye, EyeOff, ShieldCheck,
  Mail, CheckCircle, AlertCircle, Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import AnimatedPage from '../../components/layout/AnimatedPage';

const tabs = [
  { id: 'password', label: 'Contraseña', icon: Lock },
  { id: 'email', label: 'Correo', icon: Mail },
];

export default function ModificarCuenta() {
  const { user, checkSession } = useAuth();
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState('password');

  // --- Password state ---
  const [psw, setPsw] = useState({ nueva: '', confirmar: '' });
  const [showPsw, setShowPsw] = useState({ nueva: false, confirmar: false });
  const [loadingPsw, setLoadingPsw] = useState(false);
  const [exitoPsw, setExitoPsw] = useState(false);
  const [errorPsw, setErrorPsw] = useState('');

  // --- Email state ---
  const [correos, setCorreos] = useState({ nuevo: '', confirmar: '' });
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [exitoEmail, setExitoEmail] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPsw('');

    if (!psw.nueva || !psw.confirmar) { setErrorPsw('Completa todos los campos'); return; }
    if (psw.nueva.length < 6 || psw.nueva.length > 16) { setErrorPsw('La contraseña debe tener entre 6 y 16 caracteres'); return; }
    if (psw.nueva !== psw.confirmar) { setErrorPsw('Las contraseñas no coinciden'); return; }

    setLoadingPsw(true);
    try {
      await authApi.updateAccount(user.boleta, 'contraseña', psw.nueva);
      setExitoPsw(true);
      setPsw({ nueva: '', confirmar: '' });
      toast.success('Contraseña actualizada correctamente');
      setTimeout(() => setExitoPsw(false), 4000);
    } catch (err) {
      setErrorPsw(err.message || 'No se pudo actualizar la contraseña');
    } finally {
      setLoadingPsw(false);
    }
  };

  const handleCambiarEmail = async (e) => {
    e.preventDefault();
    setErrorEmail('');

    if (!correos.nuevo || !correos.confirmar) { setErrorEmail('Completa todos los campos'); return; }
    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(correos.nuevo)) { setErrorEmail('El formato del correo no es válido'); return; }
    if (correos.nuevo !== correos.confirmar) { setErrorEmail('Los correos no coinciden'); return; }
    if (correos.nuevo === (user?.email || '')) { setErrorEmail('El nuevo correo es igual al actual'); return; }

    setLoadingEmail(true);
    try {
      await authApi.updateAccount(user.boleta, 'correo', correos.nuevo);
      setExitoEmail(true);
      setCorreos({ nuevo: '', confirmar: '' });
      toast.success('Correo actualizado correctamente');
      await checkSession();
      setTimeout(() => setExitoEmail(false), 4000);
    } catch (err) {
      setErrorEmail(err.message || 'No se pudo actualizar el correo');
    } finally {
      setLoadingEmail(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.25rem',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)',
    marginBottom: '0.4rem', fontWeight: 500,
  };

  const fieldWrap = { marginBottom: '1rem' };

  const btnPrimary = (disabled) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    width: '100%', padding: '0.75rem',
    background: disabled ? 'var(--bg-glass)' : 'var(--button-primary-bg)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    color: disabled ? 'var(--text-muted)' : '#fff',
    fontSize: '0.9rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
  });

  const Spinner = () => (
    <div style={{ width: 16, height: 16, border: '2px solid #fff4', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  );

  const ErrorMsg = ({ msg }) => msg ? (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.7rem 1rem', borderRadius: 'var(--radius-sm)',
        background: 'var(--danger-bg)', border: '1px solid rgba(220,76,63,0.25)',
        marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.83rem',
      }}
    >
      <AlertCircle size={14} style={{ flexShrink: 0 }} /> {msg}
    </motion.div>
  ) : null;

  const SuccessBanner = ({ show, msg }) => show ? (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.7rem 1rem', borderRadius: 'var(--radius-sm)',
        background: 'var(--success-bg)', border: '1px solid rgba(31,157,116,0.25)',
        marginBottom: '1rem', color: 'var(--success)', fontSize: '0.83rem',
      }}
    >
      <CheckCircle size={14} style={{ flexShrink: 0 }} /> {msg}
    </motion.div>
  ) : null;

  const strengthLevel = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const strengthInfo = [
    { label: 'Muy débil', color: '#dc4c3f' },
    { label: 'Débil', color: '#f59e0b' },
    { label: 'Media', color: '#f59e0b' },
    { label: 'Fuerte', color: '#1f9d74' },
    { label: 'Muy fuerte', color: '#1f8a70' },
  ];

  const level = strengthLevel(psw.nueva);
  const sInfo = strengthInfo[level];

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
            <h1>Modificar Cuenta</h1>
            <p>Gestiona tu contraseña y correo electrónico</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0.25rem', padding: '0.3rem',
          background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)', marginBottom: '1.5rem',
        }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTabActiva(id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.45rem', padding: '0.55rem 1rem',
                borderRadius: 'calc(var(--radius-sm) - 2px)',
                border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500,
                transition: 'all 0.2s',
                background: tabActiva === id ? 'var(--button-primary-bg)' : 'transparent',
                color: tabActiva === id ? '#fff' : 'var(--text-muted)',
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tabActiva === 'password' && (
            <motion.div key="psw" className="card"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Key size={18} color="var(--info)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Cambiar contraseña</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Mínimo 6 caracteres, máximo 16
                  </p>
                </div>
              </div>

              <SuccessBanner show={exitoPsw} msg="¡Contraseña actualizada exitosamente!" />
              <ErrorMsg msg={errorPsw} />

              <form onSubmit={handleCambiarPassword}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Nueva contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showPsw.nueva ? 'text' : 'password'}
                      value={psw.nueva}
                      onChange={e => setPsw(p => ({ ...p, nueva: e.target.value }))}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: '2.5rem' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent-primary-light)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPsw(p => ({ ...p, nueva: !p.nueva }))}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    >
                      {showPsw.nueva ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {psw.nueva && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 999,
                            background: i < level ? sInfo.color : 'var(--bg-glass-strong)',
                            transition: 'background 0.3s',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: sInfo.color }}>{sInfo.label}</span>
                    </div>
                  )}
                </div>

                <div style={{ ...fieldWrap, marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Confirmar nueva contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showPsw.confirmar ? 'text' : 'password'}
                      value={psw.confirmar}
                      onChange={e => setPsw(p => ({ ...p, confirmar: e.target.value }))}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: '2.5rem' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent-primary-light)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPsw(p => ({ ...p, confirmar: !p.confirmar }))}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    >
                      {showPsw.confirmar ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {psw.confirmar && psw.nueva !== psw.confirmar && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.35rem' }}>
                      Las contraseñas no coinciden
                    </p>
                  )}
                </div>

                <motion.button type="submit" disabled={loadingPsw} style={btnPrimary(loadingPsw)}
                  whileHover={!loadingPsw ? { scale: 1.01 } : {}}
                  whileTap={!loadingPsw ? { scale: 0.99 } : {}}
                >
                  {loadingPsw ? <><Spinner /> Actualizando...</> : <><ShieldCheck size={16} /> Actualizar contraseña</>}
                </motion.button>
              </form>
            </motion.div>
          )}

          {tabActiva === 'email' && (
            <motion.div key="email" className="card"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Mail size={18} color="var(--warning)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Cambiar correo</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Actual: <strong style={{ color: 'var(--text-secondary)' }}>{user?.email || '-'}</strong>
                  </p>
                </div>
              </div>

              <SuccessBanner show={exitoEmail} msg="¡Correo actualizado exitosamente!" />
              <ErrorMsg msg={errorEmail} />

              <form onSubmit={handleCambiarEmail}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Nuevo correo electrónico</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      value={correos.nuevo}
                      onChange={e => setCorreos(c => ({ ...c, nuevo: e.target.value }))}
                      placeholder="nuevo@correo.com"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--accent-primary-light)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                </div>

                <div style={{ ...fieldWrap, marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Confirmar nuevo correo</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      value={correos.confirmar}
                      onChange={e => setCorreos(c => ({ ...c, confirmar: e.target.value }))}
                      placeholder="nuevo@correo.com"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--accent-primary-light)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  {correos.confirmar && correos.nuevo !== correos.confirmar && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.35rem' }}>
                      Los correos no coinciden
                    </p>
                  )}
                </div>

                <motion.button type="submit" disabled={loadingEmail} style={btnPrimary(loadingEmail)}
                  whileHover={!loadingEmail ? { scale: 1.01 } : {}}
                  whileTap={!loadingEmail ? { scale: 0.99 } : {}}
                >
                  {loadingEmail ? <><Spinner /> Actualizando...</> : <><Mail size={16} /> Actualizar correo</>}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AnimatedPage>
  );
}
