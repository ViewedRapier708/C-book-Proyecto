import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Lock, Eye, EyeOff, ShieldCheck,
  Mail, CheckCircle, XCircle, Key
} from 'lucide-react';
import { authApi } from '../../api/auth';
import AnimatedPage from '../../components/layout/AnimatedPage';
import Modal from '../../components/ui/Modal';


function validarPassword(password) {
  if (!password || password.length < 6 || password.length > 16)
    return 'La contraseña debe tener entre 6 y 16 caracteres';
  if (!/[a-z]/.test(password))
    return 'La contraseña debe contener al menos una letra minúscula';
  if (!/[A-Z]/.test(password))
    return 'La contraseña debe contener al menos una letra mayúscula';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return 'La contraseña debe contener al menos un carácter especial';
  return null;
}

function PwdInput({ field, placeholder, show, form, setForm, setShow, inputStyle }) {
  return (
    <div style={{ position: 'relative' }}>
      <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      <input
        type={show[field] ? 'text' : 'password'}
        value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        placeholder={placeholder}
        style={{ ...inputStyle, paddingRight: '2.5rem' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent-primary-light)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      <button
        type="button"
        onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
      >
        {show[field] ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

export default function ModificarCuenta() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ correo: '', currentPassword: '', nueva: '', confirmar: '' });
  const [show, setShow] = useState({ currentPassword: false, nueva: false, confirmar: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.correo || !form.currentPassword || !form.nueva || !form.confirmar) {
      setError('Completa todos los campos'); return;
    }
    if (form.nueva.length < 6 || form.nueva.length > 16) {
      setError('La contraseña debe tener entre 6 y 16 caracteres'); return;
    }
    if (form.nueva !== form.confirmar) {
      setError('Las contraseñas no coinciden'); return;
    }
    const errorPsw = validarPassword(form.nueva);
    if (errorPsw) {
      setError(errorPsw); return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(form.correo, form.currentPassword, form.nueva);
      setForm({ correo: '', currentPassword: '', nueva: '', confirmar: '' });
      setModalTipo('success');
      setModalOpen(true);
    } catch (err) {
      const msg = err.message || 'Hubo un error al cambiar su contraseña porfavor intentelo mas tarde';
      console.error('[ModificarCuenta] Error al cambiar contraseña:', msg);
      setError(msg);
      setModalTipo('error');
      setModalOpen(true);
    } finally {
      setLoading(false);
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
      <XCircle size={14} style={{ flexShrink: 0 }} /> {msg}
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

  const level = strengthLevel(form.nueva);
  const sInfo = strengthInfo[level];

  useEffect(() => {
    if (modalOpen && modalTipo === 'success') {
      const timer = setTimeout(() => setModalOpen(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [modalOpen, modalTipo]);

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
            <h1>Cambiar Contraseña</h1>
            <p>Mín. 6 carácteres, mayúsculas, minúsculas y 1 carácter especial</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480 }}>
        <motion.div className="card" key="psw"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
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
                Verifica tu identidad para cambiar la contraseña
              </p>
            </div>
          </div>

          <ErrorMsg msg={error} />

          <form onSubmit={handleSubmit}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={form.correo}
                  onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
                  placeholder={user?.correo || 'correo@ejemplo.com'}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary-light)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Contraseña actual</label>
              <PwdInput field="currentPassword" placeholder="••••••••" show={show} form={form} setForm={setForm} setShow={setShow} inputStyle={inputStyle} />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />

            <div style={fieldWrap}>
              <label style={labelStyle}>Nueva contraseña</label>
              <PwdInput field="nueva" placeholder="••••••••" show={show} form={form} setForm={setForm} setShow={setShow} inputStyle={inputStyle} />
              {form.nueva && (
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
              <PwdInput field="confirmar" placeholder="••••••••" show={show} form={form} setForm={setForm} setShow={setShow} inputStyle={inputStyle} />
              {form.confirmar && form.nueva !== form.confirmar && (
                <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.35rem' }}>
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            <motion.button type="submit" disabled={loading} style={btnPrimary(loading)}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
            >
              {loading ? <><Spinner /> Actualizando...</> : <><ShieldCheck size={16} /> Actualizar contraseña</>}
            </motion.button>
          </form>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTipo === 'success' ? 'Contraseña actualizada' : 'Error'}
      >
        {modalTipo === 'success' ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>Contraseña actualizada correctamente</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <XCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>Hubo un error al cambiar su contraseña porfavor intentelo mas tarde</p>
          </div>
        )}
      </Modal>
    </AnimatedPage>
  );
}
