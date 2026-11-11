import React, { useState } from 'react';
import { siigoService } from '../../../services/siigoService';
import { ESTADOS_SIIGO, etiquetaEstadoSiigo } from './siigoUtils';

/**
 * Etiqueta de color del estado del control: Por aprobar (ámbar), Por ejecutar (azul),
 * Por facturar (morado), Pagada (verde), No aprobada (rojo).
 */
export function EtiquetaEstadoSiigo({ estado }) {
  const clase = estado ? `ct-estado-siigo--${estado.toLowerCase().replace(/_/g, '-')}` : '';
  return <span className={`ct-estado ${clase}`}>{etiquetaEstadoSiigo(estado)}</span>;
}

/**
 * Estado editable en la misma fila de la tabla (requiere siigo:editar).
 * Al hacer clic se despliega un selector; al elegir otro estado llama al PATCH.
 * Props:
 *  - cotizacion
 *  - onCambiado(cotizacionActualizada)
 *  - onError(mensaje)
 */
export function SelectorEstadoSiigo({ cotizacion, onCambiado, onError }) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const { estado, numero } = cotizacion;

  // Los clics y teclas aquí no deben abrir el detalle de la fila
  const detener = (e) => e.stopPropagation();

  const cambiar = async (e) => {
    const nuevo = e.target.value;
    if (nuevo === estado) {
      setAbierto(false);
      return;
    }
    setGuardando(true);
    try {
      const actualizada = await siigoService.cambiarEstado(cotizacion.id, nuevo);
      onCambiado(actualizada?.id ? actualizada : { ...cotizacion, estado: nuevo });
    } catch (err) {
      onError(`No se pudo cambiar el estado de ${numero}: ${err.message}`);
    } finally {
      setGuardando(false);
      setAbierto(false);
    }
  };

  if (!abierto) {
    return (
      <button
        type="button"
        className="ct-estado-boton"
        onClick={(e) => {
          detener(e);
          setAbierto(true);
        }}
        onKeyDown={detener}
        aria-label={`Cambiar estado de ${numero} (${etiquetaEstadoSiigo(estado)})`}
        title="Cambiar estado"
      >
        <EtiquetaEstadoSiigo estado={estado} />
        <span aria-hidden="true">▾</span>
      </button>
    );
  }

  return (
    <select
      className="ct-filtro ct-estado-selector"
      value={estado || ''}
      onChange={cambiar}
      onClick={detener}
      onKeyDown={(e) => {
        detener(e);
        if (e.key === 'Escape') setAbierto(false);
      }}
      onBlur={() => !guardando && setAbierto(false)}
      disabled={guardando}
      // El selector aparece por una acción del usuario: el foco va directo a él
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
      aria-label={`Nuevo estado de ${numero}`}
    >
      {ESTADOS_SIIGO.map((e) => (
        <option key={e.valor} value={e.valor}>
          {e.etiqueta}
        </option>
      ))}
    </select>
  );
}
