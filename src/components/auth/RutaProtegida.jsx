import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tienePermiso } from '../../config/modulos';
import SinPermiso from '../../pages/modulos/SinPermiso';

/**
 * Protege una ruta en la interfaz.
 *  - Sin sesión → redirige a /login (y vuelve a la ruta pedida después del login)
 *  - `permiso`: el usuario debe tener ese permiso en `usuario.permisos`
 *  - `roles`:   el `usuario.rol` debe estar en la lista
 *  - Si no cumple → página "No tienes permiso"
 *  - Sin `permiso` ni `roles` → basta con tener sesión
 *
 * Es solo para la interfaz: la seguridad real la valida el backend.
 */
export default function RutaProtegida({ roles, permiso, children }) {
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

  if (permiso && !tienePermiso(usuario, permiso)) {
    return <SinPermiso />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <SinPermiso />;
  }

  return children;
}
