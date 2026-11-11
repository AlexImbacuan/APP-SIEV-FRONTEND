import { apiRequest } from './apiClient';

const CLIENTES = '/api/clientes';

/**
 * Catálogo de clientes propio de SIEV. Se cruza por NIT con las cotizaciones de Siigo
 * para mostrar el nombre de la empresa. Requiere clientes:gestionar
 * (listar también se permite con siigo:explorar).
 * El NIT acepta puntos y dígito de verificación (800.197.463-1): el backend guarda 800197463.
 */
export const clientesService = {
  /** GET /api/clientes → [{ id, nit, nombre, activo, creadoEn, cotizaciones }] por nombre */
  listar: () => apiRequest(CLIENTES),

  /** GET /api/clientes/nits-sin-cliente → [{ nit, cotizaciones }], el de más cotizaciones primero */
  nitsSinCliente: () => apiRequest(`${CLIENTES}/nits-sin-cliente`),

  /** POST /api/clientes { nit, nombre } → 201. 409 si el NIT ya existe. */
  crear: (cliente) => apiRequest(CLIENTES, { method: 'POST', body: cliente }),

  /** PUT /api/clientes/{id} { nit, nombre, activo } */
  editar: (id, cliente) =>
    apiRequest(`${CLIENTES}/${encodeURIComponent(id)}`, { method: 'PUT', body: cliente }),

  /** DELETE /api/clientes/{id} → 204. Las cotizaciones no se borran: solo pierden el nombre. */
  eliminar: (id) => apiRequest(`${CLIENTES}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
