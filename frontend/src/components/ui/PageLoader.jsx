import { BookOpen } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-inner">
        <div className="page-loader-icon">
          <BookOpen size={40} />
        </div>
        <div className="page-loader-bar">
          <div className="page-loader-bar-fill" />
        </div>
        <p className="page-loader-text">Cargando…</p>
      </div>
    </div>
  );
}
