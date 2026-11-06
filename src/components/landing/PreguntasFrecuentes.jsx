import React from 'react';

/**
 * Lista de preguntas frecuentes en acordeón. Usa <details>, así que funciona sin
 * JavaScript y el texto completo queda en el HTML para Google y los asistentes de IA.
 * Props: preguntas = [{ pregunta, respuesta }]
 */
export default function PreguntasFrecuentes({ preguntas }) {
  return (
    <div className="lp-faq">
      {preguntas.map((p) => (
        <details key={p.pregunta} className="lp-faq__item">
          <summary>
            <h3>{p.pregunta}</h3>
          </summary>
          <p>{p.respuesta}</p>
        </details>
      ))}
    </div>
  );
}
