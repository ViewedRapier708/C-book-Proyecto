import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ boleta: '', password: '', correo: '', confPsw: '' });
  const [msg, setMsg] = useState(null);

  if (user) {
    return <Navigate to={user.rol === 'Admin' ? '/admin' : '/user'} replace />;
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!/^\d{10}$/.test(form.boleta)) {
      setMsg({ type: 'error', text: 'La boleta debe tener 10 dígitos' });
      return;
    }
    if (!form.password) {
      setMsg({ type: 'error', text: 'Ingrese su contraseña' });
      return;
    }
    setLoading(true);
    try {
      const data = await login(form.boleta, form.password);
      toast.success('¡Bienvenido!');
      navigate(data.rol === 'Admin' ? '/admin' : '/user', { replace: true });
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
      setMsg({ type: 'error', text: 'La boleta debe tener 10 dígitos' });
      return;
    }
    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(form.correo)) {
      setMsg({ type: 'error', text: 'Correo con formato inválido' });
      return;
    }
    if (form.password.length < 6 || form.password.length > 16) {
      setMsg({ type: 'error', text: 'La contraseña debe tener entre 6 y 16 caracteres' });
      return;
    }
    if (form.password !== form.confPsw) {
      setMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    setLoading(true);
    try {
      const data = await register(form.boleta, form.correo, form.password, form.confPsw);
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
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-hero">
          <h1>C-Book</h1>
          <p>Plataforma digital creada para facilitar el acceso a recursos educativos. Solicita libros de forma rápida.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form">
          <h2>{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
          <p className="subtitle">
            {mode === 'login' ? 'Accede a tu biblioteca digital' : 'Regístrate para empezar'}
          </p>

          {msg && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
            <div className="form-group">
              <label>Número de boleta</label>
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
                  placeholder="correo@ejemplo.com"
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

            <label className="show-password">
              <input type="checkbox" checked={showPw} onChange={() => setShowPw(!showPw)} />
              Mostrar contraseña
            </label>

            <button className="btn-submit" type="submit" disabled={loading}>
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
              <>¿No tienes cuenta? <a onClick={toggleMode}>Crear cuenta</a></>
            ) : (
              <>¿Ya tienes cuenta? <a onClick={toggleMode}>Iniciar sesión</a></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
