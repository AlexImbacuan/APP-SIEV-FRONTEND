import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { cotizacionesService } from '../../services/cotizacionesService';
import AvisosCotizacion from './AvisosCotizacion';
import { IVA_PORCENTAJE, aNumero, formatearMoneda, redondear } from './cotizacionesUtils';

let siguienteClave = 1;
const nuevaClave = () => `m${siguienteClave++}`;

/** Número del backend → texto para el input (coma decimal, sin separador de miles). */
function aTexto(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '';
  return String(valor).replace('.', ',');
}

function materialVacio() {
  return { clave: nuevaClave(), descripcion: '', cantidad: '', valorUnitario: '' };
}

/** Arma el estado del formulario a partir de una cotización o de la lectura del PDF. */
function estadoInicial(origen) {
  const items = (origen?.items || []).map((item) => ({
    clave: nuevaClave(),
    descripcion: item.descripcion || '',
    cantidad: aTexto(item.cantidad),
    valorUnitario: aTexto(item.valorUnitario),
  }));

  // El IVA se deja automático (19 %) salvo que el dato traiga uno distinto
  const subtotalItems = items.reduce(
    (suma, m) => suma + (aNumero(m.cantidad) || 0) * (aNumero(m.valorUnitario) || 0),
    0,
  );
  const ivaDato = origen?.iva;
  const ivaAutomatico = redondear(subtotalItems * IVA_PORCENTAJE);
  const ivaManual =
    ivaDato !== null && ivaDato !== undefined && Math.abs(ivaDato - ivaAutomatico) > 1
      ? aTexto(ivaDato)
      : null;

  return {
    numero: origen?.numero || '',
    cliente: origen?.cliente || '',
    ingSolicitante: origen?.ingSolicitante || '',
    responsableId: origen?.responsable?.id ? String(origen.responsable.id) : '',
    numeroFactura: origen?.numeroFactura || '',
    notas: origen?.notas || '',
    items: items.length > 0 ? items : [materialVacio()],
    ivaManual,
  };
}

/** Fila sin ningún dato: se ignora al guardar (una cotización sin materiales es válida). */
function esFilaVacia(m) {
  return !m.descripcion.trim() && !String(m.cantidad).trim() && !String(m.valorUnitario).trim();
}

function validar(datos, iva) {
  const errores = {};
  if (!datos.numero.trim()) errores.numero = 'Ingresa el número de la cotización.';
  if (!datos.cliente.trim()) errores.cliente = 'Ingresa el cliente.';

  datos.items.forEach((m) => {
    if (esFilaVacia(m)) return;
    const cantidad = aNumero(m.cantidad);
    const valorUnitario = aNumero(m.valorUnitario);
    const e = {};
    if (!m.descripcion.trim()) e.descripcion = 'Falta la descripción.';
    if (cantidad === null) e.cantidad = 'Cantidad inválida.';
    else if (cantidad < 0) e.cantidad = 'No puede ser negativa.';
    if (valorUnitario === null) e.valorUnitario = 'Valor inválido.';
    else if (valorUnitario < 0) e.valorUnitario = 'No puede ser negativo.';
    if (Object.keys(e).length > 0) errores[m.clave] = e;
  });

  if (datos.ivaManual !== null) {
    if (iva === null) errores.iva = 'IVA inválido.';
    else if (iva < 0) errores.iva = 'El IVA no puede ser negativo.';
  }
  return errores;
}

/**
 * Formulario de cotización: nueva (vacía o llenada desde el PDF de Siigo) y editar.
 * Muestra el valor bruto y los totales calculados en vivo. Al editar envía TODO,
 * porque PUT reemplaza la cotización completa (incluidos los materiales).
 */
export default function CotizacionForm({ base }) {
  const { cotizacionId } = useParams();
  const esEdicion = Boolean(cotizacionId);
  const navigate = useNavigate();
  const location = useLocation();
  const lecturaPdf = esEdicion ? null : location.state?.lecturaPdf || null;
  const nombreArchivo = location.state?.nombreArchivo || '';

  const [datos, setDatos] = useState(() => (esEdicion ? null : estadoInicial(lecturaPdf)));
  const [avisosOrigen, setAvisosOrigen] = useState(lecturaPdf?.avisos || []);
  const [cargando, setCargando] = useState(esEdicion);
  const [errorCarga, setErrorCarga] = useState('');
  const [responsables, setResponsables] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);
  const errorRef = useRef(null);

  // Edición: se cargan los datos actuales de la cotización
  useEffect(() => {
    if (!esEdicion) return undefined;
    let activo = true;
    cotizacionesService
      .obtener(cotizacionId)
      .then((cotizacion) => {
        if (!activo) return;
        setDatos(estadoInicial(cotizacion));
        setAvisosOrigen(cotizacion.avisos || []);
      })
      .catch((err) => activo && setErrorCarga(err.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [esEdicion, cotizacionId]);

  useEffect(() => {
    cotizacionesService
      .responsables()
      .then((lista) => setResponsables(Array.isArray(lista) ? lista : []))
      .catch(() => setResponsables([]));
  }, []);

  // ---------- Cálculos en vivo ----------
  const calculos = useMemo(() => {
    if (!datos) return null;
    const brutos = {};
    let subtotal = 0;
    datos.items.forEach((m) => {
      const cantidad = aNumero(m.cantidad);
      const valorUnitario = aNumero(m.valorUnitario);
      const bruto =
        cantidad !== null && valorUnitario !== null ? redondear(cantidad * valorUnitario) : null;
      brutos[m.clave] = bruto;
      subtotal += bruto || 0;
    });
    subtotal = redondear(subtotal);
    const iva =
      datos.ivaManual !== null ? aNumero(datos.ivaManual) : redondear(subtotal * IVA_PORCENTAJE);
    const total = iva !== null ? redondear(subtotal + iva) : null;
    return { brutos, subtotal, iva, total };
  }, [datos]);

  // ---------- Cambios ----------
  const cambiar = (campo, valor) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    const claveError = campo === 'ivaManual' ? 'iva' : campo;
    if (errores[claveError]) setErrores((prev) => ({ ...prev, [claveError]: undefined }));
  };

  const cambiarMaterial = (clave, campo, valor) => {
    setDatos((prev) => ({
      ...prev,
      items: prev.items.map((m) => (m.clave === clave ? { ...m, [campo]: valor } : m)),
    }));
    if (errores[clave]?.[campo]) {
      setErrores((prev) => ({ ...prev, [clave]: { ...prev[clave], [campo]: undefined } }));
    }
  };

  const agregarMaterial = () =>
    setDatos((prev) => ({ ...prev, items: [...prev.items, materialVacio()] }));

  const quitarMaterial = (clave) =>
    setDatos((prev) => ({ ...prev, items: prev.items.filter((m) => m.clave !== clave) }));

  // ---------- PDF ya registrado ----------
  const idExistente = lecturaPdf?.idExistente || null;
  // No se deja guardar otra con el mismo número (el backend respondería 409)
  const bloqueadoPorExistente =
    Boolean(idExistente) && datos?.numero.trim() === (lecturaPdf?.numero || '').trim();

  // ---------- Envío ----------
  const enviar = async (e) => {
    e.preventDefault();
    if (enviando || bloqueadoPorExistente) return;

    const nuevosErrores = validar(datos, calculos.iva);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      setErrorServidor('Revisa los campos marcados en rojo.');
      return;
    }

    const cuerpo = {
      numero: datos.numero.trim(),
      cliente: datos.cliente.trim(),
      ingSolicitante: datos.ingSolicitante.trim() || null,
      responsableId: datos.responsableId ? Number(datos.responsableId) : null,
      items: datos.items
        .filter((m) => !esFilaVacia(m))
        .map((m) => ({
          descripcion: m.descripcion.trim(),
          cantidad: aNumero(m.cantidad),
          valorUnitario: aNumero(m.valorUnitario),
          valorBruto: calculos.brutos[m.clave],
        })),
      subtotal: calculos.subtotal,
      iva: calculos.iva,
      total: calculos.total,
      numeroFactura: datos.numeroFactura.trim() || null,
      notas: datos.notas.trim() || null,
    };

    setEnviando(true);
    setErrorServidor('');
    try {
      const guardada = esEdicion
        ? await cotizacionesService.editar(cotizacionId, cuerpo)
        : await cotizacionesService.crear(cuerpo);
      const id = guardada?.id ?? cotizacionId;
      navigate(`${base}/${id}`, {
        replace: true,
        state: { aviso: esEdicion ? 'Cambios guardados.' : 'Cotización creada.' },
      });
    } catch (err) {
      setErrorServidor(err.message);
      setEnviando(false);
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const destinoCancelar = esEdicion ? `${base}/${cotizacionId}` : base;

  // ---------- Render ----------
  if (cargando) {
    return (
      <section className="us ct">
        <div className="us-estado" role="status">
          Cargando cotización…
        </div>
      </section>
    );
  }

  if (errorCarga) {
    return (
      <section className="us ct">
        <Link to={base} className="pl-volver">
          ← Volver a cotizaciones
        </Link>
        <div className="pl-aviso pl-aviso--error ct-mt" role="alert">
          <h1>No se pudo cargar la cotización</h1>
          <p>{errorCarga}</p>
        </div>
      </section>
    );
  }

  const errorDe = (clave, campo) => errores[clave]?.[campo];

  return (
    <section className="us ct">
      <Link to={destinoCancelar} className="pl-volver">
        ← {esEdicion ? 'Volver al detalle' : 'Volver a cotizaciones'}
      </Link>

      <div className="us-encabezado">
        <div>
          <h1>{esEdicion ? `Editar cotización ${datos.numero}` : 'Nueva cotización'}</h1>
          <p>
            {lecturaPdf
              ? 'Datos leídos del PDF de Siigo. Revísalos, completa lo que falte y guarda.'
              : 'Los campos con * son obligatorios.'}
          </p>
        </div>
      </div>

      {lecturaPdf && (
        <div className="ct-info-pdf">
          📄 Formulario llenado desde <strong>{nombreArchivo || 'el PDF de Siigo'}</strong>. El PDF{' '}
          <strong>no se guarda</strong>: solo se usó para llenar estos campos.
        </div>
      )}

      {idExistente && (
        <div className="ct-existente" role="alert">
          <div>
            <strong>Esta cotización ya está registrada.</strong> Ya existe una cotización con el
            número <strong>{lecturaPdf.numero}</strong>, así que no se puede guardar otra igual.
          </div>
          <button
            type="button"
            className="pl-btn"
            onClick={() => navigate(`${base}/${idExistente}`)}
          >
            Abrir la cotización existente
          </button>
        </div>
      )}

      <AvisosCotizacion
        avisos={avisosOrigen}
        titulo={lecturaPdf ? 'Avisos al leer el PDF' : 'Avisos de esta cotización'}
      />

      <form className="ct-form" onSubmit={enviar} noValidate>
        <fieldset className="ct-panel" disabled={enviando}>
          <legend>Datos generales</legend>
          <div className="ct-grid">
            <div className="md-campo">
              <label htmlFor="ct-numero">Número *</label>
              <input
                id="ct-numero"
                value={datos.numero}
                onChange={(e) => cambiar('numero', e.target.value)}
                placeholder="Ej.: C-1-2562"
                aria-invalid={Boolean(errores.numero)}
              />
              {errores.numero && <span className="md-error-campo">{errores.numero}</span>}
            </div>

            <div className="md-campo">
              <label htmlFor="ct-cliente">Cliente *</label>
              <input
                id="ct-cliente"
                value={datos.cliente}
                onChange={(e) => cambiar('cliente', e.target.value)}
                aria-invalid={Boolean(errores.cliente)}
              />
              {errores.cliente && <span className="md-error-campo">{errores.cliente}</span>}
            </div>

            <div className="md-campo">
              <label htmlFor="ct-ing">Ing. solicitante</label>
              <input
                id="ct-ing"
                value={datos.ingSolicitante}
                onChange={(e) => cambiar('ingSolicitante', e.target.value)}
              />
            </div>

            <div className="md-campo">
              <label htmlFor="ct-responsable">Responsable</label>
              <select
                id="ct-responsable"
                value={datos.responsableId}
                onChange={(e) => cambiar('responsableId', e.target.value)}
              >
                <option value="">Sin responsable</option>
                {responsables.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="md-campo">
              <label htmlFor="ct-factura">Número de factura</label>
              <input
                id="ct-factura"
                value={datos.numeroFactura}
                onChange={(e) => cambiar('numeroFactura', e.target.value)}
                placeholder="Ej.: FV-001-933"
              />
              <span className="md-ayuda">
                Opcional. Al llenarlo, la cotización queda como <strong>facturada</strong>.
              </span>
            </div>
          </div>

          <div className="md-campo">
            <label htmlFor="ct-notas">Notas</label>
            <textarea
              id="ct-notas"
              className="ct-textarea"
              rows="3"
              value={datos.notas}
              onChange={(e) => cambiar('notas', e.target.value)}
              placeholder="Ej.: Cliente pidió entrega antes del 15"
            />
          </div>
        </fieldset>

        <fieldset className="ct-panel" disabled={enviando}>
          <legend>Materiales</legend>

          <div className="ct-items">
            <div className="ct-items__cabecera" aria-hidden="true">
              <span>Descripción *</span>
              <span>Cantidad *</span>
              <span>Valor unitario *</span>
              <span>Valor bruto</span>
              <span />
            </div>

            {datos.items.length === 0 && (
              <p className="ct-items__vacio">
                Sin materiales. Una cotización sin materiales también es válida.
              </p>
            )}

            {datos.items.map((m, i) => (
              <div className="ct-item" key={m.clave}>
                <div className="md-campo">
                  <label className="ct-item__etiqueta" htmlFor={`${m.clave}-desc`}>
                    Descripción del material {i + 1}
                  </label>
                  <input
                    id={`${m.clave}-desc`}
                    value={m.descripcion}
                    onChange={(e) => cambiarMaterial(m.clave, 'descripcion', e.target.value)}
                    aria-invalid={Boolean(errorDe(m.clave, 'descripcion'))}
                  />
                  {errorDe(m.clave, 'descripcion') && (
                    <span className="md-error-campo">{errorDe(m.clave, 'descripcion')}</span>
                  )}
                </div>
                <div className="md-campo">
                  <label className="ct-item__etiqueta" htmlFor={`${m.clave}-cant`}>
                    Cantidad del material {i + 1}
                  </label>
                  <input
                    id={`${m.clave}-cant`}
                    inputMode="decimal"
                    className="ct-num"
                    value={m.cantidad}
                    onChange={(e) => cambiarMaterial(m.clave, 'cantidad', e.target.value)}
                    aria-invalid={Boolean(errorDe(m.clave, 'cantidad'))}
                  />
                  {errorDe(m.clave, 'cantidad') && (
                    <span className="md-error-campo">{errorDe(m.clave, 'cantidad')}</span>
                  )}
                </div>
                <div className="md-campo">
                  <label className="ct-item__etiqueta" htmlFor={`${m.clave}-vu`}>
                    Valor unitario del material {i + 1}
                  </label>
                  <input
                    id={`${m.clave}-vu`}
                    inputMode="decimal"
                    className="ct-num"
                    value={m.valorUnitario}
                    onChange={(e) => cambiarMaterial(m.clave, 'valorUnitario', e.target.value)}
                    aria-invalid={Boolean(errorDe(m.clave, 'valorUnitario'))}
                  />
                  {errorDe(m.clave, 'valorUnitario') && (
                    <span className="md-error-campo">{errorDe(m.clave, 'valorUnitario')}</span>
                  )}
                </div>
                <div className="ct-item__bruto">
                  <span className="ct-item__etiqueta">Valor bruto</span>
                  {calculos.brutos[m.clave] !== null
                    ? formatearMoneda(calculos.brutos[m.clave])
                    : '—'}
                </div>
                <button
                  type="button"
                  className="ct-quitar"
                  onClick={() => quitarMaterial(m.clave)}
                  aria-label={`Quitar material ${i + 1}`}
                  title="Quitar material"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="pl-btn pl-btn--outline" onClick={agregarMaterial}>
            + Agregar material
          </button>
          <p className="md-ayuda ct-ayuda-numeros">
            Valores en pesos. Puedes escribirlos con o sin puntos de miles (16.600 o 16600) y usar
            coma para decimales.
          </p>
        </fieldset>

        <fieldset className="ct-panel" disabled={enviando}>
          <legend>Totales</legend>
          <div className="ct-totales ct-totales--form">
            <div>
              <span>Subtotal (suma de valores brutos)</span>
              <strong>{formatearMoneda(calculos.subtotal)}</strong>
            </div>
            <div className="ct-iva">
              <label htmlFor="ct-iva">
                IVA {datos.ivaManual === null ? '(19 % automático)' : '(valor manual)'}
              </label>
              <div className="ct-iva__control">
                <input
                  id="ct-iva"
                  inputMode="decimal"
                  className="ct-num"
                  value={datos.ivaManual ?? aTexto(calculos.iva)}
                  onChange={(e) => cambiar('ivaManual', e.target.value)}
                  aria-invalid={Boolean(errores.iva)}
                />
                {datos.ivaManual !== null && (
                  <button
                    type="button"
                    className="ct-limpiar"
                    onClick={() => cambiar('ivaManual', null)}
                  >
                    Usar 19 %
                  </button>
                )}
              </div>
              {errores.iva && <span className="md-error-campo">{errores.iva}</span>}
            </div>
            <div className="ct-totales__total">
              <span>Total</span>
              <strong>{calculos.total !== null ? formatearMoneda(calculos.total) : '—'}</strong>
            </div>
          </div>
        </fieldset>

        {errorServidor && (
          <div className="md-error" role="alert" ref={errorRef}>
            {errorServidor}
          </div>
        )}

        <div className="md-acciones ct-acciones-form">
          <button
            type="button"
            className="pl-btn pl-btn--outline"
            onClick={() => navigate(destinoCancelar)}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="pl-btn"
            disabled={enviando || bloqueadoPorExistente}
            title={bloqueadoPorExistente ? 'Esta cotización ya está registrada' : undefined}
          >
            {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar cotización'}
          </button>
        </div>
      </form>
    </section>
  );
}
