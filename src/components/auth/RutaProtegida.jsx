import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SinPermiso from '../../pages/modulos/SinPermiso';

/**
 * Protege una ruta en la interfaz.
 *  - Sin sesión → redirige a /login (y vuelve a la ruta pedida después del login)
 *  - Con sesión pero sin uno de los `roles` → página "No tienes permiso"
 *  - Sin `roles` → basta con tener sesión
 *
 * Es solo para la interfaz: la seguridad real la valida el backend.
 */
export default function RutaProtegida({ roles, children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="pl-cargando" role="status">
        Cargando…
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <SinPermiso />;
  }

  return children;
}
