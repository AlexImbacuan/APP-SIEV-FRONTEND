import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../../../components/ui/Modal';
import { clientesService } from '../../../services/clientesService';
import PestanasCotizaciones from '../PestanasCotizaciones';
import ClienteFormModal from './ClienteFormModal';
import { formatearNumero } from '../siigo/siigoUtils';

/**
 * Catálogo de clientes (requiere clientes:gestionar). La empresa de cada cotización de
 * Siigo sale de aquí, cruzada por NIT.
 */
export default function ClientesPage({ base }) {
  const [clientes, setClientes] = useState(null);
  const [error, setError] = useState('');
  const [nits, setNits] = useState([]);
  const [errorNits, setErrorNits] = useState('');
  const [formulario, setFormulario] = useState(null); // { cliente } | { nitInicial }
  const [eliminando, setEliminando] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try {
      const lista = await clientesService.listar();
      setClientes(Array.isArray(lista) ? lista : []);
    } catch (err) {
      setError(err.message);
    }
    try {
      const lista = await clientesService.nitsSinCliente();
      setNits(Array.isArray(lista) ? lista : []);
      setErrorNits('');
    } catch (err) {
      setErrorNits(err.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardado = (texto) => {
    setFormulario(null);
    setAviso(texto);
    cargar();
  };

  const eliminar = async () => {
    setEnviando(true);
    setErrorEliminar('');
    try {
      await clientesService.eliminar(eliminando.id);
      setAviso(`Cliente ${eliminando.nombre} eliminado.`);
      setEliminando(null);
      cargar();
    } catch (err) {
      setErrorEliminar(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="us ct">
      <Link to="/modulos" className="pl-volver">
        ← Volver al inicio
      </Link>
      <PestanasCotizaciones base={base} />

      <div className="us-encabezado">
        <div>
          <h1>Clientes</h1>
          <p>
            Catálogo de empresas. El nombre se muestra en las cotizaciones de Siigo según el NIT.
          </p>
        </div>
        <div className="ct-botones">
          <button type="button" className="pl-btn" onClick={() => setFormulario({})}>
            + Nuevo cliente
          </button>
        </div>
      </div>

      {aviso && (
        <div className="us-aviso us-aviso--exito" role="status">
          <span>{aviso}</span>
          <button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso">
            ✕
          </button>
        </div>
      )}

      <div className="us-tabla-contenedor">
        {error ? (
          <div className="us-estado us-estado--error" role="alert">
            <p>No se pudo cargar la lista: {error}</p>
            <button type="button" className="pl-btn pl-btn--outline" onClick={cargar}>
              Reintentar
            </button>
          </div>
        ) : clientes === null ? (
          <div className="us-estado" role="status">
            Cargando clientes…
          </div>
        ) : clientes.length === 0 ? (
          <div className="us-estado">Todavía no hay clientes. Crea el primero.</div>
        ) : (
          <table className="us-tabla">
            <thead>
              <tr>
                <th>NIT</th>
                <th>Nombre</th>
                <th className="ct-num">Cotizaciones</th>
                <th>Activo</th>
                <th className="us-col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cl) => (
                <tr key={cl.id}>
                  <td data-label="NIT">{cl.nit}</td>
                  <td data-label="Nombre">
                    <strong>{cl.nombre}</strong>
                  </td>
                  <td data-label="Cotizaciones" className="ct-num">
                    {formatearNumero(cl.cotizaciones)}
                  </td>
                  <td data-label="Activo">
                    <span
                      className={`us-estado-pill ${cl.activo !== false ? 'es-activo' : 'es-inactivo'}`}
                    >
                      {cl.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <div className="us-acciones">
                      <button
                        type="button"
                        onClick={() => setFormulario({ cliente: cl })}
                        aria-label={`Editar ${cl.nombre}`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="us-peligro"
                        onClick={() => {
                          setErrorEliminar('');
                          setEliminando(cl);
                        }}
                        aria-label={`Eliminar ${cl.nombre}`}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="ct-subtitulo">NITs de Siigo sin cliente</h2>
      <p className="ct-siigo-nota">
        Cotizaciones de Siigo cuyo NIT todavía no tiene nombre de empresa. Crea el cliente para
        completar el catálogo.
      </p>
      <div className="us-tabla-contenedor">
        {errorNits ? (
          <div className="us-estado us-estado--error" role="alert">
            No se pudo cargar: {errorNits}
          </div>
        ) : nits.length === 0 ? (
          <div className="us-estado">Todos los NITs de Siigo tienen cliente. 👍</div>
        ) : (
          <table className="us-tabla">
            <thead>
              <tr>
                <th>NIT</th>
                <th className="ct-num">Cotizaciones</th>
                <th className="us-col-acciones">Acción</th>
              </tr>
            </thead>
            <tbody>
              {nits.map((n) => (
                <tr key={n.nit}>
                  <td data-label="NIT">{n.nit}</td>
                  <td data-label="Cotizaciones" className="ct-num">
                    {formatearNumero(n.cotizaciones)}
                  </td>
                  <td data-label="Acción">
                    <div className="us-acciones">
                      <button
                        type="button"
                        onClick={() => setFormulario({ nitInicial: n.nit })}
                        aria-label={`Crear cliente con NIT ${n.nit}`}
                      >
                        Crear
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formulario && (
        <ClienteFormModal
          cliente={formulario.cliente}
          nitInicial={formulario.nitInicial}
          onCancelar={() => setFormulario(null)}
          onGuardado={guardado}
        />
      )}

      {eliminando && (
        <Modal titulo="Eliminar cliente" onClose={() => setEliminando(null)} bloqueado={enviando}>
          <div className="md-form">
            <p>
              ¿Seguro que quieres eliminar a <strong>{eliminando.nombre}</strong> (NIT{' '}
              {eliminando.nit})?
            </p>
            <p className="md-ayuda">
              Las cotizaciones no se borran: solo dejan de mostrar el nombre de la empresa.
            </p>
            {errorEliminar && (
              <div className="md-error" role="alert">
                {errorEliminar}
              </div>
            )}
            <div className="md-acciones">
              <button
                type="button"
                className="pl-btn pl-btn--outline md-foco"
                onClick={() => setEliminando(null)}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pl-btn us-btn-peligro"
                onClick={eliminar}
                disabled={enviando}
              >
                {enviando ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
