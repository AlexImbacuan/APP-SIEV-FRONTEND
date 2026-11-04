import React, { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { modulosVisibles, nombreRol } from '../../config/modulos';
import { logo } from '../../data/landingContent';
import './PanelLayout.css';

/**
 * Estructura común del área privada: encabezado con usuario, rol y "Cerrar sesión",
 * y menú con los módulos que el usuario puede ver (según config/modulos.js).
 */
export default function PanelLayout() {
  const { usuario, logout, recargarUsuario } = useAuth();
  const { pathname } = useLocation();
  const modulos = modulosVisibles(usuario);

  // Se vuelve a consultar /me al navegar: si un administrador cambió el rol,
  // el cambio se refleja sin tener que cerrar sesión.
  useEffect(() => {
    recargarUsuario();
  }, [pathname, recargarUsuario]);

  return (
    <div className="pl">
      <header className="pl-header">
        <div className="pl-container pl-header__inner">
          <Link to="/modulos" className="pl-header__brand" aria-label="Inicio del panel">
            <img src={logo.src} alt={logo.alt} className="pl-header__logo" />
          </Link>

          <div className="pl-header__user">
            <div className="pl-header__info">
              <strong title={usuario.email}>{usuario.nombre || usuario.email}</strong>
              <span className={`pl-rol ${usuario.rol ? '' : 'pl-rol--vacio'}`}>
                {nombreRol(usuario.rol)}
              </span>
            </div>
            <button type="button" className="pl-btn pl-btn--outline" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </div>

        {modulos.length > 0 && (
          <nav className="pl-menu" aria-label="Módulos">
            <div className="pl-container pl-menu__inner">
              <NavLink to="/modulos" end className="pl-menu__link">
                Inicio
              </NavLink>
              {modulos.map((modulo) => (
                <NavLink key={modulo.id} to={modulo.ruta} className="pl-menu__link">
                  {modulo.titulo}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="pl-container pl-main">
        <Outlet />
      </main>
    </div>
  );
}
