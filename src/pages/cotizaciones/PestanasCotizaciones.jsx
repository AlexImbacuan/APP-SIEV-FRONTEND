import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERMISOS, tienePermiso } from '../../config/modulos';

/**
 * Pestañas del módulo: el registro propio, el control de Siigo y el catálogo de clientes.
 * Cada pestaña depende de su permiso (nunca del rol). Si queda una sola pestaña visible,
 * no se muestra la barra.
 */
export default function PestanasCotizaciones({ base }) {
  const { usuario } = useAuth();
  const verRegistro = tienePermiso(usuario, PERMISOS.COTIZACIONES_VER);
  const verSiigo = tienePermiso(usuario, PERMISOS.SIIGO_EXPLORAR);
  const verClientes = tienePermiso(usuario, PERMISOS.CLIENTES_GESTIONAR);
  if ([verRegistro, verSiigo, verClientes].filter(Boolean).length < 2) return null;

  return (
    <nav className="ct-pestanas" aria-label="Vistas de cotizaciones">
      {verRegistro && (
        <NavLink end to={base}>
          Registro
        </NavLink>
      )}
      {verSiigo && <NavLink to={`${base}/siigo`}>Siigo</NavLink>}
      {verClientes && <NavLink to={`${base}/clientes`}>Clientes</NavLink>}
    </nav>
  );
}
