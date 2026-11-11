import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RutaProtegida from '../../components/auth/RutaProtegida';
import { PERMISOS } from '../../config/modulos';
import CotizacionesLista from './CotizacionesLista';
import CotizacionDetalle from './CotizacionDetalle';
import CotizacionForm from './CotizacionForm';
import SiigoCotizaciones from './siigo/SiigoCotizaciones';
import ClientesPage from './clientes/ClientesPage';
import '../../components/ui/Modal.css';
import '../usuarios/UsuariosPage.css';
import './Cotizaciones.css';

/**
 * Módulo de Cotizaciones (requiere cotizaciones:ver; ModuloPage ya lo valida).
 * Subrutas:
 *   /modulos/cotizaciones                → lista
 *   /modulos/cotizaciones/nueva          → formulario nuevo (también desde PDF de Siigo)
 *   /modulos/cotizaciones/siigo          → control de cotizaciones de Siigo (siigo:explorar)
 *   /modulos/cotizaciones/clientes       → catálogo de clientes (clientes:gestionar)
 *   /modulos/cotizaciones/:id            → detalle
 *   /modulos/cotizaciones/:id/editar     → formulario de edición
 */
export default function CotizacionesModulo({ modulo }) {
  const base = modulo.ruta;

  return (
    <Routes>
      <Route index element={<CotizacionesLista base={base} />} />
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
      <Route path=":cotizacionId" element={<CotizacionDetalle base={base} />} />
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
