import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import { usuariosService } from '../../services/usuariosService';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(datos, modo) {
  const errores = {};
  if (!datos.nombre.trim()) errores.nombre = 'Ingresa el nombre.';
  if (!datos.email.trim()) errores.email = 'Ingresa el email.';
  else if (!EMAIL_VALIDO.test(datos.email.trim())) errores.email = 'El email no es válido.';
  if (modo === 'crear') {
    if (!datos.password) errores.password = 'Ingresa una contraseña.';
    if (!datos.rolId) errores.rolId = 'Selecciona un rol.';
  }
  return errores;
}

/**
 * Formulario para crear (modo "crear") o editar (modo "editar") un usuario.
 * Props:
 *  - modo: 'crear' | 'editar'
 *  - usuario: el usuario a editar (solo en modo editar)
 *  - roles, rolesCargando, rolesError: lista de GET /api/roles (solo en modo crear)
 *  - onCancelar()
 *  - onGuardado(mensaje): se llama tras guardar con éxito
 */
export default function UsuarioFormModal({
  modo,
  usuario,
  roles = [],
  rolesCargando = false,
  rolesError = '',
  onCancelar,
  onGuardado,
}) {
  const esCrear = modo === 'crear';
  const [datos, setDatos] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
    password: '',
    rolId: '',
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: undefined }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;

    const nuevosErrores = validar(datos, modo);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setEnviando(true);
    setErrorServidor('');
    const payload = {
      nombre: datos.nombre.trim(),
      email: datos.email.trim(),
      password: datos.password,
    };

    try {
      if (esCrear) {
        await usuariosService.crear({ ...payload, rolId: Number(datos.rolId) });
        onGuardado(`Usuario ${payload.nombre} creado correctamente.`);
      } else {
        await usuariosService.editar(usuario.id, payload);
        onGuardado(`Datos de ${payload.nombre} actualizados.`);
      }
    } catch (error) {
      // El mensaje del backend tal cual (p. ej. "Ya existe un usuario con ese email")
      setErrorServidor(error.message);
      setEnviando(false);
    }
  };

  const rolSeleccionado = roles.find((rol) => String(rol.id) === datos.rolId);

  return (
    <Modal
      titulo={esCrear ? 'Nuevo usuario' : 'Editar usuario'}
      onClose={onCancelar}
      bloqueado={enviando}
    >
      <form className="md-form" onSubmit={enviar} noValidate>
        <div className="md-campo">
          <label htmlFor="us-nombre">Nombre</label>
          <input
            id="us-nombre"
            name="nombre"
            value={datos.nombre}
            onChange={cambiar}
            disabled={enviando}
            autoComplete="off"
            aria-invalid={Boolean(errores.nombre)}
          />
          {errores.nombre && <span className="md-error-campo">{errores.nombre}</span>}
        </div>

        <div className="md-campo">
          <label htmlFor="us-email">Email</label>
          <input
            id="us-email"
            name="email"
            type="email"
            value={datos.email}
            onChange={cambiar}
            disabled={enviando}
            autoComplete="off"
            aria-invalid={Boolean(errores.email)}
          />
          {errores.email && <span className="md-error-campo">{errores.email}</span>}
        </div>

        <div className="md-campo">
          <label htmlFor="us-password">Contraseña</label>
          <input
            id="us-password"
            name="password"
            type="password"
            value={datos.password}
            onChange={cambiar}
            disabled={enviando}
            autoComplete="new-password"
            placeholder={esCrear ? '' : 'Dejar vacía para no cambiarla'}
            aria-invalid={Boolean(errores.password)}
          />
          {errores.password ? (
            <span className="md-error-campo">{errores.password}</span>
          ) : (
            !esCrear && (
              <span className="md-ayuda">Déjala vacía para mantener la contraseña actual.</span>
            )
          )}
        </div>

        {esCrear && (
          <div className="md-campo">
            <label htmlFor="us-rol">Rol</label>
            <select
              id="us-rol"
              name="rolId"
              value={datos.rolId}
              onChange={cambiar}
              disabled={enviando || rolesCargando || Boolean(rolesError)}
              aria-invalid={Boolean(errores.rolId)}
            >
              <option value="">{rolesCargando ? 'Cargando roles…' : 'Selecciona un rol'}</option>
              {roles.map((rol) => (
                <option key={rol.id} value={String(rol.id)}>
                  {rol.nombre}
                  {rol.descripcion ? ` — ${rol.descripcion}` : ''}
                </option>
              ))}
            </select>
            {rolesError && <span className="md-error-campo">{rolesError}</span>}
            {errores.rolId && <span className="md-error-campo">{errores.rolId}</span>}
            {rolSeleccionado?.descripcion && (
              <span className="md-ayuda">{rolSeleccionado.descripcion}</span>
            )}
          </div>
        )}

        {errorServidor && (
          <div className="md-error" role="alert">
            {errorServidor}
          </div>
        )}

        <div className="md-acciones">
          <button
            type="button"
            className="pl-btn pl-btn--outline"
            onClick={onCancelar}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button type="submit" className="pl-btn" disabled={enviando}>
            {enviando ? 'Guardando…' : esCrear ? 'Crear usuario' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
