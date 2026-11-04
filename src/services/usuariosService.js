import { apiRequest } from './apiClient';

// Requieren el permiso usuarios:gestionar (y roles:gestionar para /api/roles)
const USUARIOS = '/api/usuarios';
const ROLES = '/api/roles';

const ruta = (id, sufijo = '') => `${USUARIOS}/${encodeURIComponent(id)}${sufijo}`;

export const usuariosService = {
  /** GET /api/usuarios → [{ id, nombre, email, activo, rol, permisos }] */
  listar: () => apiRequest(USUARIOS),

  /** GET /api/usuarios/{id} */
  obtener: (id) => apiRequest(ruta(id)),

  /** POST /api/usuarios { nombre, email, password, rolId } → 201 */
  crear: ({ nombre, email, password, rolId }) =>
    apiRequest(USUARIOS, { method: 'POST', body: { nombre, email, password, rolId } }),

  /**
   * PUT /api/usuarios/{id} { nombre?, email?, password? }.
   * Los campos vacíos no se envían: el backend no los cambia.
   */
  editar: (id, { nombre, email, password }) => {
    const body = {};
    if (nombre) body.nombre = nombre;
    if (email) body.email = email;
    if (password) body.password = password;
    return apiRequest(ruta(id), { method: 'PUT', body });
  },

  /** PUT /api/usuarios/{id}/rol { rolId } — rolId null quita el rol */
  cambiarRol: (id, rolId) =>
    apiRequest(ruta(id, '/rol'), { method: 'PUT', body: { rolId: rolId ?? null } }),

  /** PATCH /api/usuarios/{id}/activo { activo } */
  cambiarActivo: (id, activo) =>
    apiRequest(ruta(id, '/activo'), { method: 'PATCH', body: { activo } }),
};

export const rolesService = {
  /** GET /api/roles → [{ id, nombre, descripcion, permisos }] */
  listar: () => apiRequest(ROLES),
};
