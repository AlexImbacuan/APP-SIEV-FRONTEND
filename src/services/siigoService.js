import { apiRequest } from './apiClient';

const SIIGO = '/api/siigo-cotizaciones';

const ruta = (id, sufijo = '') => `${SIIGO}/${encodeURIComponent(id)}${sufijo}`;

/** Arma el query string omitiendo los filtros vacíos. */
function query(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.append(clave, valor);
  });
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

/**
 * Control de cotizaciones de Siigo. El backend copia Siigo dos veces al día (datos de solo
 * lectura) y guarda encima el control de SIEV (estado, responsable, OC, factura y pago).
 * Ver y sincronizar: siigo:explorar. Editar control y estado: siigo:editar.
 */
export const siigoService = {
  /**
   * GET /api/siigo-cotizaciones?texto=&estado=&responsableId=&desde=&hasta=&pagina=&tamano=
   * texto busca en número, NIT, empresa, descripción, ingeniero, OC y factura.
   * → { contenido, pagina, tamano, totalElementos, totalPaginas }
   */
  listar: (filtros) => apiRequest(`${SIIGO}${query(filtros)}`),

  /** GET /api/siigo-cotizaciones/{id} → detalle con items y encabezadoSiigo (si viene) */
  obtener: (id) => apiRequest(ruta(id)),

  /** GET /api/siigo-cotizaciones/responsables → [{ id, nombre }] */
  responsables: () => apiRequest(`${SIIGO}/responsables`),

  /**
   * PUT /api/siigo-cotizaciones/{id}/control — REEMPLAZA todos los campos de control:
   * enviar siempre el formulario completo. descripcion/ingenieroSolicitante en null = usar
   * lo de Siigo. → cotización actualizada
   */
  editarControl: (id, control) =>
    apiRequest(ruta(id, '/control'), { method: 'PUT', body: control }),

  /** PATCH /api/siigo-cotizaciones/{id}/estado { estado } → cotización actualizada */
  cambiarEstado: (id, estado) =>
    apiRequest(ruta(id, '/estado'), { method: 'PATCH', body: { estado } }),

  /** GET /api/siigo-cotizaciones/sincronizacion → { configurado, enCurso, cotizacionesGuardadas, ultima?, ultimaExitosa? } */
  estado: () => apiRequest(`${SIIGO}/sincronizacion`),

  /**
   * POST /api/siigo-cotizaciones/sincronizar → resultado de la sincronización, en el mismo
   * formato que `ultima` ({ exitosa: true, nuevas, actualizadas, eliminadas, … }).
   * Tarda unos 15 s. Si falla responde error HTTP: 409 si ya hay una en curso,
   * 502 si Siigo falló, 503 si Siigo no está configurado.
   */
  sincronizar: () => apiRequest(`${SIIGO}/sincronizar`, { method: 'POST', timeout: 120000 }),
};
