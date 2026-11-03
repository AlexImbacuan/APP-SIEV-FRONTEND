import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { modulosVisibles } from '../../config/modulos';

/** Pantalla de inicio después del login: solo los módulos que el rol puede ver. */
export default function InicioModulos() {
  const { usuario } = useAuth();
  const modulos = modulosVisibles(usuario.rol);
  const primerNombre = (usuario.nombre || '').split(' ')[0];

  return (
    <>
      <div className="pl-titulo">
        <h1>Hola{primerNombre ? `, ${primerNombre}` : ''}</h1>
        <p>Selecciona un módulo para comenzar.</p>
      </div>

      {!usuario.rol ? (
        <section className="pl-aviso">
          <p>Tu cuenta aún no tiene un rol asignado. Contacta al administrador.</p>
        </section>
      ) : modulos.length === 0 ? (
        <section className="pl-aviso">
          <p>Tu rol no tiene módulos disponibles por ahora.</p>
        </section>
      ) : (
        <ul className="pl-tarjetas">
          {modulos.map((modulo) => (
            <li key={modulo.id}>
              <Link to={modulo.ruta} className="pl-tarjeta">
                <h2>{modulo.titulo}</h2>
                <p>{modulo.descripcion}</p>
                <span className="pl-tarjeta__ir">Entrar →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
