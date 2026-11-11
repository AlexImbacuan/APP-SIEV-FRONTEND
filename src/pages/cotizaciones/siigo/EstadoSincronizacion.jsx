import React from 'react';
import { formatearFechaHora, formatearNumero, haceCuanto } from './siigoUtils';

/**
 * Barra superior: última sincronización, cantidad guardada y botón "Sincronizar ahora".
 * Props:
 *  - estado: respuesta de GET /sincronizacion (null mientras carga)
 *  - errorEstado: mensaje si no se pudo consultar el estado
 *  - sincronizando: true mientras responde POST /sincronizar
 *  - mensaje: { tipo: 'exito' | 'error', texto } resultado de la última sincronización manual
 *  - onSincronizar(), onCerrarMensaje()
 */
export default function EstadoSincronizacion({
  estado,
  errorEstado,
  sincronizando,
  mensaje,
  onSincronizar,
  onCerrarMensaje,
}) {
  const noConfigurado = estado?.configurado === false;
  const enCurso = sincronizando || estado?.enCurso;
  const ultima = estado?.ultima;
  const ultimaExitosa = estado?.ultimaExitosa;
  const momento = ultimaExitosa ? ultimaExitosa.fin || ultimaExitosa.inicio : null;

  let resumen = 'Consultando la última sincronización…';
  if (errorEstado) resumen = `No se pudo consultar la sincronización: ${errorEstado}`;
  else if (estado && momento) {
    resumen = `Última sincronización: ${haceCuanto(momento)} (${formatearFechaHora(momento)})`;
  } else if (estado) resumen = 'Todavía no se ha sincronizado con Siigo';

  return (
    <>
      <div className="ct-panel ct-siigo-estado">
        <p role="status">
          {resumen}
          {estado && (
            <>
              {' · '}
              <strong>
                {formatearNumero(estado.cotizacionesGuardadas)}{' '}
                {estado.cotizacionesGuardadas === 1 ? 'cotización' : 'cotizaciones'}
              </strong>
            </>
          )}
        </p>
        <button
          type="button"
          className="pl-btn"
          onClick={onSincronizar}
          disabled={enCurso || noConfigurado}
        >
          {enCurso ? 'Sincronizando con Siigo…' : 'Sincronizar ahora'}
        </button>
      </div>

      {noConfigurado && (
        <div className="us-aviso us-aviso--error" role="alert">
          <span>La conexión con Siigo no está configurada en el servidor.</span>
        </div>
      )}

      {ultima && ultima.exitosa === false && !mensaje && (
        <div className="us-aviso us-aviso--error" role="alert">
          <span>
            La última sincronización ({formatearFechaHora(ultima.inicio)}) falló:{' '}
            {ultima.error || 'error desconocido'}
          </span>
        </div>
      )}

      {mensaje && (
        <div
          className={`us-aviso us-aviso--${mensaje.tipo}`}
          role={mensaje.tipo === 'error' ? 'alert' : 'status'}
        >
          <span>{mensaje.texto}</span>
          <button type="button" onClick={onCerrarMensaje} aria-label="Cerrar aviso">
            ✕
          </button>
        </div>
      )}
    </>
  );
}
