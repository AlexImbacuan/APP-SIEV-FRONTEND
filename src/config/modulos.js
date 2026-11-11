/**
 * ÚNICO lugar donde se define qué módulos existen y quién ve cada uno.
 * Cada módulo se muestra según UNA de estas reglas:
 *  - `permiso`:  el usuario debe tener ese permiso en `usuario.permisos`
 *    (lo que devuelve /api/auth/me). Es la forma recomendada.
 *  - `permisos`: lista de permisos alternativos; basta con tener uno.
 *  - `roles`:    el `usuario.rol` debe estar en la lista.
 * Para agregar un módulo, agregue un objeto a MODULOS (la ruta se crea sola).
 * Si el módulo tiene una pantalla propia, regístrela en pages/modulos/ModuloPage.jsx.
 *
 * Ojo: ocultar un módulo aquí es solo para la interfaz. La seguridad real la
 * hace el backend, que valida rol y permisos en cada petición.
 */

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  SUPERVISOR: 'SUPERVISOR',
  TECNICO: 'TECNICO',
};

// Permisos del backend que usa el frontend para mostrar u ocultar pantallas
export const PERMISOS = {
  USUARIOS_GESTIONAR: 'usuarios:gestionar',
  ROLES_GESTIONAR: 'roles:gestionar',
  COTIZACIONES_VER: 'cotizaciones:ver',
  COTIZACIONES_CREAR: 'cotizaciones:crear',
  COTIZACIONES_EDITAR: 'cotizaciones:editar',
  COTIZACIONES_APROBAR: 'cotizaciones:aprobar',
  COTIZACIONES_ELIMINAR: 'cotizaciones:eliminar',
  // Control de cotizaciones de Siigo y catálogo de clientes (se asignan por permiso
  // desde la gestión de roles, nunca por nombre de rol)
  SIIGO_EXPLORAR: 'siigo:explorar', // ver la pestaña, la lista, el detalle y sincronizar
  SIIGO_EDITAR: 'siigo:editar', // editar el control y cambiar el estado
  CLIENTES_GESTIONAR: 'clientes:gestionar', // pantalla de Clientes (crear, editar, eliminar)
};

// Nombre legible de cada rol para mostrar en pantalla
export const NOMBRE_ROL = {
  SUPERADMIN: 'Superadministrador',
  SUPERVISOR: 'Supervisor',
  TECNICO: 'Técnico',
};

const { SUPERADMIN, SUPERVISOR, TECNICO } = ROLES;

export const MODULOS = [
  {
    id: 'administracion',
    titulo: 'Administración',
    descripcion: 'Gestión general de la empresa.',
    ruta: '/modulos/administracion',
    roles: [SUPERADMIN],
  },
  {
    id: 'ventas',
    titulo: 'Ventas',
    descripcion: 'Cotizaciones, clientes y seguimiento comercial.',
    ruta: '/modulos/ventas',
    roles: [SUPERADMIN, SUPERVISOR],
  },
  {
    id: 'trabajador',
    titulo: 'Trabajador',
    descripcion: 'Actividades y reportes del trabajo en campo.',
    ruta: '/modulos/trabajador',
    roles: [SUPERADMIN, TECNICO],
  },
  {
    id: 'admin',
    titulo: 'Admin',
    descripcion: 'Módulo exclusivo del administrador.',
    ruta: '/modulos/admin',
    roles: [SUPERADMIN],
  },
  {
    id: 'comun',
    titulo: 'Uso común',
    descripcion: 'Módulo compartido por supervisores y técnicos.',
    ruta: '/modulos/comun',
    roles: [SUPERVISOR, TECNICO],
  },
  {
    id: 'usuarios',
    titulo: 'Usuarios',
    descripcion: 'Crear usuarios, asignar roles y activar o desactivar cuentas.',
    ruta: '/modulos/usuarios',
    permiso: PERMISOS.USUARIOS_GESTIONAR,
  },
  {
    id: 'cotizaciones',
    titulo: 'Cotizaciones',
    descripcion: 'Cotizaciones de Siigo con su control: estado, OC, factura y pagos.',
    ruta: '/modulos/cotizaciones',
    // El registro propio (cotizaciones:ver) o solo el control de Siigo (siigo:explorar)
    permisos: [PERMISOS.COTIZACIONES_VER, PERMISOS.SIIGO_EXPLORAR],
  },
];

/** true si el usuario tiene el permiso (según /api/auth/me). */
export function tienePermiso(usuario, permiso) {
  return Boolean(usuario?.permisos?.includes(permiso));
}

/** true si el usuario tiene al menos uno de los permisos. */
export function tieneAlgunPermiso(usuario, permisos = []) {
  return permisos.some((permiso) => tienePermiso(usuario, permiso));
}

/**
 * true si el usuario puede ver el módulo: por `permiso` o `permisos` (basta uno)
 * si el módulo los define, o si no por `roles`. Sin usuario, o con rol null, no ve
 * nada por rol.
 */
export function puedeVer(modulo, usuario) {
  if (!usuario) return false;
  if (modulo.permiso) return tienePermiso(usuario, modulo.permiso);
  if (modulo.permisos) return tieneAlgunPermiso(usuario, modulo.permisos);
  return Boolean(usuario.rol) && Boolean(modulo.roles?.includes(usuario.rol));
}

/** Módulos que puede ver el usuario, en el orden definido arriba. */
export function modulosVisibles(usuario) {
  return MODULOS.filter((modulo) => puedeVer(modulo, usuario));
}

export function buscarModulo(id) {
  return MODULOS.find((modulo) => modulo.id === id);
}

export function nombreRol(rol) {
  return NOMBRE_ROL[rol] || rol || 'Sin rol';
}
