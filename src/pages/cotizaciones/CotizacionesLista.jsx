import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERMISOS, tienePermiso } from '../../config/modulos';
import { cotizacionesService } from '../../services/cotizacionesService';
import SubirPdfModal from './SubirPdfModal';
import PestanasCotizaciones from './PestanasCotizaciones';
import EstadoCotizacion from './EstadoCotizacion';
import { LISTA_ESTADOS, formatearFecha, formatearMoneda } from './cotizacionesUtils';

const TAMANO_PAGINA = 20;
const ESPERA_BUSQUEDA_MS = 400;

/**
 * Lista paginada de cotizaciones con filtros. Los filtros viven en la URL
 * (?texto=&estado=&responsableId=&facturada=&pagina=) para que se conserven al
 * volver desde el detalle.
 */
export default function CotizacionesLista({ base }) {
  const { usuario } = useAuth();
  const puedeCrear = tienePermiso(usuario, PERMISOS.COTIZACIONES_CREAR);
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const filtros = {
    texto: params.get('texto') || '',
    estado: params.get('estado') || '',
    responsableId: params.get('responsableId') || '',
    facturada: params.get('facturada') || '',
    pagina: Math.max(0, Number(params.get('pagina')) || 0),
  };

  const [textoBusqueda, setTextoBusqueda] = useState(filtros.texto);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [responsables, setResponsables] = useState([]);
  const [mostrarPdf, setMostrarPdf] = useState(false);
  const [aviso, setAviso] = useState(location.state?.aviso || '');
  const peticionActual = useRef(0);

  // El aviso que llega al volver (p. ej. "Cotización eliminada") se muestra una sola vez
  useEffect(() => {
    if (location.state?.aviso) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location, navigate]);

  /** Cambia uno o más filtros en la URL. Cualquier filtro nuevo vuelve a la página 1. */
  const cambiarFiltros = useCallback(
    (cambios) => {
      setParams(
        (prev) => {
          const siguiente = new URLSearchParams(prev);
          Object.entries(cambios).forEach(([clave, valor]) => {
            if (valor === '' || valor === null || valor === undefined) siguiente.delete(clave);
            else siguiente.set(clave, valor);
          });
          if (!('pagina' in cambios)) siguiente.delete('pagina');
          return siguiente;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // Búsqueda de texto con espera: se consulta al dejar de escribir ~400 ms
  useEffect(() => {
    if (textoBusqueda.trim() === filtros.texto) return undefined;
    const timer = setTimeout(
      () => cambiarFiltros({ texto: textoBusqueda.trim() }),
      ESPERA_BUSQUEDA_MS,
    );
    return () => clearTimeout(timer);
  }, [textoBusqueda, filtros.texto, cambiarFiltros]);

  const claveFiltros = params.toString();

  const cargar = useCallback(async () => {
    const id = ++peticionActual.current;
    setCargando(true);
    setError('');
    try {
      const respuesta = await cotizacionesService.listar({
        texto: filtros.texto,
        estado: filtros.estado,
        responsableId: filtros.responsableId,
        facturada: filtros.facturada,
        pagina: filtros.pagina,
        tamano: TAMANO_PAGINA,
      });
      // Si el usuario cambió los filtros mientras tanto, se ignora la respuesta vieja
      if (id === peticionActual.current) setDatos(respuesta);
    } catch (err) {
      if (id === peticionActual.current) setError(err.message);
    } finally {
      if (id === peticionActual.current) setCargando(false);
    }
    // claveFiltros resume todos los filtros de la URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveFiltros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    cotizacionesService
      .responsables()
      .then((lista) => setResponsables(Array.isArray(lista) ? lista : []))
      .catch(() => setResponsables([]));
  }, []);

  const filas = datos?.contenido || [];
  const totalPaginas = datos?.totalPaginas || 0;
  const totalElementos = datos?.totalElementos || 0;
  const hayFiltros = Boolean(
    filtros.texto || filtros.estado || filtros.responsableId || filtros.facturada,
  );

  const abrirDetalle = (id) => navigate(`${base}/${id}`);

  const limpiarFiltros = () => {
    setTextoBusqueda('');
    setParams({}, { replace: true });
  };

  return (
    <section className="us ct">
      <Link to="/modulos" className="pl-volver">
        ← Volver al inicio
      </Link>
      <PestanasCotizaciones base={base} />

      <div className="us-encabezado">
        <div>
          <h1>Cotizaciones</h1>
          <p>Registro de las cotizaciones enviadas a los clientes.</p>
        </div>
        {puedeCrear && (
          <div className="ct-botones">
            <button
              type="button"
              className="pl-btn pl-btn--outline"
              onClick={() => setMostrarPdf(true)}
            >
              Subir PDF de Siigo
            </button>
            <button type="button" className="pl-btn" onClick={() => navigate(`${base}/nueva`)}>
              + Nueva cotización
            </button>
          </div>
        )}
      </div>

      {aviso && (
        <div className="us-aviso us-aviso--exito" role="status">
          <span>{aviso}</span>
          <button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso">
            ✕
          </button>
        </div>
      )}

      <div className="ct-filtros">
        <input
          type="search"
          className="ct-filtro ct-filtro--texto"
          placeholder="Buscar por número, cliente o ingeniero…"
          value={textoBusqueda}
          onChange={(e) => setTextoBusqueda(e.target.value)}
          aria-label="Buscar cotizaciones"
        />
        <select
          className="ct-filtro"
          value={filtros.estado}
          onChange={(e) => cambiarFiltros({ estado: e.target.value })}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {LISTA_ESTADOS.map((estado) => (
            <option key={estado.valor} value={estado.valor}>
              {estado.etiqueta}
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
        <select
          className="ct-filtro"
          value={filtros.facturada}
          onChange={(e) => cambiarFiltros({ facturada: e.target.value })}
          aria-label="Filtrar por facturación"
        >
          <option value="">Todas</option>
          <option value="true">Facturadas</option>
          <option value="false">No facturadas</option>
        </select>
        {hayFiltros && (
          <button type="button" className="ct-limpiar" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="us-tabla-contenedor">
        {cargando && !datos ? (
          <div className="us-estado" role="status">
            Cargando cotizaciones…
          </div>
        ) : error ? (
          <div className="us-estado us-estado--error" role="alert">
            <p>No se pudo cargar la lista: {error}</p>
            <button type="button" className="pl-btn pl-btn--outline" onClick={cargar}>
              Reintentar
            </button>
          </div>
        ) : filas.length === 0 ? (
          <div className="us-estado">
            {hayFiltros
              ? 'Ninguna cotización coincide con los filtros.'
              : 'Todavía no hay cotizaciones registradas.'}
          </div>
        ) : (
          <table className={`us-tabla ct-tabla ${cargando ? 'ct-tabla--cargando' : ''}`}>
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Ing. solicitante</th>
                <th>Responsable</th>
                <th className="ct-num">Total</th>
                <th>Estado</th>
                <th>Factura</th>
                <th>Creada</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((c) => (
                <tr
                  key={c.id}
                  className="ct-fila"
                  tabIndex={0}
                  onClick={() => abrirDetalle(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') abrirDetalle(c.id);
                  }}
                  aria-label={`Ver cotización ${c.numero}`}
                >
                  <td data-label="Número">
                    <strong>{c.numero}</strong>
                  </td>
                  <td data-label="Cliente">{c.cliente}</td>
                  <td data-label="Ing. solicitante">{c.ingSolicitante || '—'}</td>
                  <td data-label="Responsable">{c.responsable?.nombre || 'Sin responsable'}</td>
                  <td data-label="Total" className="ct-num">
                    {formatearMoneda(c.total)}
                  </td>
                  <td data-label="Estado">
                    <EstadoCotizacion estado={c.estado} />
                  </td>
                  <td data-label="Factura">
                    {c.facturada ? (
                      <span className="ct-factura">{c.numeroFactura}</span>
                    ) : (
                      <span className="ct-sin-factura">No facturada</span>
                    )}
                  </td>
                  <td data-label="Creada">{formatearFecha(c.creadoEn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPaginas > 0 && !error && (
        <nav className="ct-paginacion" aria-label="Paginación">
          <button
            type="button"
            className="pl-btn pl-btn--outline"
            disabled={filtros.pagina <= 0 || cargando}
            onClick={() => cambiarFiltros({ pagina: filtros.pagina - 1 || '' })}
          >
            ← Anterior
          </button>
          <span>
            Página {filtros.pagina + 1} de {totalPaginas} · {totalElementos}{' '}
            {totalElementos === 1 ? 'cotización' : 'cotizaciones'}
          </span>
          <button
            type="button"
            className="pl-btn pl-btn--outline"
            disabled={filtros.pagina + 1 >= totalPaginas || cargando}
            onClick={() => cambiarFiltros({ pagina: filtros.pagina + 1 })}
          >
            Siguiente →
          </button>
        </nav>
      )}

      {mostrarPdf && (
        <SubirPdfModal
          onCancelar={() => setMostrarPdf(false)}
          onLeido={(lectura, nombreArchivo) =>
            navigate(`${base}/nueva`, { state: { lecturaPdf: lectura, nombreArchivo } })
          }
        />
      )}
    </section>
  );
}
