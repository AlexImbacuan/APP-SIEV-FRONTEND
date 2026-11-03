import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import RutaProtegida from '../../components/auth/RutaProtegida';
import { buscarModulo } from '../../config/modulos';

/**
 * Página genérica de módulo. Lee el :id de la URL, busca el módulo en
 * config/modulos.js y lo protege con sus roles. Sirve para todos los módulos.
 */
export default function ModuloPage() {
  const { id } = useParams();
  const modulo = buscarModulo(id);

  if (!modulo) {
    return <Navigate to="/modulos" replace />;
  }

  return (
    <RutaProtegida roles={modulo.roles}>
      <section className="pl-modulo">
        <Link to="/modulos" className="pl-volver">
          ← Volver al inicio
        </Link>
        <h1>{modulo.titulo}</h1>
        <p>
          Módulo de {modulo.titulo} — visible para: {modulo.roles.join(', ')}. (Contenido pendiente)
        </p>
      </section>
    </RutaProtegida>
  );
}
