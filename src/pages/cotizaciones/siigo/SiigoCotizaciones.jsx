import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { PERMISOS, tienePermiso } from '../../../config/modulos';
import { siigoService } from '../../../services/siigoService';
import PestanasCotizaciones from '../PestanasCotizaciones';
import ClienteFormModal from '../clientes/ClienteFormModal';
import EstadoSincronizacion from './EstadoSincronizacion';
import SiigoDetalleModal from './SiigoDetalleModal';
import { EtiquetaEstadoSiigo, SelectorEstadoSiigo } from './EstadoSiigo';
import {
  ESTADOS_SIIGO,
  formatearFecha,
  formatearNumero,
  formatearPesos,
  oGuion,
  resumenSincronizacion,
} from './siigoUtils';

const TAMANO_PAGINA = 25;
const ESPERA_BUSQUEDA_MS = 400;
const FILTROS_INICIALES = {
  texto: '',
  estado: '',
  responsableId: '',
  desde: '',
  hasta: '',
  pagina: 0,
};

/**
 * Control de cotizaciones de Siigo (requiere siigo:explorar).
 * Los datos de Siigo son de solo lectura; el control de SIEV (estado, responsable, OC,
 * factura y pago) se edita con siigo:editar. Cada acción se muestra solo con su permiso.
 */
export default function SiigoCotizaciones({ base }) {
  const { usuario } = useAuth();
  const puedeEditar = tienePermiso(usuario, PERMISOS.SIIGO_EDITAR);
  const puedeClientes = tienePermiso(usuario, PERMISOS.CLIENTES_GESTIONAR);

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [responsables, setResponsables] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [nitNuevoCliente, setNitNuevoCliente] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo, texto } de acciones en la tabla

  const [estado, setEstado] = useState(null);
  const [errorEstado, setErrorEstado] = useState('');
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const peticionActual = useRef(0);

  /** Cambia filtros; cualquier filtro nuevo vuelve a la primera página. */
  const cambiarFiltros = useCallback((cambios) => {
    setFiltros((prev) => ({ ...prev, pagina: 0, ...cambios }));
  }, []);

  // Búsqueda con espera: se consulta al dejar de escribir ~400 ms
  useEffect(() => {
    if (textoBusqueda.trim() === filtros.texto) return undefined;
    const timer = setTimeout(
      () => cambiarFiltros({ texto: textoBusqueda.trim() }),
      ESPERA_BUSQUEDA_MS,
    );
    return () => clearTimeout(timer);
  }, [textoBusqueda, filtros.texto, cambiarFiltros]);

  const cargarLista = useCallback(async () => {
    const id = ++peticionActual.current;
    setCargando(true);
    setError('');
    try {
      const respuesta = await siigoService.listar({ ...filtros, tamano: TAMANO_PAGINA });
      // Si los filtros cambiaron mientras tanto, se ignora la respuesta vieja
      if (id === peticionActual.current) setDatos(respuesta);
    } catch (err) {
      if (id === peticionActual.current) setError(err.message);
    } finally {
      if (id === peticionActual.current) setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  const cargarEstado = useCallback(async () => {
    try {
      setEstado(await siigoService.estado());
      setErrorEstado('');
    } catch (err) {
      setErrorEstado(err.message);
    }
  }, []);

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  useEffect(() => {
    siigoService
      .responsables()
      .then((lista) => setResponsables(Array.isArray(lista) ? lista : []))
      .catch(() => setResponsables([]));
  }, []);

  const sincronizar = async () => {
    setSincronizando(true);
    setMensaje(null);
    try {
      // Responde el resultado directamente (mismo formato que `ultima`).
      // Si falla no devuelve exitosa: false, sino un error HTTP (409, 502 o 503).
      const resultado = await siigoService.sincronizar();
      setMensaje({ tipo: 'exito', texto: resumenSincronizacion(resultado) });
      cargarLista();
    } catch (err) {
      // 409: ya hay una en curso. 502/503: Siigo falló o no está configurado.
      // Se muestra el mensaje del backend tal como llega.
      const texto =
        err.estado === 409 ? err.message || 'Ya hay una sincronización en curso' : err.message;
      setMensaje({ tipo: 'error', texto });
    } finally {
      setSincronizando(false);
      cargarEstado();
    }
  };

  /**
   * Reemplaza una fila con la cotización que devolvió el backend. Se reemplaza completa
   * (no se combina) porque el backend omite los campos vacíos: un campo borrado no debe
   * quedar con su valor viejo.
   */
  const actualizarFila = (actualizada) => {
    if (!actualizada?.id) return;
    setDatos((prev) =>
      prev
        ? {
            ...prev,
            contenido: prev.contenido.map((c) =>
              c.id === actualizada.id ? { ...actualizada, items: undefined } : c,
            ),
          }
        : prev,
    );
  };

  const filas = datos?.contenido || [];
  const totalPaginas = datos?.totalPaginas || 0;
  const totalElementos = datos?.totalElementos || 0;
  const hayFiltros = Boolean(
    filtros.texto || filtros.estado || filtros.responsableId || filtros.desde || filtros.hasta,
  );

  const limpiarFiltros = () => {
    setTextoBusqueda('');
    setFiltros(FILTROS_INICIALES);
  };

  const abrir = (id) => setSeleccion(id);

  return (
    <section className="us ct">
      <Link to="/modulos" className="pl-volver">
        ← Volver al inicio
      </Link>
      <PestanasCotizaciones base={base} />

      <div className="us-encabezado">
        <div>
          <h1>Control de cotizaciones</h1>
          <p>
            Cotizaciones de Siigo (copia que se actualiza a las 6:00 a. m. y a la 1:00 p. m.) con el
            seguimiento de SIEV.
          </p>
        </div>
      </div>

      <EstadoSincronizacion
        estado={estado}
        errorEstado={errorEstado}
        sincronizando={sincronizando}
        mensaje={mensaje}
        onSincronizar={sincronizar}
        onCerrarMensaje={() => setMensaje(null)}
      />

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

      <div className="ct-filtros">
        <input
          type="search"
          className="ct-filtro ct-filtro--texto"
          placeholder="Buscar por número, NIT, empresa, descripción, ingeniero, OC o factura…"
          value={textoBusqueda}
          onChange={(e) => setTextoBusqueda(e.target.value)}
          aria-label="Buscar cotizaciones de Siigo"
        />
        <select
          className="ct-filtro"
          value={filtros.estado}
          onChange={(e) => cambiarFiltros({ estado: e.target.value })}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_SIIGO.map((e) => (
            <option key={e.valor} value={e.valor}>
              {e.etiqueta}
            </option>
          ))}
        </select>
        <select
          className="ct-filtro"
          value={filtros.responsableId}
          onChange={(e) => cambiarFiltros({ responsableId: e.target.value })}
          aria-label="Filtrar por responsable"
        >
          <option value="">Todos los responsables</option>
          {responsables.map((r) => (
            <option key={r.id} value={String(r.id)}>
              {r.nombre}
            </option>
          ))}
        </select>
        <label className="ct-filtro-fecha">
          Desde
          <input
            type="date"
            className="ct-filtro"
            value={filtros.desde}
            max={filtros.hasta || undefined}
            onChange={(e) => cambiarFiltros({ desde: e.target.value })}
          />
        </label>
        <label className="ct-filtro-fecha">
          Hasta
          <input
            type="date"
            className="ct-filtro"
            value={filtros.hasta}
            min={filtros.desde || undefined}
            onChange={(e) => cambiarFiltros({ hasta: e.target.value })}
          />
        </label>
        {hayFiltros && (
          <button type="button" className="ct-limpiar" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        )}
      </div>

      <p className="ct-siigo-nota">
        Los datos de Siigo se modifican en Siigo y se sincronizan. Aquí se edita solo el control de
        SIEV.
      </p>

      {cargando && !datos ? (
        <div className="us-tabla-contenedor">
          <div className="us-estado" role="status">
            Cargando cotizaciones de Siigo…
          </div>
        </div>
      ) : error ? (
        <div className="us-tabla-contenedor">
          <div className="us-estado us-estado--error" role="alert">
            <p>No se pudo cargar la lista: {error}</p>
            <button type="button" className="pl-btn pl-btn--outline" onClick={cargarLista}>
              Reintentar
            </button>
          </div>
        </div>
      ) : filas.length === 0 ? (
        <div className="us-tabla-contenedor">
          <div className="us-estado">
            {hayFiltros
              ? 'Ninguna cotización coincide con los filtros.'
              : 'Todavía no hay cotizaciones copiadas de Siigo.'}
          </div>
        </div>
      ) : (
        <div className="ct-siigo-scroll" tabIndex={0} aria-label="Tabla de cotizaciones de Siigo">
          <table className={`ct-siigo-tabla ${cargando ? 'ct-tabla--cargando' : ''}`}>
            <thead>
              <tr>
                <th className="ct-fija ct-fija--1">Fecha</th>
                <th className="ct-fija ct-fija--2">N° cotización</th>
                <th>Descripción</th>
                <th>Empresa</th>
                <th>Ingeniero solicitante</th>
                <th className="ct-num">Subtotal</th>
                <th className="ct-num">IVA</th>
                <th className="ct-num">Valor cotización</th>
                <th>OC</th>
                <th className="ct-num">Valor OC</th>
                <th>Factura</th>
                <th>Fecha factura</th>
                <th>Fecha pago</th>
                <th>Comprobante pago</th>
                <th className="ct-num">Valor pagado</th>
                <th>Estado</th>
                <th>Responsable SIEV</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((c) => (
                <tr
                  key={c.id}
                  className={`ct-fila ${c.eliminadaEnSiigo ? 'ct-fila--eliminada' : ''}`}
                  tabIndex={0}
                  onClick={() => abrir(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target === e.currentTarget) abrir(c.id);
                  }}
                  aria-label={`Ver cotización ${c.numero}`}
                >
                  <td className="ct-fija ct-fija--1">{formatearFecha(c.fecha)}</td>
                  <td className="ct-fija ct-fija--2">
                    <strong>{c.numero}</strong>
                    {c.eliminadaEnSiigo && <span className="ct-siigo-eliminada">Eliminada</span>}
                  </td>
                  <td>
                    <span className="ct-recorte" title={c.descripcion || undefined}>
                      {oGuion(c.descripcion)}
                    </span>
                  </td>
                  <td>
                    {c.empresa ? (
                      <span className="ct-recorte" title={`${c.empresa} · NIT ${c.clienteNit}`}>
                        {c.empresa}
                      </span>
                    ) : (
                      <span className="ct-sin-empresa">
                        NIT {oGuion(c.clienteNit)}
                        {puedeClientes && c.clienteNit && (
                          <button
                            type="button"
                            className="ct-limpiar"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNitNuevoCliente(c.clienteNit);
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            Crear cliente
                          </button>
                        )}
                      </span>
                    )}
                  </td>
                  <td>{oGuion(c.ingenieroSolicitante)}</td>
                  <td className="ct-num">{formatearPesos(c.subtotal)}</td>
                  <td className="ct-num">{formatearPesos(c.iva)}</td>
                  <td className="ct-num">
                    <strong>{formatearPesos(c.total)}</strong>
                  </td>
                  <td>{oGuion(c.ordenCompra)}</td>
                  <td className="ct-num">{formatearPesos(c.valorOc)}</td>
                  <td>{oGuion(c.numeroFactura)}</td>
                  <td>{formatearFecha(c.fechaFactura)}</td>
                  <td>{formatearFecha(c.fechaPago)}</td>
                  <td>{oGuion(c.comprobantePago)}</td>
                  <td className="ct-num">{formatearPesos(c.valorPagado)}</td>
                  <td>
                    {puedeEditar ? (
                      <SelectorEstadoSiigo
                        cotizacion={c}
                        onCambiado={(actualizada) => {
                          actualizarFila(actualizada);
                          setAviso({
                            tipo: 'exito',
                            texto: `Estado de ${c.numero} actualizado.`,
                          });
                        }}
                        onError={(texto) => setAviso({ tipo: 'error', texto })}
                      />
                    ) : (
                      <EtiquetaEstadoSiigo estado={c.estado} />
                    )}
                  </td>
                  <td>{oGuion(c.responsable?.nombre)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 0 && !error && (
        <nav className="ct-paginacion" aria-label="Paginación">
          <button
            type="button"
            className="pl-btn pl-btn--outline"
            disabled={filtros.pagina <= 0 || cargando}
            onClick={() => setFiltros((prev) => ({ ...prev, pagina: prev.pagina - 1 }))}
          >
            ← Anterior
          </button>
          <span>
            Página {filtros.pagina + 1} de {formatearNumero(totalPaginas)} ·{' '}
            {formatearNumero(totalElementos)} {totalElementos === 1 ? 'cotización' : 'cotizaciones'}
          </span>
          <button
            type="button"
            className="pl-btn pl-btn--outline"
            disabled={filtros.pagina + 1 >= totalPaginas || cargando}
            onClick={() => setFiltros((prev) => ({ ...prev, pagina: prev.pagina + 1 }))}
          >
            Siguiente →
          </button>
        </nav>
      )}

      {seleccion !== null && (
        <SiigoDetalleModal
          id={seleccion}
          responsables={responsables}
          puedeEditar={puedeEditar}
          onActualizada={actualizarFila}
          onClose={() => setSeleccion(null)}
        />
      )}

      {nitNuevoCliente !== null && (
        <ClienteFormModal
          nitInicial={nitNuevoCliente}
          onCancelar={() => setNitNuevoCliente(null)}
          onGuardado={(texto) => {
            setNitNuevoCliente(null);
            setAviso({ tipo: 'exito', texto });
            // La empresa nueva aparece al recargar la lista
            cargarLista();
          }}
        />
      )}
    </section>
  );
}
