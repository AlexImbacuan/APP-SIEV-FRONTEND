import React, { useState } from 'react';
import './Header.css';

function Header({
  onNavigate,
  isAuthenticated = false,
  currentUser = null,
  onLogout,
  onLoginClick,
  onDashboardClick,
  onProfileClick,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMail = () => {
    window.open('https://eliezer.colombiahosting.com.co:2096/logout/?locale=es', '_blank');
  };

  const handleNavClick = (page) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  const handleDashboard = () => {
    onDashboardClick();
    setIsMenuOpen(false);
  };

  const handleProfile = () => {
    onProfileClick();
    setIsMenuOpen(false);
  };

  const displayName = currentUser ? currentUser : 'Usuario';

  return (
    <>
      <header className="site-header">
        <div className="brand-wrap">
          <img src="/images/logo-SIEV.png" alt="Logo SIEV" className="brand-logo" />
        </div>

        <button
          type="button"
          className="hamburger-menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Menú desktop */}
        <nav className="site-nav" aria-label="Navegacion principal">
          {!isAuthenticated ? (
            <>
              <button type="button" className="nav-link" onClick={() => handleNavClick('home')}>
                Inicio
              </button>
              <a href="#servicios">Servicios</a>
              <a href="#nosotros">Nosotros</a>
              <a href="#contacto">Contacto</a>
              <button type="button" className="mail-link" onClick={openMail}>
                Abrir correo SIEV
              </button>
              <button type="button" className="login-link" onClick={onLoginClick}>
                🔐 Iniciar Sesión
              </button>
            </>
          ) : (
            <div className="auth-menu-full">
              <span className="user-name">Hola, {displayName}</span>
              {/* Botón Dashboard agregado */}
              <button
                type="button"
                className="dashboard-link"
                onClick={handleDashboard}
                title="Ir al dashboard"
              >
                📊 Dashboard
              </button>
              <button
                type="button"
                className="profile-link"
                onClick={handleProfile}
                title="Configurar perfil"
              >
                👤 Perfil
              </button>
              <button type="button" className="logout-link" onClick={handleLogout}>
                🚪 Salir
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Menú móvil mejorado */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-container">
            <button
              className="mobile-menu-close"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
            <nav className="mobile-nav" aria-label="Navegacion móvil principal">
              {!isAuthenticated ? (
                <>
                  <button
                    type="button"
                    className="mobile-nav-link"
                    onClick={() => handleNavClick('home')}
                  >
                    Inicio
                  </button>
                  <a
                    href="#servicios"
                    className="mobile-nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Servicios
                  </a>
                  <a
                    href="#nosotros"
                    className="mobile-nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Nosotros
                  </a>
                  <a
                    href="#contacto"
                    className="mobile-nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contacto
                  </a>
                  <button type="button" className="mobile-mail-link" onClick={openMail}>
                    Abrir correo SIEV
                  </button>
                  <button
                    type="button"
                    className="mobile-login-link"
                    onClick={() => {
                      onLoginClick();
                      setIsMenuOpen(false);
                    }}
                  >
                    🔐 Iniciar Sesión
                  </button>
                </>
              ) : (
                <div className="mobile-auth-full">
                  <span className="mobile-user-name">Hola, {displayName}</span>
                  <button type="button" className="mobile-dashboard-link" onClick={handleDashboard}>
                    📊 Dashboard
                  </button>
                  <button type="button" className="mobile-profile-link" onClick={handleProfile}>
                    👤 Configurar Perfil
                  </button>
                  <button type="button" className="mobile-logout-link" onClick={handleLogout}>
                    🚪 Cerrar Sesión
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
