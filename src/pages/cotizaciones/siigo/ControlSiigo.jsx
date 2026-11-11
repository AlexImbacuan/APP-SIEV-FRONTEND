import React, { useState } from 'react';
import { siigoService } from '../../../services/siigoService';
import { aNumero } from '../cotizacionesUtils';
import { EtiquetaEstadoSiigo } from './EstadoSiigo';
import {
  ESTADOS_SIIGO,
  formatearFecha,
  formatearFechaHora,
  formatearPesos,
  oGuion,
} from './siigoUtils';

const LIMITES = {
  descripcion: 500,
  ingenieroSolicitante: 150,
  ordenCompra: 50,
  numeroFactura: 50,
  comprobantePago: 100,
};

const texto = (valor) => (valor === null || valor === undefined ? '' : String(valor));

const formatoValor = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

/** 1925242 → "1.925.242" (aNumero lo vuelve a leer igual al guardar). */
const valorInicial = (valor) =>
  valor === null || valor === undefined || Number.isNaN(Number(valor))
    ? ''
    : formatoValor.format(Number(valor));

/** Valores iniciales del formulario a partir de la cotización (los campos vacíos no vienen). */
function datosIniciales(c) {
  return {
    descripcion: texto(c.descripcion),
    ingenieroSolicitante: texto(c.ingenieroSolicitante),
    responsableId: texto(c.responsable?.id),
    ordenCompra: texto(c.ordenCompra),
    valorOc: valorInicial(c.valorOc),
    numeroFactura: texto(c.numeroFactura),
    fechaFactura: texto(c.fechaFactura),
    fechaPago: texto(c.fechaPago),
    comprobantePago: texto(c.comprobantePago),
    valorPagado: valorInicial(c.valorPagado),
    estado: c.estado || 'POR_APROBAR',
  };
}

/**
 * Descripción e ingeniero: vacío o igual a lo de Siigo se envía como null, para que el
 * backend siga tomando el valor de Siigo (y se actualice si cambia allá).
 */
function textoOSiigo(valor, valorSiigo) {
  const limpio = valor.trim();
  if (!limpio) return null;
  if (valorSiigo && limpio === String(valorSiigo).trim()) return null;
  return limpio;
}

const textoONull = (valor) => valor.trim() || null;

/** El PUT /control reemplaza TODO: se envía siempre el formulario completo. */
export function armarControl(datos, c) {
  return {
    descripcion: textoOSiigo(datos.descripcion, c.descripcionSiigo),
    ingenieroSolicitante: textoOSiigo(datos.ingenieroSolicitante, c.ingenieroSiigo),
    responsableId: datos.responsableId ? Number(datos.responsableId) : null,
    ordenCompra: textoONull(datos.ordenCompra),
    valorOc: aNumero(datos.valorOc),
    numeroFactura: textoONull(datos.numeroFactura),
    fechaFactura: datos.fechaFactura || null,
    fechaPago: datos.fechaPago || null,
    comprobantePago: textoONull(datos.comprobantePago),
    valorPagado: aNumero(datos.valorPagado),
  };
}

function validar(datos) {
  const errores = {};
  ['valorOc', 'valorPagado'].forEach((campo) => {
    if (!datos[campo].trim()) return;
    const numero = aNumero(datos[campo]);
    if (numero === null) errores[campo] = 'Escribe un valor válido.';
    else if (numero < 0) errores[campo] = 'El valor no puede ser negativo.';
  });
  Object.entries(LIMITES).forEach(([campo, max]) => {
    if (datos[campo].length > max) errores[campo] = `Máximo ${max} caracteres.`;
  });
  return errores;
}

/** "Saldo pendiente: $X" si lo pagado es menor que el total (solo informativo). */
function SaldoPendiente({ valorPagado, total }) {
  if (valorPagado === null || valorPagado === undefined || total === null || total === undefined) {
    return null;
  }
  if (valorPagado >= total) return null;
  return <p className="ct-saldo">Saldo pendiente: {formatearPesos(total - valorPagado)}</p>;
}

/** Control en solo lectura (sin siigo:editar). */
function ControlLectura({ c }) {
  const filas = [
    ['Estado', <EtiquetaEstadoSiigo key="estado" estado={c.estado} />],
    ['Responsable SIEV', oGuion(c.responsable?.nombre)],
    ['Descripción', oGuion(c.descripcion)],
    ['Ingeniero solicitante', oGuion(c.ingenieroSolicitante)],
    ['Orden de compra', oGuion(c.ordenCompra)],
    ['Valor OC', formatearPesos(c.valorOc)],
    ['Factura', oGuion(c.numeroFactura)],
    ['Fecha factura', formatearFecha(c.fechaFactura)],
    ['Fecha pago', formatearFecha(c.fechaPago)],
    ['Comprobante pago', oGuion(c.comprobantePago)],
    ['Valor pagado', formatearPesos(c.valorPagado)],
  ];
  return (
    <>
      <dl className="ct-datos">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt>{etiqueta}</dt>
            <dd className="ct-siigo-descripcion">{valor}</dd>
          </div>
        ))}
      </dl>
      <SaldoPendiente valorPagado={c.valorPagado} total={c.total} />
    </>
  );
}

/**
 * Sección "Control SIEV" del detalle.
 * Props:
 *  - cotizacion
 *  - responsables: [{ id, nombre }]
 *  - puedeEditar: siigo:editar
 *  - onGuardado(cotizacionActualizada)
 *  - onEnviando(bool): bloquea el cierre del modal mientras guarda
 *  - onEditando(): el usuario cambió algo (oculta el aviso de "guardado")
 */
export default function ControlSiigo({
  cotizacion: c,
  responsables,
  puedeEditar,
  onGuardado,
  onEnviando,
  onEditando,
}) {
  const [datos, setDatos] = useState(() => datosIniciales(c));
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!puedeEditar) return <ControlLectura c={c} />;

  const cambiar = (campo, valor) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
    setError('');
    onEditando?.();
  };

  const marcarEnviando = (valor) => {
    setEnviando(valor);
    onEnviando?.(valor);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    const nuevosErrores = validar(datos);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) return;

    marcarEnviando(true);
    setError('');
    try {
      let actualizada = await siigoService.editarControl(c.id, armarControl(datos, c));
      if (datos.estado !== c.estado) {
        actualizada = await siigoService.cambiarEstado(c.id, datos.estado);
      }
      onGuardado(actualizada);
    } catch (err) {
      setError(err.message);
    } finally {
      marcarEnviando(false);
    }
  };

  const campoTexto = (campo, etiqueta, { area = false, placeholder = '' } = {}) => {
    const Etiqueta = area ? 'textarea' : 'input';
    return (
      <Etiqueta
        id={`sg-${campo}`}
        className={area ? 'ct-textarea' : undefined}
        rows={area ? 2 : undefined}
        value={datos[campo]}
        onChange={(e) => cambiar(campo, e.target.value)}
        maxLength={LIMITES[campo]}
        disabled={enviando}
        placeholder={placeholder}
        aria-invalid={Boolean(errores[campo])}
        aria-label={etiqueta}
      />
    );
  };

  /** "Según Siigo: …" con botón para volver a usarlo. Solo si Siigo trae el dato. */
  const segunSiigo = (campo, valorSiigo) =>
    valorSiigo ? (
      <span className="md-ayuda ct-segun-siigo">
        Según Siigo: {valorSiigo}{' '}
        <button
          type="button"
          className="ct-limpiar"
          onClick={() => cambiar(campo, '')}
          disabled={enviando || !datos[campo]}
        >
          Usar el de Siigo
        </button>
      </span>
    ) : null;

  const errorCampo = (campo) =>
    errores[campo] && <span className="md-error-campo">{errores[campo]}</span>;

  return (
    <form className="md-form" onSubmit={guardar} noValidate>
      <div className="ct-grid">
        <div className="md-campo ct-campo-ancho">
          <label htmlFor="sg-descripcion">Descripción</label>
          {campoTexto('descripcion', 'Descripción', { area: true })}
          {segunSiigo('descripcion', c.descripcionSiigo)}
          {errorCampo('descripcion')}
        </div>
        <div className="md-campo">
          <label htmlFor="sg-ingenieroSolicitante">Ingeniero solicitante</label>
          {campoTexto('ingenieroSolicitante', 'Ingeniero solicitante')}
          {segunSiigo('ingenieroSolicitante', c.ingenieroSiigo)}
          {errorCampo('ingenieroSolicitante')}
        </div>
        <div className="md-campo">
          <label htmlFor="sg-responsableId">Responsable SIEV</label>
          <select
            id="sg-responsableId"
            value={datos.responsableId}
            onChange={(e) => cambiar('responsableId', e.target.value)}
            disabled={enviando}
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
          <label htmlFor="sg-estado">Estado</label>
          <select
            id="sg-estado"
            value={datos.estado}
            onChange={(e) => cambiar('estado', e.target.value)}
            disabled={enviando}
          >
            {ESTADOS_SIIGO.map((estado) => (
              <option key={estado.valor} value={estado.valor}>
                {estado.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div className="md-campo">
          <label htmlFor="sg-ordenCompra">Orden de compra (OC)</label>
          {campoTexto('ordenCompra', 'Orden de compra (OC)', { placeholder: 'Ej.: OC-4500123' })}
          {errorCampo('ordenCompra')}
        </div>
        <div className="md-campo">
          <label htmlFor="sg-valorOc">Valor OC</label>
          <input
            id="sg-valorOc"
            inputMode="decimal"
            value={datos.valorOc}
            onChange={(e) => cambiar('valorOc', e.target.value)}
            disabled={enviando}
            placeholder="Ej.: 10.650.500"
            aria-invalid={Boolean(errores.valorOc)}
          />
          {errorCampo('valorOc')}
        </div>
        <div className="md-campo">
          <label htmlFor="sg-numeroFactura">Factura</label>
          {campoTexto('numeroFactura', 'Factura', { placeholder: 'Ej.: FV-1020' })}
          {errorCampo('numeroFactura')}
        </div>
        <div className="md-campo">
          <label htmlFor="sg-fechaFactura">Fecha factura</label>
          <input
            id="sg-fechaFactura"
            type="date"
            value={datos.fechaFactura}
            onChange={(e) => cambiar('fechaFactura', e.target.value)}
            disabled={enviando}
          />
        </div>
        <div className="md-campo">
          <label htmlFor="sg-fechaPago">Fecha pago</label>
          <input
            id="sg-fechaPago"
            type="date"
            value={datos.fechaPago}
            onChange={(e) => cambiar('fechaPago', e.target.value)}
            disabled={enviando}
          />
        </div>
        <div className="md-campo">
          <label htmlFor="sg-comprobantePago">Comprobante pago</label>
          {campoTexto('comprobantePago', 'Comprobante pago', { placeholder: 'Ej.: RC-555' })}
          {errorCampo('comprobantePago')}
        </div>
        <div className="md-campo">
          <label htmlFor="sg-valorPagado">Valor pagado</label>
          <input
            id="sg-valorPagado"
            inputMode="decimal"
            value={datos.valorPagado}
            onChange={(e) => cambiar('valorPagado', e.target.value)}
            disabled={enviando}
            aria-invalid={Boolean(errores.valorPagado)}
          />
          {errorCampo('valorPagado')}
        </div>
      </div>

      {datos.valorPagado.trim() && (
        <SaldoPendiente valorPagado={aNumero(datos.valorPagado)} total={c.total} />
      )}

      {error && (
        <div className="md-error" role="alert">
          No se pudo guardar: {error}
        </div>
      )}

      <div className="md-acciones">
        <button type="submit" className="pl-btn" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

/** Pie: quién editó el control por última vez. */
export function UltimaEdicion({ cotizacion: c }) {
  if (!c.controlActualizadoEn) {
    return <p className="ct-siigo-nota">Sin ediciones del control todavía.</p>;
  }
  return (
    <p className="ct-siigo-nota">
      Última edición: {oGuion(c.controlActualizadoPor)} el{' '}
      {formatearFechaHora(c.controlActualizadoEn)}
    </p>
  );
}
