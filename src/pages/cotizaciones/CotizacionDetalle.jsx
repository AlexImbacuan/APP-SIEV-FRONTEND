import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERMISOS, tienePermiso } from '../../config/modulos';
import { cotizacionesService } from '../../services/cotizacionesService';
import Modal from '../../components/ui/Modal';
import EstadoCotizacion from './EstadoCotizacion';
import AvisosCotizacion from './AvisosCotizacion';
import { ESTADOS, formatearFechaHora, formatearMoneda } from './cotizacionesUtils';

/** Detalle de una cotización con sus acciones según los permisos del usuario. */
export default function CotizacionDetalle({ base }) {
  const { cotizacionId } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const puedeEditar = tienePermiso(usuario, PERMISOS.COTIZACIONES_EDITAR);
  const puedeAprobar = tienePermiso(usuario, PERMISOS.COTIZACIONES_APROBAR);
  const puedeEliminar = tienePermiso(usuario, PERMISOS.COTIZACIONES_ELIMINAR);

  const [cotizacion, setCotizacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null); // { estado, mensaje }
  const [aviso, setAviso] = useState(
    location.state?.aviso ? { tipo: 'exito', texto: location.state.aviso } : null,
  );
  const [enviando, setEnviando] = useState(false);
  const [modal, setModal] = useState(null); // 'rechazar' | 'eliminar'
  const [motivo, setMotivo] = useState('');
  const [errorModal, setErrorModal] = useState('');

  // El aviso que llega desde el formulario ("Cotización creada") se muestra una sola vez
  useEffect(() => {
    if (location.state?.aviso) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setCotizacion(await cotizacionesService.obtener(cotizacionId));
    } catch (err) {
      setError({ estado: err.estado, mensaje: err.message });
    } finally {
      setCargando(false);
    }
  }, [cotizacionId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cerrarModal = useCallback(() => {
    setModal(null);
    setMotivo('');
    setErrorModal('');
  }, []);

  const cambiarEstado = async (estado, motivoRechazo) => {
    setEnviando(true);
    setErrorModal('');
    try {
      const respuesta = await cotizacionesService.cambiarEstado(
        cotizacion.id,
        estado,
        motivoRechazo,
      );
      // El backend devuelve la cotización completa (con avisos); si no, se recarga
      if (respuesta && typeof respuesta === 'object' && respuesta.id) setCotizacion(respuesta);
      else await cargar();
      cerrarModal();
      setAviso({ tipo: 'exito', texto: `Estado cambiado a "${ESTADOS[estado].etiqueta}".` });
    } catch (err) {
      if (modal) setErrorModal(err.message);
      else setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  const rechazar = (e) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setErrorModal('Escribe el motivo por el que no fue aprobada.');
      return;
    }
    cambiarEstado(ESTADOS.NO_APROBADA.valor, motivo.trim());
  };

  const eliminar = async () => {
    setEnviando(true);
    setErrorModal('');
    try {
      await cotizacionesService.eliminar(cotizacion.id);
      navigate(base, { state: { aviso: `Cotización ${cotizacion.numero} eliminada.` } });
    } catch (err) {
      setErrorModal(err.message);
      setEnviando(false);
    }
  };

  const volver = (
    <Link to={base} className="pl-volver">
      ← Volver a cotizaciones
    </Link>
  );

  if (cargando && !cotizacion) {
    return (
      <section className="us ct">
        {volver}
        <div className="us-estado" role="status">
          Cargando cotización…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="us ct">
        {volver}
        <div className="pl-aviso pl-aviso--error ct-mt" role="alert">
          <h1>{error.estado === 404 ? 'La cotización no existe' : 'No se pudo cargar'}</h1>
          <p>{error.mensaje}</p>
          {error.estado !== 404 && (
            <button type="button" className="pl-btn" onClick={cargar}>
              Reintentar
            </button>
          )}
        </div>
      </section>
    );
  }

  const c = cotizacion;
  const items = c.items || [];

  return (
    <section className="us ct">
      {volver}

      <div className="us-encabezado">
        <div>
          <p className="ct-eyebrow">Cotización</p>
          <h1 className="ct-titulo">
            {c.numero} <EstadoCotizacion estado={c.estado} />
          </h1>
          <p>{c.cliente}</p>
        </div>

        {(puedeEditar || puedeEliminar) && (
          <div className="ct-botones">
            {puedeEliminar && (
              <button
                type="button"
                className="pl-btn pl-btn--outline ct-btn-peligro"
                onClick={() => setModal('eliminar')}
                disabled={enviando}
              >
                Eliminar
              </button>
            )}
            {puedeEditar && (
              <button
                type="button"
                className="pl-btn"
                onClick={() => navigate(`${base}/${c.id}/editar`)}
                disabled={enviando}
              >
                Editar
              </button>
            )}
          </div>
        )}
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

      <AvisosCotizacion avisos={c.avisos} />

      {c.estado === ESTADOS.NO_APROBADA.valor && c.motivoRechazo && (
        <div className="ct-motivo">
          <strong>Motivo de no aprobación:</strong> {c.motivoRechazo}
        </div>
      )}

      {puedeAprobar && (
        <div className="ct-panel ct-acciones-estado">
          <span>Cambiar estado:</span>
          {c.estado !== ESTADOS.APROBADA.valor && (
            <button
              type="button"
              className="ct-btn-estado ct-btn-estado--aprobada"
              onClick={() => cambiarEstado(ESTADOS.APROBADA.valor)}
              disabled={enviando}
            >
              Aprobar
            </button>
          )}
          {c.estado !== ESTADOS.NO_APROBADA.valor && (
            <button
              type="button"
              className="ct-btn-estado ct-btn-estado--no-aprobada"
              onClick={() => setModal('rechazar')}
              disabled={enviando}
            >
              No aprobar
            </button>
          )}
          {c.estado !== ESTADOS.PENDIENTE.valor && (
            <button
              type="button"
              className="ct-btn-estado ct-btn-estado--pendiente"
              onClick={() => cambiarEstado(ESTADOS.PENDIENTE.valor)}
              disabled={enviando}
            >
              Volver a pendiente
            </button>
          )}
        </div>
      )}

      <div className="ct-panel">
        <dl className="ct-datos">
          <div>
            <dt>Cliente</dt>
            <dd>{c.cliente}</dd>
          </div>
          <div>
            <dt>Ing. solicitante</dt>
            <dd>{c.ingSolicitante || '—'}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{c.responsable?.nombre || 'Sin responsable'}</dd>
          </div>
          <div>
            <dt>Factura</dt>
            <dd>
              {c.facturada ? (
                <span className="ct-factura">{c.numeroFactura}</span>
              ) : (
                <span className="ct-sin-factura">No facturada</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Creada</dt>
            <dd>{formatearFechaHora(c.creadoEn)}</dd>
          </div>
          <div>
            <dt>Última actualización</dt>
            <dd>{formatearFechaHora(c.actualizadoEn)}</dd>
          </div>
        </dl>
      </div>

      <h2 className="ct-subtitulo">Materiales</h2>
      <div className="us-tabla-contenedor">
        {items.length === 0 ? (
          <div className="us-estado">Esta cotización no tiene materiales registrados.</div>
        ) : (
          <table className="us-tabla ct-tabla-items">
            <thead>
              <tr>
                <th>Descripción</th>
                <th className="ct-num">Cantidad</th>
                <th className="ct-num">Valor unitario</th>
                <th className="ct-num">Valor bruto</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                // Los materiales no tienen id propio y esta tabla es de solo lectura
                <tr key={i}>
                  <td data-label="Descripción">{item.descripcion}</td>
                  <td data-label="Cantidad" className="ct-num">
                    {Number(item.cantidad).toLocaleString('es-CO')}
                  </td>
                  <td data-label="Valor unitario" className="ct-num">
                    {formatearMoneda(item.valorUnitario)}
                  </td>
                  <td data-label="Valor bruto" className="ct-num">
                    {formatearMoneda(item.valorBruto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="ct-totales">
        <div>
          <span>Subtotal</span>
          <strong>{formatearMoneda(c.subtotal)}</strong>
        </div>
        <div>
          <span>IVA</span>
          <strong>{formatearMoneda(c.iva)}</strong>
        </div>
        <div className="ct-totales__total">
          <span>Total</span>
          <strong>{formatearMoneda(c.total)}</strong>
        </div>
      </div>

      {c.notas && (
        <>
          <h2 className="ct-subtitulo">Notas</h2>
          <div className="ct-panel ct-notas">{c.notas}</div>
        </>
      )}

      {modal === 'rechazar' && (
        <Modal titulo="No aprobar cotización" onClose={cerrarModal} bloqueado={enviando}>
          <form className="md-form" onSubmit={rechazar} noValidate>
            <p>
              Cotización <strong>{c.numero}</strong> — {c.cliente}
            </p>
            <div className="md-campo">
              <label htmlFor="ct-motivo">Motivo (obligatorio)</label>
              <textarea
                id="ct-motivo"
                className="ct-textarea"
                rows="3"
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  setErrorModal('');
                }}
                disabled={enviando}
                placeholder="Ej.: El cliente consiguió mejor precio"
                aria-invalid={Boolean(errorModal)}
              />
            </div>
            {errorModal && (
              <div className="md-error" role="alert">
                {errorModal}
              </div>
            )}
            <div className="md-acciones">
              <button
                type="button"
                className="pl-btn pl-btn--outline"
                onClick={cerrarModal}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button type="submit" className="pl-btn us-btn-peligro" disabled={enviando}>
                {enviando ? 'Guardando…' : 'Marcar como no aprobada'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'eliminar' && (
        <Modal titulo="Eliminar cotización" onClose={cerrarModal} bloqueado={enviando}>
          <div className="md-form">
            <p>
              ¿Seguro que quieres eliminar la cotización <strong>{c.numero}</strong> de {c.cliente}?
              Esta acción no se puede deshacer.
            </p>
            {errorModal && (
              <div className="md-error" role="alert">
                {errorModal}
              </div>
            )}
            <div className="md-acciones">
              <button
                type="button"
                className="pl-btn pl-btn--outline md-foco"
                onClick={cerrarModal}
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
                {enviando ? 'Eliminando…' : `Sí, eliminar ${c.numero}`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
