/** Utilidades compartidas del módulo de Cotizaciones. */

export const ESTADOS = {
  PENDIENTE: { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
  APROBADA: { valor: 'APROBADA', etiqueta: 'Aprobada' },
  NO_APROBADA: { valor: 'NO_APROBADA', etiqueta: 'No aprobada' },
};

export const LISTA_ESTADOS = Object.values(ESTADOS);

export function etiquetaEstado(estado) {
  return ESTADOS[estado]?.etiqueta || estado || '—';
}

export const IVA_PORCENTAJE = 0.19;

const formatoMoneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 2,
});

/** 26180000 → "$ 26.180.000" (vacío si no es un número) */
export function formatearMoneda(valor) {
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (numero === null || numero === undefined || Number.isNaN(numero)) return '—';
  return formatoMoneda.format(numero);
}

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const formatoFechaHora = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function aFecha(texto) {
  if (!texto) return null;
  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function formatearFecha(texto) {
  const fecha = aFecha(texto);
  return fecha ? formatoFecha.format(fecha) : '—';
}

export function formatearFechaHora(texto) {
  const fecha = aFecha(texto);
  return fecha ? formatoFechaHora.format(fecha) : '—';
}

/**
 * Convierte lo que escribe el usuario en un número.
 * Acepta "1.992.000", "16600,5" o "16600.5". Devuelve null si está vacío o no es válido.
 */
export function aNumero(texto) {
  if (texto === null || texto === undefined) return null;
  if (typeof texto === 'number') return Number.isFinite(texto) ? texto : null;
  let limpio = String(texto).trim().replace(/\s|\$/g, '');
  if (!limpio) return null;
  const tieneComa = limpio.includes(',');
  const puntos = (limpio.match(/\./g) || []).length;
  if (tieneComa) {
    // Formato colombiano: puntos de miles y coma decimal
    limpio = limpio.replace(/\./g, '').replace(',', '.');
  } else if (puntos > 1 || /^\d{1,3}(\.\d{3})+$/.test(limpio)) {
    // "1.992.000" → miles
    limpio = limpio.replace(/\./g, '');
  }
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

/** Redondea a 2 decimales para evitar errores de coma flotante (0.1 + 0.2). */
export function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
