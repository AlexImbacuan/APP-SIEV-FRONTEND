import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import { usuariosService } from '../../services/usuariosService';

const SIN_ROL = '';

/**
 * Cambia el rol de un usuario. El rol actual llega como nombre ("TECNICO"),
 * así que se busca su id en la lista de GET /api/roles para preseleccionarlo.
 * La opción "Sin rol" envía rolId null (quita el rol).
 */
export default function CambiarRolModal({
  usuario,
  roles = [],
  rolesCargando = false,
  rolesError = '',
  onCancelar,
  onGuardado,
}) {
  const rolActual = roles.find((rol) => rol.nombre === usuario.rol);
  const [rolId, setRolId] = useState(rolActual ? String(rolActual.id) : SIN_ROL);
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Si los roles terminan de cargar después de abrir, se preselecciona el actual
  const [preseleccionado, setPreseleccionado] = useState(Boolean(rolActual));
  if (!preseleccionado && rolActual) {
    setPreseleccionado(true);
    setRolId(String(rolActual.id));
  }

  const sinCambios = rolId === (rolActual ? String(rolActual.id) : SIN_ROL);
  const rolElegido = roles.find((rol) => String(rol.id) === rolId);

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando || sinCambios) return;

    setEnviando(true);
    setErrorServidor('');
    try {
      await usuariosService.cambiarRol(usuario.id, rolId === SIN_ROL ? null : Number(rolId));
      const nombreRol = rolElegido ? rolElegido.nombre : 'Sin rol';
      onGuardado(`Rol de ${usuario.nombre} cambiado a ${nombreRol}.`);
    } catch (error) {
      setErrorServidor(error.message);
      setEnviando(false);
    }
  };

  return (
    <Modal titulo="Cambiar rol" onClose={onCancelar} bloqueado={enviando}>
      <form className="md-form" onSubmit={enviar}>
        <p>
          Usuario: <strong>{usuario.nombre}</strong> ({usuario.email})
          <br />
          Rol actual: <strong>{usuario.rol || 'Sin rol'}</strong>
        </p>

        <div className="md-campo">
          <label htmlFor="us-nuevo-rol">Nuevo rol</label>
          <select
            id="us-nuevo-rol"
            value={rolId}
            onChange={(e) => setRolId(e.target.value)}
            disabled={enviando || rolesCargando || Boolean(rolesError)}
          >
            {rolesCargando && <option value={SIN_ROL}>Cargando roles…</option>}
            {!rolesCargando && <option value={SIN_ROL}>Sin rol (quitar el rol)</option>}
            {roles.map((rol) => (
              <option key={rol.id} value={String(rol.id)}>
                {rol.nombre}
                {rol.descripcion ? ` — ${rol.descripcion}` : ''}
              </option>
            ))}
          </select>
          {rolesError && <span className="md-error-campo">{rolesError}</span>}
          {rolElegido?.descripcion && <span className="md-ayuda">{rolElegido.descripcion}</span>}
        </div>

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
          <button
            type="submit"
            className="pl-btn"
            disabled={enviando || sinCambios || rolesCargando || Boolean(rolesError)}
          >
            {enviando ? 'Guardando…' : 'Cambiar rol'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
