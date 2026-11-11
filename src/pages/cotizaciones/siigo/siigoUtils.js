/** Formatos de la vista de cotizaciones de Siigo. */

const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** 10650500 → "$ 10.650.500" ("—" si no es un número) */
export function formatearPesos(valor) {
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (numero === null || numero === undefined || Number.isNaN(numero)) return '—';
  return formatoPesos.format(numero);
}

const formatoCantidad = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

export function formatearCantidad(valor) {
  return valor === null || valor === undefined ? '—' : formatoCantidad.format(valor);
}

/**
 * Convierte el texto del backend en fecha local.
 * "2026-11-10" se lee como fecha local (con new Date() quedaría en UTC y en Colombia
 * se vería como el día anterior). "2026-11-10T13:00:04" no trae zona: ya es hora local.
 */
function aFecha(texto) {
  if (!texto) return null;
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  const fecha = soloFecha
    ? new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]))
    : new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatoFechaHora = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** "2026-11-10" → "10/11/2026" */
export function formatearFecha(texto) {
  const fecha = aFecha(texto);
  return fecha ? formatoFecha.format(fecha) : '—';
}

/** "2026-11-10T13:00:00" → "10/11/2026 1:00 p. m." */
export function formatearFechaHora(texto) {
  const fecha = aFecha(texto);
  return fecha ? formatoFechaHora.format(fecha).replace(',', '') : '—';
}

const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

/** "hace 2 horas", "hace 5 minutos", "ayer"… */
export function haceCuanto(texto, ahora = new Date()) {
  const fecha = aFecha(texto);
  if (!fecha) return '—';
  const segundos = Math.round((fecha.getTime() - ahora.getTime()) / 1000);
  const abs = Math.abs(segundos);
  if (abs < 60) return 'hace un momento';
  if (abs < 3600) return relativo.format(Math.round(segundos / 60), 'minute');
  if (abs < 86400) return relativo.format(Math.round(segundos / 3600), 'hour');
  return relativo.format(Math.round(segundos / 86400), 'day');
}

const formatoNumero = new Intl.NumberFormat('es-CO');

/** 1606 → "1.606" */
export function formatearNumero(valor) {
  return formatoNumero.format(valor || 0);
}

const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

/** { nuevas: 1, actualizadas: 3, eliminadas: 0 } → "1 nueva, 3 actualizadas y 0 eliminadas" */
export function resumenSincronizacion(resultado) {
  if (!resultado || typeof resultado.nuevas !== 'number') return 'Sincronización completa.';
  const { nuevas = 0, actualizadas = 0, eliminadas = 0 } = resultado;
  return `Sincronización completa: ${plural(nuevas, 'nueva', 'nuevas')}, ${plural(
    actualizadas,
    'actualizada',
    'actualizadas',
  )} y ${plural(eliminadas, 'eliminada', 'eliminadas')}.`;
}

/** Estados del control de SIEV. Las cotizaciones nuevas llegan en POR_APROBAR. */
export const ESTADOS_SIIGO = [
  { valor: 'POR_APROBAR', etiqueta: 'Por aprobar' },
  { valor: 'POR_EJECUTAR', etiqueta: 'Por ejecutar' },
  { valor: 'POR_FACTURAR', etiqueta: 'Por facturar' },
  { valor: 'PAGADA', etiqueta: 'Pagada' },
  { valor: 'NO_APROBADA', etiqueta: 'No aprobada' },
];

export function etiquetaEstadoSiigo(estado) {
  return ESTADOS_SIIGO.find((e) => e.valor === estado)?.etiqueta || estado || '—';
}

/** Texto o "—" si el campo no viene (el backend omite los campos vacíos). */
export const oGuion = (valor) =>
  valor === null || valor === undefined || valor === '' ? '—' : valor;
