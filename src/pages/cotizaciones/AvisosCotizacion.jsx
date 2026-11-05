import React from 'react';

/**
 * Recuadro amarillo con los avisos del backend (p. ej. "la suma de los materiales no da
 * el subtotal"). Son advertencias, no errores: la cotización se guarda igual.
 */
export default function AvisosCotizacion({ avisos, titulo = 'Revisa estos datos' }) {
  if (!avisos || avisos.length === 0) return null;
  return (
    <div className="ct-avisos" role="note">
      <strong>⚠ {titulo}</strong>
      <ul>
        {avisos.map((aviso) => (
          <li key={aviso}>{aviso}</li>
        ))}
      </ul>
    </div>
  );
}
