import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedPage from '../components/layout/AnimatedPage';
import { getHomePath } from '../utils/authRoutes';

export default function NotFound() {
  const { user } = useAuth();
  const homePath = getHomePath(user);

  return (
    <AnimatedPage>
      <div className="not-found-wrapper">
        <div className="not-found-card glass-card">
          {/* Big glowing 404 */}
          <div className="not-found-code">
            <span>4</span>
            <span className="not-found-zero">
              <Search size={72} strokeWidth={1.5} />
            </span>
            <span>4</span>
          </div>

          <h1 className="not-found-title">Página no encontrada</h1>
          <p className="not-found-desc">
            Lo sentimos, la página que buscas no existe o fue movida.
          </p>

          <div className="not-found-actions">
            <button className="btn btn-primary" onClick={() => window.history.back()}>
              <ArrowLeft size={18} />
              Volver atrás
            </button>
            <Link to={homePath} className="btn btn-secondary">
              <Home size={18} />
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
