import React, { useCallback, useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { siigoService } from '../../../services/siigoService';
import ControlSiigo, { UltimaEdicion } from './ControlSiigo';
import { formatearCantidad, formatearFecha, formatearPesos, oGuion } from './siigoUtils';

/** "3 % · $ 606.000" para descuentos e impuestos. */
function porcentajeYValor(item) {
  if (!item) return '—';
  const partes = [];
  if (item.percentage !== null && item.percentage !== undefined) {
    partes.push(`${formatearCantidad(item.percentage)} %`);
  }
  if (item.value !== null && item.value !== undefined) partes.push(formatearPesos(item.value));
  return partes.length ? partes.join(' · ') : '—';
}

function iva(item) {
  const impuestos = (item.taxes || []).filter((t) => t.type === 'IVA');
  if (!impuestos.length) return '—';
  return impuestos.map(porcentajeYValor).join(' + ');
}

/**
 * Detalle de una cotización de Siigo: datos de Siigo (solo lectura) + control de SIEV.
 * Props:
 *  - id
 *  - responsables: [{ id, nombre }]
 *  - puedeEditar: siigo:editar
 *  - onActualizada(cotizacion): tras guardar el control, para refrescar la lista
 *  - onClose()
 */
export default function SiigoDetalleModal({
  id,
  responsables,
  puedeEditar,
  onActualizada,
  onClose,
}) {
  const [cotizacion, setCotizacion] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState('');
  // Cambia tras cada guardado para que el formulario tome los valores nuevos
  const [version, setVersion] = useState(0);

  const cargar = useCallback(async () => {
    setError('');
    setCotizacion(null);
    try {
      setCotizacion(await siigoService.obtener(id));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardado = (actualizada) => {
    if (actualizada?.id) {
      // Se reemplaza completa (el backend omite los campos vacíos); si la respuesta no trae
      // los ítems, se conservan los ya cargados
      setCotizacion((prev) => ({
        ...actualizada,
        items: actualizada.items || prev.items,
        encabezadoSiigo: actualizada.encabezadoSiigo ?? prev.encabezadoSiigo,
      }));
    }
    setVersion((v) => v + 1);
    setAviso('Control guardado.');
    onActualizada(actualizada);
  };

  const c = cotizacion;
  const items = c?.items || [];

  return (
    <Modal
      titulo={c ? `Cotización ${c.numero}` : 'Cotización de Siigo'}
      onClose={onClose}
      bloqueado={enviando}
      amplio
    >
      {error ? (
        <div className="md-form">
          <div className="md-error" role="alert">
            No se pudo cargar la cotización: {error}
          </div>
          <div className="md-acciones">
            <button type="button" className="pl-btn pl-btn--outline" onClick={cargar}>
              Reintentar
            </button>
          </div>
        </div>
      ) : !c ? (
        <div className="us-estado" role="status">
          Cargando cotización…
        </div>
      ) : (
        <div className="ct-siigo-detalle">
          {c.eliminadaEnSiigo && (
            <div className="us-aviso us-aviso--error" role="alert">
              <span>Esta cotización fue eliminada en Siigo.</span>
            </div>
          )}

          {/* ===== Datos de Siigo (solo lectura) ===== */}
          <section className="ct-siigo-seccion" aria-labelledby="sg-titulo-siigo">
            <div className="ct-siigo-seccion__head">
              <h3 id="sg-titulo-siigo" className="ct-subtitulo">
                Datos de Siigo <span className="ct-siigo-contador">(solo lectura)</span>
              </h3>
              {c.urlPublica && (
                <a
                  className="pl-btn pl-btn--outline"
                  href={c.urlPublica}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver en Siigo ↗
                </a>
              )}
            </div>

            <dl className="ct-datos">
              <div>
                <dt>Número</dt>
                <dd>
                  <strong>{c.numero}</strong>
                </dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{formatearFecha(c.fecha)}</dd>
              </div>
              <div>
                <dt>Empresa</dt>
                <dd>
                  {oGuion(c.empresa)}
                  <span className="ct-siigo-nit">NIT {oGuion(c.clienteNit)}</span>
                </dd>
              </div>
              {c.sede && (
                <div>
                  <dt>Sede</dt>
                  <dd>{c.sede}</dd>
                </div>
              )}
              <div>
                <dt>Subtotal</dt>
                <dd>{formatearPesos(c.subtotal)}</dd>
              </div>
              <div>
                <dt>IVA</dt>
                <dd>{formatearPesos(c.iva)}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>
                  <strong>{formatearPesos(c.total)}</strong>
                </dd>
              </div>
            </dl>

            {c.encabezadoSiigo && (
              <details className="ct-encabezado">
                <summary>Encabezado original</summary>
                <p className="ct-siigo-descripcion">{c.encabezadoSiigo}</p>
              </details>
            )}

            <h4 className="ct-siigo-items-titulo">
              Ítems <span className="ct-siigo-contador">({items.length})</span>
            </h4>
            <div className="us-tabla-contenedor">
              {items.length === 0 ? (
                <div className="us-estado">Esta cotización no tiene ítems.</div>
              ) : (
                <table className="us-tabla ct-siigo-items">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th className="ct-num">Cantidad</th>
                      <th className="ct-num">Precio</th>
                      <th className="ct-num">Descuento</th>
                      <th className="ct-num">IVA</th>
                      <th className="ct-num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      // El id es el del producto y se repite dentro de la cotización: se usa el índice
                      <tr key={i}>
                        <td data-label="Código">{item.code || '—'}</td>
                        <td data-label="Descripción" className="ct-siigo-descripcion">
                          {item.description || '—'}
                        </td>
                        <td data-label="Cantidad" className="ct-num">
                          {formatearCantidad(item.quantity)}
                        </td>
                        <td data-label="Precio" className="ct-num">
                          {formatearPesos(item.price)}
                        </td>
                        <td data-label="Descuento" className="ct-num">
                          {item.discount ? porcentajeYValor(item.discount) : '—'}
                        </td>
                        <td data-label="IVA" className="ct-num">
                          {iva(item)}
                        </td>
                        <td data-label="Total" className="ct-num">
                          <strong>{formatearPesos(item.total)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* ===== Control SIEV ===== */}
          <section
            className="ct-siigo-seccion ct-siigo-seccion--control"
            aria-labelledby="sg-titulo-control"
          >
            <h3 id="sg-titulo-control" className="ct-subtitulo">
              Control SIEV
            </h3>
            {aviso && (
              <div className="us-aviso us-aviso--exito" role="status">
                <span>{aviso}</span>
                <button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso">
                  ✕
                </button>
              </div>
            )}
            <ControlSiigo
              key={version}
              cotizacion={c}
              responsables={responsables}
              puedeEditar={puedeEditar}
              onGuardado={guardado}
              onEditando={() => setAviso('')}
              onEnviando={setEnviando}
            />
            <UltimaEdicion cotizacion={c} />
          </section>
        </div>
      )}
    </Modal>
  );
}
