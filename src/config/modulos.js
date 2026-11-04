/**
 * ÚNICO lugar donde se define qué módulos existen y quién ve cada uno.
 * Cada módulo se muestra según UNA de estas dos reglas:
 *  - `permiso`: el usuario debe tener ese permiso en `usuario.permisos`
 *    (lo que devuelve /api/auth/me). Es la forma recomendada.
 *  - `roles`:   el `usuario.rol` debe estar en la lista.
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
];

/** true si el usuario tiene el permiso (según /api/auth/me). */
export function tienePermiso(usuario, permiso) {
  return Boolean(usuario?.permisos?.includes(permiso));
}

/**
 * true si el usuario puede ver el módulo: por `permiso` si el módulo lo
 * define, o si no por `roles`. Sin usuario, o con rol null, no ve nada por rol.
 */
export function puedeVer(modulo, usuario) {
  if (!usuario) return false;
  if (modulo.permiso) return tienePermiso(usuario, modulo.permiso);
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
