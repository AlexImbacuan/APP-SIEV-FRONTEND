import React from 'react';

/**
 * Íconos lineales para la landing de SIEV.
 * Uso: <Icon name="tablero" />
 */
const PATHS = {
  rayo: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  tablero: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 7h3M8 11h3M8 15h3M14 7v2M17 7v2M14 13h3v4h-3z" />
    </>
  ),
  automatizacion: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M7 10h2v4H7zM12 10h1M12 14h1M16 10h1M16 14h1M7 3v3M17 3v3M7 18v3M17 18v3" />
    </>
  ),
  iluminacion: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1.1 2.2h5c.1-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3Z" />
    </>
  ),
  factor: (
    <>
      <path d="M3 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0" />
      <path d="M3 20h18M3 4v16" />
    </>
  ),
  bandeja: (
    <>
      <path d="M2 9h20v5H2z" />
      <path d="M5 9v5M9 9v5M13 9v5M17 9v5M6 14v6M18 14v6M6 4v5M18 4v5" />
    </>
  ),
  mantenimiento: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z" />
  ),
  planos: (
    <>
      <path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z" />
      <path d="M9 3v16M15 5v16" />
    </>
  ),
  planta: (
    <>
      <rect x="2" y="7" width="15" height="11" rx="1.5" />
      <path d="M17 10h3l2 3v5h-5M6 18v2M13 18v2M9 9.5 7.5 13H10l-1.5 3.5" />
    </>
  ),
  suministro: (
    <>
      <path d="M3 7l9-4 9 4-9 4-9-4Z" />
      <path d="M3 7v10l9 4 9-4V7M12 11v10" />
    </>
  ),
  altura: (
    <>
      <path d="M7 21 12 3l5 18M8.5 15h7M10 9h4" />
      <circle cx="12" cy="3" r="0.5" />
    </>
  ),
  check: <path d="m4 12 5 5L20 6" />,
  escudo: <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />,
  equipo: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.3c3 .1 6 2 6 5.7" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  telefono: (
    <path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 12l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2Z" />
  ),
  correo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  ubicacion: (
    <>
      <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
};

export default function Icon({ name, size = 24, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] || PATHS.rayo}
    </svg>
  );
}
