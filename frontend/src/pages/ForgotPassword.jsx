import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const CORREO_IPN_REGEX = /^[\w.-]+@alumno\.ipn\.mx$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!email) {
      setMsg({ type: 'error', text: 'Ingresa tu correo electrónico' });
      return;
    }

    if (!CORREO_IPN_REGEX.test(email)) {
      setMsg({ type: 'error', text: 'Debes usar tu correo institucional @alumno.ipn.mx' });
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      setSent(true);
      setMsg({ type: 'success', text: 'Revisa tu correo para continuar.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'No se pudo procesar la solicitud' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-hero">
          <h1>C-Book</h1>
          <p>Recupera el acceso a tu cuenta ingresando tu correo institucional. Te enviaremos un enlace para restablecer tu contraseña.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form">
          <h2>Recuperar contraseña</h2>
          <p className="subtitle">Ingresa tu correo y te enviaremos las instrucciones</p>

          {msg && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}

          {!sent ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Correo institucional</label>
                <input
                  type="email"
                  placeholder="Ej: a2023630001@alumno.ipn.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button className="btn-submit" type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'ENVIAR ENLACE'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                Revisa tu bandeja de entrada y sigue el enlace para crear una nueva contraseña.
              </p>
            </div>
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
