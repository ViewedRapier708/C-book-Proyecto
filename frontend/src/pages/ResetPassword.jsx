import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // 'checking' | 'ready' | 'error'
  const [form, setForm] = useState({ newPassword: '', confPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const establecerSesion = async () => {
      // Flujo implícito: Supabase pone los tokens en el hash de la URL
      // Ej: /reset-password#access_token=xxx&refresh_token=yyy&type=recovery
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (type === 'recovery' && accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        setStatus(error ? 'error' : 'ready');
        return;
      }

      // Flujo PKCE: Supabase pone el código en query params
      // Ej: /reset-password?code=xxx
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        setStatus(error ? 'error' : 'ready');
        return;
      }

      // No se encontró ningún token
      setStatus('error');
    };

    // onAuthStateChange también detecta PASSWORD_RECOVERY (respaldo)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready');
      }
    });

    establecerSesion();

    return () => subscription.unsubscribe();
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (form.newPassword.length < 6 || form.newPassword.length > 16) {
      setMsg({ type: 'error', text: 'La contraseña debe tener entre 6 y 16 caracteres' });
      return;
    }
    if (form.newPassword !== form.confPassword) {
      setMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: form.newPassword });
      if (error) throw new Error(error.message);

      await supabase.auth.signOut();
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
          <p className="subtitle">Elige una contraseña entre 6 y 16 caracteres</p>

          {msg && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}

          {status === 'checking' && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem 0' }}>
              Verificando enlace...
            </p>
          )}

          {status === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <div className="msg msg-error">
                El enlace de recuperación es inválido o ha expirado.
              </div>
              <p className="toggle-link" style={{ marginTop: '1rem' }}>
                <Link to="/forgot-password">Solicitar un nuevo enlace</Link>
              </p>
            </div>
          )}

          {status === 'ready' && (
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
