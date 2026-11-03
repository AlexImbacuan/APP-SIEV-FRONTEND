/**
 * ÚNICO lugar donde se define qué módulos existen y qué rol ve cada uno.
 * Para cambiar quién ve un módulo, edite su arreglo `roles`.
 * Para agregar un módulo, agregue un objeto a MODULOS (la ruta se crea sola).
 *
 * Ojo: ocultar un módulo aquí es solo para la interfaz. La seguridad real la
 * hace el backend, que valida rol y permisos en cada petición.
 */

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  SUPERVISOR: 'SUPERVISOR',
  TECNICO: 'TECNICO',
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
];

/** true si el rol puede ver el módulo. Un rol null no ve ninguno. */
export function puedeVer(modulo, rol) {
  return Boolean(rol) && modulo.roles.includes(rol);
}

/** Módulos que puede ver un rol, en el orden definido arriba. */
export function modulosVisibles(rol) {
  return MODULOS.filter((modulo) => puedeVer(modulo, rol));
}

export function buscarModulo(id) {
  return MODULOS.find((modulo) => modulo.id === id);
}

export function nombreRol(rol) {
  return NOMBRE_ROL[rol] || rol || 'Sin rol';
}
