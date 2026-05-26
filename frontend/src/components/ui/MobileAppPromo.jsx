import { Github, Smartphone } from 'lucide-react';

const MOBILE_APP_RELEASE_URL = 'https://github.com/DMCHKN3/Movil_C-book/releases/tag/v1.0.0-alfa';

export default function MobileAppPromo({
  title = 'Lleva C-Book en tu celular',
  description = 'Descarga la app movil y consulta o solicita libros con mayor comodidad desde cualquier lugar.',
  ctaLabel = 'Descargar en GitHub',
  compact = false,
  className = '',
}) {
  const classes = ['mobile-app-promo', compact ? 'compact' : '', className].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      <div className="mobile-app-promo-content">
        <div className="mobile-app-promo-copy">
          <div className="mobile-app-promo-icon" aria-hidden="true">
            <Smartphone size={24} />
          </div>

          <div>
            <span className="mobile-app-promo-kicker">Aplicacion movil</span>
            <h3 className="mobile-app-promo-title">{title}</h3>
            <p className="mobile-app-promo-desc">{description}</p>
          </div>
        </div>

        <a
          href={MOBILE_APP_RELEASE_URL}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary mobile-app-promo-link"
        >
          <Github size={16} />
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}
