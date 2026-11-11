import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RutaProtegida from '../../components/auth/RutaProtegida';
import { useAuth } from '../../context/AuthContext';
import { PERMISOS, tienePermiso } from '../../config/modulos';
import CotizacionesLista from './CotizacionesLista';
import CotizacionDetalle from './CotizacionDetalle';
import CotizacionForm from './CotizacionForm';
import SiigoCotizaciones from './siigo/SiigoCotizaciones';
import ClientesPage from './clientes/ClientesPage';
import '../../components/ui/Modal.css';
import '../usuarios/UsuariosPage.css';
import './Cotizaciones.css';

/**
 * Módulo de Cotizaciones (requiere cotizaciones:ver o siigo:explorar; ModuloPage ya lo
 * valida). Cada subruta se protege por su permiso, nunca por rol.
 * Subrutas:
 *   /modulos/cotizaciones                → registro propio (cotizaciones:ver); sin ese
 *                                          permiso pero con siigo:explorar → /siigo
 *   /modulos/cotizaciones/nueva          → formulario nuevo, también desde PDF (cotizaciones:crear)
 *   /modulos/cotizaciones/siigo          → control de cotizaciones de Siigo (siigo:explorar)
 *   /modulos/cotizaciones/clientes       → catálogo de clientes (clientes:gestionar)
 *   /modulos/cotizaciones/:id            → detalle del registro (cotizaciones:ver)
 *   /modulos/cotizaciones/:id/editar     → edición del registro (cotizaciones:editar)
 *   cualquier otra                       → al índice
 */
export default function CotizacionesModulo({ modulo }) {
  const base = modulo.ruta;
  const { usuario } = useAuth();
  const verRegistro = tienePermiso(usuario, PERMISOS.COTIZACIONES_VER);

  return (
    <Routes>
      <Route
        index
        element={
          verRegistro ? (
            <CotizacionesLista base={base} />
          ) : (
            <Navigate to={`${base}/siigo`} replace />
          )
        }
      />
      <Route
        path="nueva"
        element={
          <RutaProtegida permiso={PERMISOS.COTIZACIONES_CREAR}>
            <CotizacionForm base={base} />
          </RutaProtegida>
        }
      />
      <Route
        path="siigo"
        element={
          <RutaProtegida permiso={PERMISOS.SIIGO_EXPLORAR}>
            <SiigoCotizaciones base={base} />
          </RutaProtegida>
        }
      />
      <Route
        path="clientes"
        element={
          <RutaProtegida permiso={PERMISOS.CLIENTES_GESTIONAR}>
            <ClientesPage base={base} />
          </RutaProtegida>
        }
      />
      <Route
        path=":cotizacionId"
        element={
          <RutaProtegida permiso={PERMISOS.COTIZACIONES_VER}>
            <CotizacionDetalle base={base} />
          </RutaProtegida>
        }
      />
      <Route
        path=":cotizacionId/editar"
        element={
          <RutaProtegida permiso={PERMISOS.COTIZACIONES_EDITAR}>
            <CotizacionForm base={base} />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to={base} replace />} />
    </Routes>
  );
}
