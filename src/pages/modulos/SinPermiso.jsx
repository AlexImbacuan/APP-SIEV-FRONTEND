import React from 'react';
import { Link } from 'react-router-dom';

export default function SinPermiso() {
  return (
    <section className="pl-aviso pl-aviso--error">
      <h1>No tienes permiso para ver este módulo</h1>
      <p>
        Tu rol no tiene acceso a esta sección. Si crees que es un error, contacta al administrador.
      </p>
      <Link to="/modulos" className="pl-btn">
        Volver al inicio
      </Link>
    </section>
  );
}
