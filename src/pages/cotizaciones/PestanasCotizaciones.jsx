import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERMISOS, tienePermiso } from '../../config/modulos';

/**
 * Pestañas del módulo: el registro propio, el control de Siigo y el catálogo de clientes.
 * Cada pestaña depende de su permiso (nunca del rol). Si el usuario no tiene ninguna
 * pestaña extra, no se muestran (habría una sola).
 */
export default function PestanasCotizaciones({ base }) {
  const { usuario } = useAuth();
  const verSiigo = tienePermiso(usuario, PERMISOS.SIIGO_EXPLORAR);
  const verClientes = tienePermiso(usuario, PERMISOS.CLIENTES_GESTIONAR);
  if (!verSiigo && !verClientes) return null;

  return (
    <nav className="ct-pestanas" aria-label="Vistas de cotizaciones">
      <NavLink end to={base}>
        Registro
      </NavLink>
      {verSiigo && <NavLink to={`${base}/siigo`}>Siigo</NavLink>}
      {verClientes && <NavLink to={`${base}/clientes`}>Clientes</NavLink>}
    </nav>
  );
}
