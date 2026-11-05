import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import RutaProtegida from '../../components/auth/RutaProtegida';
import { buscarModulo } from '../../config/modulos';
import UsuariosPage from '../usuarios/UsuariosPage';
import CotizacionesModulo from '../cotizaciones/CotizacionesModulo';

// Módulos que ya tienen pantalla propia. Los demás muestran el contenido pendiente.
// Una pantalla puede definir sus propias subrutas con <Routes> (ver CotizacionesModulo).
const PANTALLAS = {
  usuarios: UsuariosPage,
  cotizaciones: CotizacionesModulo,
};

/**
 * Página genérica de módulo. Lee el :id de la URL, busca el módulo en
 * config/modulos.js y lo protege con su permiso o sus roles.
 */
export default function ModuloPage() {
  const { id } = useParams();
  const modulo = buscarModulo(id);

  if (!modulo) {
    return <Navigate to="/modulos" replace />;
  }

  const Pantalla = PANTALLAS[modulo.id];
  const visiblePara = modulo.permiso ? `permiso ${modulo.permiso}` : modulo.roles.join(', ');

  return (
    <RutaProtegida roles={modulo.roles} permiso={modulo.permiso}>
      {Pantalla ? (
        <Pantalla modulo={modulo} />
      ) : (
        <section className="pl-modulo">
          <Link to="/modulos" className="pl-volver">
            ← Volver al inicio
          </Link>
          <h1>{modulo.titulo}</h1>
          <p>
            Módulo de {modulo.titulo} — visible para: {visiblePara}. (Contenido pendiente)
          </p>
        </section>
      )}
    </RutaProtegida>
  );
}
