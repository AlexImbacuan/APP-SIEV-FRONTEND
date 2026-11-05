import { apiRequest } from './apiClient';

const COTIZACIONES = '/api/cotizaciones';

const ruta = (id, sufijo = '') => `${COTIZACIONES}/${encodeURIComponent(id)}${sufijo}`;

/** Arma el query string omitiendo los filtros vacíos. */
function query(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.append(clave, valor);
  });
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

export const cotizacionesService = {
  /**
   * GET /api/cotizaciones?estado=&responsableId=&facturada=&texto=&pagina=&tamano=
   * → { contenido, pagina, tamano, totalElementos, totalPaginas }
   */
  listar: (filtros) => apiRequest(`${COTIZACIONES}${query(filtros)}`),

  /** GET /api/cotizaciones/{id} → detalle completo */
  obtener: (id) => apiRequest(ruta(id)),

  /** GET /api/cotizaciones/responsables → [{ id, nombre }] */
  responsables: () => apiRequest(`${COTIZACIONES}/responsables`),

  /**
   * POST /api/cotizaciones/leer-pdf (multipart, campo "archivo").
   * Solo lee el PDF de Siigo y devuelve los datos: NO guarda nada.
   */
  leerPdf: (archivo) => {
    const datos = new FormData();
    datos.append('archivo', archivo);
    // Sin Content-Type a mano: el navegador lo arma con el boundary del multipart
    return apiRequest(`${COTIZACIONES}/leer-pdf`, { method: 'POST', body: datos, timeout: 60000 });
  },

  /** POST /api/cotizaciones → 201 con la cotización creada */
  crear: (cotizacion) => apiRequest(COTIZACIONES, { method: 'POST', body: cotizacion }),

  /** PUT /api/cotizaciones/{id} — reemplaza TODO (incluidos los materiales) */
  editar: (id, cotizacion) => apiRequest(ruta(id), { method: 'PUT', body: cotizacion }),

  /**
   * PATCH /api/cotizaciones/{id}/estado
   * { estado } o { estado: 'NO_APROBADA', motivoRechazo } (motivo obligatorio)
   */
  cambiarEstado: (id, estado, motivoRechazo) =>
    apiRequest(ruta(id, '/estado'), {
      method: 'PATCH',
      body: estado === 'NO_APROBADA' ? { estado, motivoRechazo } : { estado },
    }),

  /** DELETE /api/cotizaciones/{id} → 204 */
  eliminar: (id) => apiRequest(ruta(id), { method: 'DELETE' }),
};
