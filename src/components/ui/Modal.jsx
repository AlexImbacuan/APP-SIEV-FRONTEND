import React, { useEffect, useId, useRef } from 'react';
import './Modal.css';

/**
 * Ventana modal genérica del panel.
 * Props:
 *  - titulo: texto del encabezado
 *  - onClose(): cierra el modal (Escape, clic fuera o botón ✕)
 *  - bloqueado: mientras es true no se puede cerrar (p. ej. enviando datos)
 *  - children: contenido
 */
export default function Modal({ titulo, onClose, bloqueado = false, children }) {
  const ref = useRef(null);
  const tituloId = useId();

  // Al abrir: foco en el primer campo (o en el elemento marcado con .md-foco)
  // y bloquear el scroll de fondo
  useEffect(() => {
    const primerCampo = ref.current?.querySelector('input, select, textarea, .md-foco');
    primerCampo?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !bloqueado) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, bloqueado]);

  return (
    <div
      className="md-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !bloqueado) onClose();
      }}
    >
      <div
        ref={ref}
        className="md-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <div className="md-header">
          <h2 id={tituloId}>{titulo}</h2>
          <button
            type="button"
            className="md-cerrar"
            onClick={onClose}
            disabled={bloqueado}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
