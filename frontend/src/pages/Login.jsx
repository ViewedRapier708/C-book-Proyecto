import { useEffect, useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../utils/authRoutes';
import MobileAppPromo from '../components/ui/MobileAppPromo';
import toast from 'react-hot-toast';

const CORREO_IPN_REGEX = /^[\w.-]+@alumno\.ipn\.mx$/;

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

function DocumentPage({ docUrl, title, onBack }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(docUrl);
        let text = await res.text();
        text = text.replace(/<br\s*\/?>\s*<div>.*?Termly.*?<\/div>/gs, '');
        text = text.replace(/This Privacy Policy was created using Termly.*?(?:<\/a>)?\.?\s*/gi, '');
        if (!cancelled) setHtml(text);
      } catch {
        if (!cancelled) setHtml('<p>Error al cargar el documento</p>');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [docUrl]);

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: '1rem' }}>
        &larr; Regresar
      </button>
      <h2>{title}</h2>
      {loading ? (
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Cargando documento...</p>
      ) : (
        <div style={{ marginTop: '1rem', maxHeight: '70vh', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8, padding: '1rem' }} dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ boleta: '', password: '', correo: '', confPsw: '' });
  const [msg, setMsg] = useState(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [view, setView] = useState('form');
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const hasPendingRegistration = Boolean(localStorage.getItem('datosRegistro'));
    const callbackPayload = `${window.location.search || ''}${window.location.hash || ''}`;
    const isSupabaseSignupCallback = /(?:type=signup|access_token=|refresh_token=|code=)/.test(callbackPayload);

    if (hasPendingRegistration && isSupabaseSignupCallback) {
      navigate('/verificar', { replace: true });
    }
  }, [navigate]);

  if (user) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  if (view === 'privacidad') {
    return (
      <DocumentPage
        docUrl="/docs/AVISO DE PRIVACIDAD.txt"
        title="Aviso de Privacidad"
        onBack={() => setView('form')}
      />
    );
  }

  if (view === 'terminos') {
    return (
      <DocumentPage
        docUrl="/docs/terminos y condiciones.txt"
        title="Términos y Condiciones"
        onBack={() => setView('form')}
      />
    );
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!/^\d{10}$/.test(form.boleta)) {
      setMsg({ type: 'error', text: 'La boleta debe tener 10 digitos' });
      return;
    }

    if (!form.password) {
      setMsg({ type: 'error', text: 'Ingrese su contraseña' });
      return;
    }

    setLoading(true);
    try {
      const data = await login(form.boleta, form.password);
      toast.success('Bienvenido');
      navigate(getHomePath(data.user), { replace: true });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!/^\d{10}$/.test(form.boleta)) {
      setMsg({ type: 'error', text: 'La boleta debe tener 10 digitos' });
      return;
    }
    if (!CORREO_IPN_REGEX.test(form.correo)) {
      setMsg({ type: 'error', text: 'Solo se permiten correos institucionales @alumno.ipn.mx' });
      return;
    }
    const errorPsw = validarPassword(form.password);
    if (errorPsw) {
      setMsg({ type: 'error', text: errorPsw });
      return;
    }
    if (form.password !== form.confPsw) {
      setMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    if (!aceptaTerminos) {
      setMsg({ type: 'error', text: 'Debes aceptar el Aviso de Privacidad y los Terminos y Condiciones' });
      return;
    }
    setLoading(true);
    try {
      const data = await register(form.boleta, form.correo, form.password, form.confPsw, aceptaTerminos);
      localStorage.setItem('datosRegistro', JSON.stringify({ boleta: form.boleta, correo: form.correo }));
      toast.success(data.message || 'Registro exitoso. Revisa tu correo.');
      navigate('/verificar', { replace: true });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setMsg(null);
    setAnimKey(prev => prev + 1);
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-stack">
          <div className="auth-hero">
            <h1>C-Book</h1>
            <p>Plataforma digital creada para facilitar el acceso a recursos educativos, solicitudes de libros y seguimiento de soporte.</p>
          </div>

          <MobileAppPromo
            compact
            title="Descarga la app movil de C-Book"
            description="Accede a tu cuenta y gestiona solicitudes de libros desde cualquier lugar con una experiencia pensada para celular."
          />
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form">
          <h2>{mode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}</h2>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
            <div key={animKey} className="auth-form-content">
              <p className="subtitle">
                {mode === 'login' ? 'Ingresa tu boleta y contraseña' : 'Solo correos @alumno.ipn.mx'}
              </p>

              {msg && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}
              <div className="form-group">
                <label>Numero de boleta</label>
                <input
                  type="text"
                  placeholder="Ej: 2023630001"
                  maxLength={10}
                  value={form.boleta}
                  onChange={set('boleta')}
                  onKeyPress={(e) => e.key !== 'Enter' && !/\d/.test(e.key) && e.preventDefault()}
                  required
                />
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label>Correo institucional</label>
                  <input
                    type="email"
                    placeholder="correo@alumno.ipn.mx"
                    value={form.correo}
                    onChange={set('correo')}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Ingrese su contraseña"
                  maxLength={16}
                  value={form.password}
                  onChange={set('password')}
                  required
                />
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label>Confirmar contraseña</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Confirme su contraseña"
                    maxLength={16}
                    value={form.confPsw}
                    onChange={set('confPsw')}
                    required
                  />
                </div>
              )}

              {mode === 'register' && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    <input type="checkbox" checked={aceptaTerminos} onChange={() => setAceptaTerminos(!aceptaTerminos)} />
                    <span>
                      Acepto el <a style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); setView('privacidad'); }}>Aviso de Privacidad</a> y los <a style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); setView('terminos'); }}>Términos y Condiciones</a>
                    </span>
                  </label>
                </div>
              )}
            </div>

            <label className="show-password">
              <input type="checkbox" checked={showPw} onChange={() => setShowPw(!showPw)} />
              Mostrar contraseña
            </label>

            <button className="btn-submit" type="submit" disabled={loading || (mode === 'register' && !aceptaTerminos)}>
              {loading ? 'Procesando...' : mode === 'login' ? 'ACCEDER' : 'REGISTRAR'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="toggle-link" style={{ marginTop: '0.5rem' }}>
              <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
            </p>
          )}

          <div className="auth-divider">o</div>

          <p className="toggle-link">
            {mode === 'login' ? (
              <>No tienes cuenta? <a onClick={toggleMode}>Crear cuenta</a></>
            ) : (
              <>Ya tienes cuenta? <a onClick={toggleMode}>Iniciar sesion</a></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
