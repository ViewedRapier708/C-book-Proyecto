import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ newPassword: '', confPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');

    if (!token) {
      setErrorMsg('No se encontró un token de recuperación válido en el enlace.');
      setStatus('error');
      return;
    }

    setResetToken(token);
    setReady(true);
    setStatus('ready');
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const errorPsw = validarPassword(form.newPassword);
    if (errorPsw) {
      setMsg({ type: 'error', text: errorPsw });
      return;
    }
    if (form.newPassword !== form.confPassword) {
      setMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, form.newPassword, form.confPassword);
      toast.success('¡Contraseña actualizada! Inicia sesión con tu nueva contraseña.');
      navigate('/', { replace: true });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'No se pudo actualizar la contraseña' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-hero">
          <h1>C-Book</h1>
          <p>Crea una nueva contraseña segura para recuperar el acceso a tu cuenta.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form">
          <h2>Nueva contraseña</h2>
          <p className="subtitle">Debe tener entre 6 y 16 caracteres, mayúsculas, minúsculas y 1 carácter especial</p>

          {msg && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}

          {!ready && !errorMsg && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem 0' }}>
              Verificando enlace...
            </p>
          )}

          {status === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <div className="msg msg-error">
                {errorMsg || 'El enlace de recuperación es inválido o ha expirado.'}
              </div>
              <p className="toggle-link" style={{ marginTop: '1rem' }}>
                <Link to="/forgot-password">Solicitar un nuevo enlace</Link>
              </p>
            </div>
          )}

          {ready && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  maxLength={16}
                  value={form.newPassword}
                  onChange={set('newPassword')}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirmar contraseña</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Repite tu nueva contraseña"
                  maxLength={16}
                  value={form.confPassword}
                  onChange={set('confPassword')}
                  required
                />
              </div>

              <label className="show-password">
                <input type="checkbox" checked={showPw} onChange={() => setShowPw(!showPw)} />
                Mostrar contraseña
              </label>

              <button className="btn-submit" type="submit" disabled={loading}>
                {loading ? 'Actualizando...' : 'GUARDAR CONTRASEÑA'}
              </button>
            </form>
          )}

          <div className="auth-divider">o</div>

          <p className="toggle-link">
            <Link to="/">Volver a Iniciar Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
