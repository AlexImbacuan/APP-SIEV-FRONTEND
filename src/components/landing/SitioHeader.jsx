import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import { navLinks, logo } from '../../data/landingContent';

/**
 * Menú superior del sitio público (landing y páginas de servicio).
 * Props:
 *  - onLoginClick (opcional): muestra el botón "Iniciar sesión".
 *  - currentUser (opcional): nombre del usuario con sesión; reemplaza el botón de login.
 *  - onLogout, onPanelClick (opcionales): acciones del usuario con sesión.
 *  - cotizarHref (opcional): destino del botón "Cotizar" (por defecto, el formulario del inicio).
 */
export default function SitioHeader({
  onLoginClick,
  currentUser,
  onLogout,
  onPanelClick,
  cotizarHref = '/#contacto',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`lp-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="lp-container lp-nav__inner">
        <a href="/" className="lp-nav__brand" onClick={closeMenu}>
          <img
            src={logo.src}
            srcSet={logo.srcSet}
            sizes="96px"
            width={logo.ancho}
            height={logo.alto}
            alt={logo.alt}
            className="lp-nav__logo"
          />
        </a>

        <nav className={`lp-nav__links ${menuOpen ? 'is-open' : ''}`} aria-label="Principal">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={closeMenu}>
              {l.label}
            </a>
          ))}
          {currentUser ? (
            <div className="lp-nav__user">
              <span className="lp-nav__username" title={currentUser}>
                Hola, {currentUser}
              </span>
              {onPanelClick && (
                <button
                  type="button"
                  className="lp-nav__login"
                  onClick={() => {
                    closeMenu();
                    onPanelClick();
                  }}
                >
                  Mis módulos
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  className="lp-nav__login"
                  onClick={() => {
                    closeMenu();
                    onLogout();
                  }}
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          ) : (
            onLoginClick && (
              <button
                type="button"
                className="lp-nav__login"
                onClick={() => {
                  closeMenu();
                  onLoginClick();
                }}
              >
                Iniciar sesión
              </button>
            )
          )}
          <a href={cotizarHref} className="lp-btn lp-btn--primary lp-btn--sm" onClick={closeMenu}>
            Cotizar
          </a>
        </nav>

        <button
          type="button"
          className="lp-nav__toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? 'cerrar' : 'menu'} />
        </button>
      </div>
    </header>
  );
}
