import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { rolesService, usuariosService } from '../../services/usuariosService';
import Modal from '../../components/ui/Modal';
import UsuarioFormModal from './UsuarioFormModal';
import CambiarRolModal from './CambiarRolModal';
import './UsuariosPage.css';

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Gestión de usuarios (requiere el permiso usuarios:gestionar).
 * Lista, búsqueda, creación, edición, cambio de rol y activar/desactivar.
 */
export default function UsuariosPage() {
  const { usuario: sesion, recargarUsuario } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [roles, setRoles] = useState([]);
  const [rolesCargando, setRolesCargando] = useState(false);
  const [rolesError, setRolesError] = useState('');

  // { tipo: 'crear' | 'editar' | 'rol' | 'desactivar', usuario? }
  const [modal, setModal] = useState(null);
  const [cambiandoActivoId, setCambiandoActivoId] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo: 'exito' | 'error', texto }
  const avisoTimer = useRef(null);

  const mostrarAviso = useCallback((tipo, texto) => {
    clearTimeout(avisoTimer.current);
    setAviso({ tipo, texto });
    if (tipo === 'exito') {
      avisoTimer.current = setTimeout(() => setAviso(null), 5000);
    }
  }, []);

  useEffect(() => () => clearTimeout(avisoTimer.current), []);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const lista = await usuariosService.listar();
      setUsuarios(Array.isArray(lista) ? lista : []);
    } catch (error) {
      setErrorCarga(error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Los roles se piden la primera vez que se abre un formulario que los necesita
  const cargarRoles = useCallback(async () => {
    if (roles.length > 0 || rolesCargando) return;
    setRolesCargando(true);
    setRolesError('');
    try {
      const lista = await rolesService.listar();
      setRoles(Array.isArray(lista) ? lista : []);
    } catch (error) {
      setRolesError(`No se pudieron cargar los roles: ${error.message}`);
    } finally {
      setRolesCargando(false);
    }
  }, [roles.length, rolesCargando]);

  const abrir = (tipo, usuario) => {
    setModal({ tipo, usuario });
    if (tipo === 'crear' || tipo === 'rol') cargarRoles();
  };

  const cerrarModal = useCallback(() => setModal(null), []);

  const alGuardar = useCallback(
    (mensaje) => {
      const editadoEsSesion = modal?.usuario?.id === sesion.id;
      setModal(null);
      mostrarAviso('exito', mensaje);
      cargarUsuarios();
      // Si se editó a sí mismo, refresca el nombre del encabezado
      if (editadoEsSesion) recargarUsuario();
    },
    [modal, sesion.id, mostrarAviso, cargarUsuarios, recargarUsuario],
  );

  const cambiarActivo = async (usuario, activo) => {
    setCambiandoActivoId(usuario.id);
    try {
      await usuariosService.cambiarActivo(usuario.id, activo);
      setModal(null);
      mostrarAviso('exito', `${usuario.nombre} ahora está ${activo ? 'activo' : 'inactivo'}.`);
      await cargarUsuarios();
    } catch (error) {
      setModal(null);
      mostrarAviso('error', error.message);
    } finally {
      setCambiandoActivoId(null);
    }
  };

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return usuarios;
    return usuarios.filter(
      (u) => normalizar(u.nombre).includes(q) || normalizar(u.email).includes(q),
    );
  }, [usuarios, busqueda]);

  const ocupado = cambiandoActivoId !== null;

  return (
    <section className="us">
      <Link to="/modulos" className="pl-volver">
        ← Volver al inicio
      </Link>

      <div className="us-encabezado">
        <div>
          <h1>Usuarios</h1>
          <p>Crea usuarios, asigna roles y activa o desactiva cuentas.</p>
        </div>
        <button type="button" className="pl-btn" onClick={() => abrir('crear')}>
          + Nuevo usuario
        </button>
      </div>

      {aviso && (
        <div
          className={`us-aviso us-aviso--${aviso.tipo}`}
          role={aviso.tipo === 'error' ? 'alert' : 'status'}
        >
          <span>{aviso.texto}</span>
          <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            ✕
          </button>
        </div>
      )}

      <div className="us-buscador">
        <input
          type="search"
          placeholder="Buscar por nombre o email…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar usuarios por nombre o email"
        />
        {!cargando && !errorCarga && (
          <span className="us-contador">
            {filtrados.length} de {usuarios.length}
          </span>
        )}
      </div>

      <div className="us-tabla-contenedor">
        {cargando ? (
          <div className="us-estado" role="status">
            Cargando usuarios…
          </div>
        ) : errorCarga ? (
          <div className="us-estado us-estado--error" role="alert">
            <p>No se pudo cargar la lista: {errorCarga}</p>
            <button type="button" className="pl-btn pl-btn--outline" onClick={cargarUsuarios}>
              Reintentar
            </button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="us-estado">
            {usuarios.length === 0
              ? 'Todavía no hay usuarios registrados.'
              : 'Ningún usuario coincide con la búsqueda.'}
          </div>
        ) : (
          <table className="us-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="us-col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u) => {
                const esSesion = u.id === sesion.id;
                const procesando = cambiandoActivoId === u.id;
                return (
                  <tr key={u.id} className={u.activo ? '' : 'us-fila--inactiva'}>
                    <td data-label="Nombre">
                      {u.nombre}
                      {esSesion && <span className="us-tu"> (tú)</span>}
                    </td>
                    <td data-label="Email">{u.email}</td>
                    <td data-label="Rol">
                      {u.rol ? (
                        <span className="us-rol">{u.rol}</span>
                      ) : (
                        <span className="us-rol us-rol--vacio">Sin rol</span>
                      )}
                    </td>
                    <td data-label="Estado">
                      <span className={`us-estado-pill ${u.activo ? 'es-activo' : 'es-inactivo'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="us-col-acciones">
                      <div className="us-acciones">
                        <button type="button" onClick={() => abrir('editar', u)} disabled={ocupado}>
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => abrir('rol', u)}
                          disabled={ocupado || esSesion}
                          title={esSesion ? 'No puedes cambiar tu propio rol' : undefined}
                        >
                          Cambiar rol
                        </button>
                        {u.activo ? (
                          <button
                            type="button"
                            className="us-peligro"
                            onClick={() => abrir('desactivar', u)}
                            disabled={ocupado || esSesion}
                            title={esSesion ? 'No puedes desactivarte a ti mismo' : undefined}
                          >
                            {procesando ? 'Desactivando…' : 'Desactivar'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="us-exito"
                            onClick={() => cambiarActivo(u, true)}
                            disabled={ocupado}
                          >
                            {procesando ? 'Activando…' : 'Activar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {(modal?.tipo === 'crear' || modal?.tipo === 'editar') && (
        <UsuarioFormModal
          modo={modal.tipo}
          usuario={modal.usuario}
          roles={roles}
          rolesCargando={rolesCargando}
          rolesError={rolesError}
          onCancelar={cerrarModal}
          onGuardado={alGuardar}
        />
      )}

      {modal?.tipo === 'rol' && (
        <CambiarRolModal
          usuario={modal.usuario}
          roles={roles}
          rolesCargando={rolesCargando}
          rolesError={rolesError}
          onCancelar={cerrarModal}
          onGuardado={alGuardar}
        />
      )}

      {modal?.tipo === 'desactivar' && (
        <Modal titulo="Desactivar usuario" onClose={cerrarModal} bloqueado={ocupado}>
          <div className="md-form">
            <p>
              ¿Seguro que quieres desactivar a <strong>{modal.usuario.nombre}</strong> (
              {modal.usuario.email})? No podrá iniciar sesión hasta que lo actives de nuevo.
            </p>
            <div className="md-acciones">
              <button
                type="button"
                className="pl-btn pl-btn--outline md-foco"
                onClick={cerrarModal}
                disabled={ocupado}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pl-btn us-btn-peligro"
                onClick={() => cambiarActivo(modal.usuario, false)}
                disabled={ocupado}
              >
                {ocupado ? 'Desactivando…' : 'Sí, desactivar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
