import React from 'react';
import { etiquetaEstado } from './cotizacionesUtils';

/** Etiqueta de color del estado: Pendiente (ámbar), Aprobada (verde), No aprobada (rojo). */
export default function EstadoCotizacion({ estado }) {
  const clase = estado ? `ct-estado--${estado.toLowerCase().replace('_', '-')}` : '';
  return <span className={`ct-estado ${clase}`}>{etiquetaEstado(estado)}</span>;
}
