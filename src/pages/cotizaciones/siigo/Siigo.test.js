import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../../App';
import { AuthProvider } from '../../../context/AuthContext';
import { formatearFecha, resumenSincronizacion } from './siigoUtils';

// ---------- Utilidades de prueba (mismo estilo que Cotizaciones.test.js) ----------
function renderApp(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function respuesta(estado, cuerpo) {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(cuerpo),
    text: () => Promise.resolve(JSON.stringify(cuerpo)),
  };
}

/** rutas: [método, pathname exacto, handler(opciones, url) → [estado, cuerpo]] (gana la primera) */
function mockBackend(rutas) {
  global.fetch = jest.fn((url, opciones = {}) => {
    const metodo = opciones.method || 'GET';
    const { pathname } = new URL(url);
    const ruta = rutas.find(([m, path]) => m === metodo && path === pathname);
    if (!ruta) return Promise.resolve(respuesta(404, { mensaje: `Sin mock: ${metodo} ${url}` }));
    const [estado, cuerpo] = ruta[2](opciones, url);
    return Promise.resolve(respuesta(estado, cuerpo));
  });
}

const llamadas = (metodo, path) =>
  global.fetch.mock.calls.filter(
    ([url, op = {}]) => (op.method || 'GET') === metodo && new URL(url).pathname === path,
  );

const cuerpo = ([, op]) => JSON.parse(op.body);

const SIIGO = '/api/siigo-cotizaciones';

// Los campos vacíos NO vienen en el JSON (en vez de null)
const FILA = {
  id: 15,
  siigoId: 'e8786010-c29d-40ce-ba81-873cb932079c',
  numero: 'C-1-2856',
  consecutivo: 2856,
  fecha: '2026-11-10',
  clienteNit: '800197463',
  empresa: 'Cargill de Colombia',
  descripcion: 'Suministro de personal para reparación de lámparas',
  descripcionSiigo: 'Suministro de personal para reparación de lámparas',
  ingenieroSolicitante: 'Juan Carlos Soler',
  subtotal: 8950000,
  iva: 1700500,
  total: 10650500,
  cantidadItems: 2,
  estado: 'POR_APROBAR',
  responsable: { id: 3, nombre: 'Carlos Pérez' },
  ordenCompra: 'OC-4500123',
  valorOc: 10650500,
  valorPagado: 5000000,
  urlPublica: 'https://publicview.siigo.com/#quotation/abc',
  eliminadaEnSiigo: false,
  sincronizadoEn: '2026-11-10T13:00:04',
  controlActualizadoEn: '2026-11-10T15:10:00',
  controlActualizadoPor: 'admin@siev.com',
};

// Sin cliente en el catálogo: no trae "empresa"
const FILA_SIN_EMPRESA = {
  id: 16,
  numero: 'C-1-2855',
  fecha: '2026-11-09',
  clienteNit: '900887302',
  total: 1500000,
  estado: 'PAGADA',
  eliminadaEnSiigo: false,
};

const ITEM = {
  id: 'producto-1',
  code: '24011',
  quantity: 9,
  price: 250000,
  description: 'Suministro de técnico\nIncluye transporte',
  discount: { percentage: 3, value: 606000 },
  taxes: [{ id: 22021, name: 'IVA 19%', type: 'IVA', percentage: 19, value: 427500 }],
  total: 2677500,
};

// El id del producto se repite: la tabla no debe fallar ni perder filas
const DETALLE = {
  ...FILA,
  items: [ITEM, { ...ITEM, code: '24012', description: 'Cable 4x12', discount: undefined }],
};

const RESULTADO = {
  origen: 'MANUAL',
  inicio: '2026-11-10T13:00:00',
  fin: '2026-11-10T13:00:15',
  exitosa: true,
  totalEnSiigo: 1607,
  nuevas: 1,
  actualizadas: 3,
  eliminadas: 0,
  segundos: 14.8,
};

const ESTADO = {
  configurado: true,
  enCurso: false,
  cotizacionesGuardadas: 1606,
  ultima: RESULTADO,
  ultimaExitosa: RESULTADO,
};

const PAGINA = {
  contenido: [FILA, FILA_SIN_EMPRESA],
  pagina: 0,
  tamano: 25,
  totalElementos: 1606,
  totalPaginas: 65,
};

function backend(permisos, extra = []) {
  localStorage.setItem('authToken', 't');
  localStorage.setItem('refreshToken', 'r');
  mockBackend([
    ...extra,
    [
      'GET',
      '/api/auth/me',
      () => [
        200,
        { id: 1, nombre: 'Ana', email: 'ana@siev.com', activo: true, rol: 'SUPERVISOR', permisos },
      ],
    ],
    ['GET', '/api/cotizaciones', () => [200, { ...PAGINA, contenido: [], totalElementos: 0 }]],
    ['GET', '/api/cotizaciones/responsables', () => [200, []]],
    ['GET', SIIGO, () => [200, PAGINA]],
    ['GET', `${SIIGO}/responsables`, () => [200, [{ id: 3, nombre: 'Carlos Pérez' }]]],
    ['GET', `${SIIGO}/15`, () => [200, DETALLE]],
    ['GET', `${SIIGO}/sincronizacion`, () => [200, ESTADO]],
    [
      'GET',
      '/api/clientes',
      () => [
        200,
        [
          {
            id: 1,
            nit: '800197463',
            nombre: 'Cargill de Colombia',
            activo: true,
            cotizaciones: 40,
          },
        ],
      ],
    ],
    [
      'GET',
      '/api/clientes/nits-sin-cliente',
      () => [200, [{ nit: '900887302', cotizaciones: 12 }]],
    ],
  ]);
}

const VER = ['cotizaciones:ver', 'siigo:explorar'];
const EDITAR = [...VER, 'siigo:editar'];
const TODO = [...EDITAR, 'clientes:gestionar'];

beforeEach(() => {
  localStorage.clear();
  delete global.fetch;
});

/** Abre la vista de Siigo y espera la tabla. */
async function abrirSiigo(permisos, extra) {
  backend(permisos, extra);
  renderApp('/modulos/cotizaciones/siigo');
  return (await screen.findByText('C-1-2856')).closest('tr');
}

// ---------- Formatos ----------
describe('siigoUtils', () => {
  test('una fecha sin hora no se corre al día anterior', () => {
    expect(formatearFecha('2026-11-10')).toBe('10/11/2026');
  });

  test('resume la sincronización en singular y plural', () => {
    expect(resumenSincronizacion({ nuevas: 1, actualizadas: 3, eliminadas: 0 })).toBe(
      'Sincronización completa: 1 nueva, 3 actualizadas y 0 eliminadas.',
    );
  });
});

// ---------- Permisos ----------
describe('permisos', () => {
  test('sin siigo:explorar no aparece la pestaña Siigo', async () => {
    backend(['cotizaciones:ver']);
    renderApp('/modulos/cotizaciones');

    expect(await screen.findByText('Todavía no hay cotizaciones registradas.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Siigo' })).not.toBeInTheDocument();
    expect(llamadas('GET', SIIGO)).toHaveLength(0);
  });

  test('sin siigo:explorar la ruta directa muestra "sin permiso" y no consulta Siigo', async () => {
    backend(['cotizaciones:ver']);
    renderApp('/modulos/cotizaciones/siigo');

    expect(await screen.findByText(/No tienes permiso/)).toBeInTheDocument();
    expect(llamadas('GET', SIIGO)).toHaveLength(0);
  });

  test('sin clientes:gestionar no aparece la pestaña Clientes', async () => {
    backend(EDITAR);
    renderApp('/modulos/cotizaciones');

    expect(await screen.findByRole('link', { name: 'Siigo' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Clientes' })).not.toBeInTheDocument();
  });

  test('con clientes:gestionar aparece la pestaña Clientes', async () => {
    backend(TODO);
    renderApp('/modulos/cotizaciones');

    fireEvent.click(await screen.findByRole('link', { name: 'Clientes' }));
    expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
  });

  test('sin siigo:editar no hay selector de estado ni formulario', async () => {
    const fila = await abrirSiigo(VER);

    expect(within(fila).getByText('Por aprobar')).toBeInTheDocument();
    expect(within(fila).queryByRole('button', { name: /Cambiar estado/ })).not.toBeInTheDocument();

    fireEvent.click(within(fila).getByText('C-1-2856'));
    const modal = await screen.findByRole('dialog');
    expect(await within(modal).findByText('Control SIEV')).toBeInTheDocument();
    expect(within(modal).queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument();
    expect(within(modal).getByText('OC-4500123')).toBeInTheDocument();
  });
});

// ---------- Tabla ----------
describe('tabla de control', () => {
  test('muestra empresa, o NIT + "Crear cliente" cuando falta', async () => {
    const fila = await abrirSiigo(TODO);

    expect(within(fila).getByText('Cargill de Colombia')).toBeInTheDocument();
    expect(within(fila).getByText('10/11/2026')).toBeInTheDocument();
    expect(within(fila).getByText(/10\.650\.500/, { selector: 'strong' })).toBeInTheDocument();
    expect(within(fila).getByText('OC-4500123')).toBeInTheDocument();
    expect(within(fila).getByText('Carlos Pérez')).toBeInTheDocument();
    // Los campos que no vienen se muestran con "—"
    expect(within(fila).getAllByText('—').length).toBeGreaterThan(0);

    const sinEmpresa = screen.getByText('C-1-2855').closest('tr');
    expect(within(sinEmpresa).getByText(/NIT 900887302/)).toBeInTheDocument();
    fireEvent.click(within(sinEmpresa).getByRole('button', { name: 'Crear cliente' }));

    // Abre el formulario de cliente con el NIT ya puesto (y no el detalle de la fila)
    const modal = await screen.findByRole('dialog', { name: 'Nuevo cliente' });
    expect(within(modal).getByLabelText('NIT')).toHaveValue('900887302');
  });

  test('sin clientes:gestionar no se ofrece "Crear cliente"', async () => {
    await abrirSiigo(EDITAR);
    const sinEmpresa = screen.getByText('C-1-2855').closest('tr');
    expect(within(sinEmpresa).getByText(/NIT 900887302/)).toBeInTheDocument();
    expect(within(sinEmpresa).queryByText('Crear cliente')).not.toBeInTheDocument();
  });

  test('los filtros de estado y búsqueda se envían al backend', async () => {
    await abrirSiigo(EDITAR);

    fireEvent.change(screen.getByLabelText('Filtrar por estado'), {
      target: { value: 'POR_FACTURAR' },
    });
    fireEvent.change(screen.getByLabelText('Buscar cotizaciones de Siigo'), {
      target: { value: 'Cargill' },
    });
    await waitFor(() =>
      expect(
        llamadas('GET', SIIGO).some(([url]) => {
          const p = new URL(url).searchParams;
          return p.get('estado') === 'POR_FACTURAR' && p.get('texto') === 'Cargill';
        }),
      ).toBe(true),
    );
  });

  test('cambiar el estado desde la tabla llama al PATCH', async () => {
    const fila = await abrirSiigo(EDITAR, [
      ['PATCH', `${SIIGO}/15/estado`, () => [200, { ...FILA, estado: 'POR_EJECUTAR' }]],
    ]);

    fireEvent.click(within(fila).getByRole('button', { name: /Cambiar estado de C-1-2856/ }));
    fireEvent.change(within(fila).getByLabelText('Nuevo estado de C-1-2856'), {
      target: { value: 'POR_EJECUTAR' },
    });

    await waitFor(() => expect(llamadas('PATCH', `${SIIGO}/15/estado`)).toHaveLength(1));
    expect(cuerpo(llamadas('PATCH', `${SIIGO}/15/estado`)[0])).toEqual({ estado: 'POR_EJECUTAR' });
    // La fila muestra el estado nuevo que devolvió el backend
    expect(
      await within(fila).findByRole('button', { name: /C-1-2856 \(Por ejecutar\)/ }),
    ).toBeInTheDocument();
    // No abre el detalle
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ---------- Detalle y control ----------
describe('detalle', () => {
  test('muestra los datos de Siigo, los ítems y el enlace', async () => {
    const fila = await abrirSiigo(EDITAR);
    fireEvent.click(within(fila).getByText('C-1-2856'));
    const modal = await screen.findByRole('dialog');

    expect(await within(modal).findByText('24011')).toBeInTheDocument();
    expect(within(modal).getByText('24012')).toBeInTheDocument();
    expect(within(modal).getByText(/3 %/)).toBeInTheDocument();
    expect(within(modal).getAllByText(/2\.677\.500/)).toHaveLength(2);
    expect(within(modal).getByRole('link', { name: /Ver en Siigo/ })).toHaveAttribute(
      'href',
      FILA.urlPublica,
    );
    // Sede y encabezado solo si vienen (aquí no vienen)
    expect(within(modal).queryByText('Sede')).not.toBeInTheDocument();
    expect(within(modal).queryByText('Encabezado original')).not.toBeInTheDocument();
    // Pagado 5.000.000 de 10.650.500
    expect(within(modal).getByText(/Saldo pendiente: \$\s?5\.650\.500/)).toBeInTheDocument();
    expect(within(modal).getByText(/Última edición: admin@siev\.com/)).toBeInTheDocument();
  });

  test('guardar envía el formulario completo, null si es igual a Siigo, y luego el estado', async () => {
    const fila = await abrirSiigo(EDITAR, [
      ['PUT', `${SIIGO}/15/control`, () => [200, { ...DETALLE, numeroFactura: 'FV-1020' }]],
      [
        'PATCH',
        `${SIIGO}/15/estado`,
        () => [200, { ...DETALLE, numeroFactura: 'FV-1020', estado: 'POR_FACTURAR' }],
      ],
    ]);
    fireEvent.click(within(fila).getByText('C-1-2856'));
    const modal = await screen.findByRole('dialog');
    await within(modal).findByText('24011');

    // "Según Siigo" solo aparece para la descripción (ingenieroSiigo no viene)
    expect(within(modal).getAllByText(/Según Siigo:/)).toHaveLength(1);

    fireEvent.change(within(modal).getByLabelText('Factura'), { target: { value: 'FV-1020' } });
    fireEvent.change(within(modal).getByLabelText('Valor OC'), { target: { value: '' } });
    fireEvent.change(within(modal).getByLabelText('Estado'), {
      target: { value: 'POR_FACTURAR' },
    });
    fireEvent.click(within(modal).getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(llamadas('PUT', `${SIIGO}/15/control`)).toHaveLength(1));
    expect(cuerpo(llamadas('PUT', `${SIIGO}/15/control`)[0])).toEqual({
      descripcion: null, // igual a descripcionSiigo → sigue tomándose de Siigo
      ingenieroSolicitante: 'Juan Carlos Soler',
      responsableId: 3,
      ordenCompra: 'OC-4500123',
      valorOc: null,
      numeroFactura: 'FV-1020',
      fechaFactura: null,
      fechaPago: null,
      comprobantePago: null,
      valorPagado: 5000000,
    });
    await waitFor(() => expect(llamadas('PATCH', `${SIIGO}/15/estado`)).toHaveLength(1));
    expect(cuerpo(llamadas('PATCH', `${SIIGO}/15/estado`)[0])).toEqual({ estado: 'POR_FACTURAR' });
    expect(await within(modal).findByText('Control guardado.')).toBeInTheDocument();
  });

  test('"Usar el de Siigo" vacía la descripción y se envía null', async () => {
    const fila = await abrirSiigo(EDITAR, [['PUT', `${SIIGO}/15/control`, () => [200, DETALLE]]]);
    fireEvent.click(within(fila).getByText('C-1-2856'));
    const modal = await screen.findByRole('dialog');
    await within(modal).findByText('24011');

    fireEvent.change(within(modal).getByLabelText('Descripción'), {
      target: { value: 'Reparación lámparas bodega 3' },
    });
    fireEvent.click(within(modal).getByRole('button', { name: 'Usar el de Siigo' }));
    expect(within(modal).getByLabelText('Descripción')).toHaveValue('');

    fireEvent.click(within(modal).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(llamadas('PUT', `${SIIGO}/15/control`)).toHaveLength(1));
    expect(cuerpo(llamadas('PUT', `${SIIGO}/15/control`)[0]).descripcion).toBeNull();
    // Sin cambio de estado no se llama al PATCH
    expect(llamadas('PATCH', `${SIIGO}/15/estado`)).toHaveLength(0);
  });
});

// ---------- Clientes ----------
describe('clientes', () => {
  test('lista los clientes y los NITs sin cliente', async () => {
    backend(TODO);
    renderApp('/modulos/cotizaciones/clientes');

    expect(await screen.findByText('Cargill de Colombia')).toBeInTheDocument();
    const nit = (await screen.findByText('900887302')).closest('tr');
    expect(within(nit).getByText('12')).toBeInTheDocument();
  });

  test('sin clientes:gestionar la ruta muestra "sin permiso"', async () => {
    backend(EDITAR);
    renderApp('/modulos/cotizaciones/clientes');
    expect(await screen.findByText(/No tienes permiso/)).toBeInTheDocument();
  });

  test('crear: 201 refresca la lista', async () => {
    backend(TODO, [
      ['POST', '/api/clientes', () => [201, { id: 2, nit: '900887302', nombre: 'Savicol' }]],
    ]);
    renderApp('/modulos/cotizaciones/clientes');
    const nit = (await screen.findByText('900887302')).closest('tr');
    const listasAntes = llamadas('GET', '/api/clientes').length;

    fireEvent.click(within(nit).getByRole('button', { name: /Crear cliente con NIT/ }));
    const modal = await screen.findByRole('dialog', { name: 'Nuevo cliente' });
    expect(within(modal).getByLabelText('NIT')).toHaveValue('900887302');
    fireEvent.change(within(modal).getByLabelText('Nombre de la empresa'), {
      target: { value: 'Savicol' },
    });
    fireEvent.click(within(modal).getByRole('button', { name: 'Crear cliente' }));

    await waitFor(() => expect(llamadas('POST', '/api/clientes')).toHaveLength(1));
    expect(cuerpo(llamadas('POST', '/api/clientes')[0])).toEqual({
      nit: '900887302',
      nombre: 'Savicol',
    });
    expect(await screen.findByText('Cliente Savicol creado.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(llamadas('GET', '/api/clientes').length).toBeGreaterThan(listasAntes);
  });

  test('crear: 409 muestra el mensaje del backend', async () => {
    backend(TODO, [
      [
        'POST',
        '/api/clientes',
        () => [
          409,
          { estado: 409, mensaje: 'El NIT 800197463 ya pertenece a Cargill de Colombia' },
        ],
      ],
    ]);
    renderApp('/modulos/cotizaciones/clientes');
    await screen.findByText('Cargill de Colombia');

    fireEvent.click(screen.getByRole('button', { name: '+ Nuevo cliente' }));
    const modal = await screen.findByRole('dialog', { name: 'Nuevo cliente' });
    fireEvent.change(within(modal).getByLabelText('NIT'), { target: { value: '800.197.463-1' } });
    fireEvent.change(within(modal).getByLabelText('Nombre de la empresa'), {
      target: { value: 'Otra' },
    });
    fireEvent.click(within(modal).getByRole('button', { name: 'Crear cliente' }));

    expect(
      await within(modal).findByText('El NIT 800197463 ya pertenece a Cargill de Colombia'),
    ).toBeInTheDocument();
  });
});

// ---------- Sincronizar ----------
describe('sincronizar ahora', () => {
  test('muestra la barra de estado', async () => {
    await abrirSiigo(VER);
    const barra = await screen.findByText(/Última sincronización:/);
    expect(barra).toHaveTextContent(/10\/11\/2026/);
    expect(barra).toHaveTextContent(/1\.606 cotizaciones/);
  });

  test('muestra el error si la última sincronización falló', async () => {
    await abrirSiigo(VER, [
      [
        'GET',
        `${SIIGO}/sincronizacion`,
        () => [
          200,
          { ...ESTADO, ultima: { ...RESULTADO, exitosa: false, error: 'Siigo no respondió' } },
        ],
      ],
    ]);
    expect(await screen.findByText(/Siigo no respondió/)).toBeInTheDocument();
  });

  test('muestra el resumen y recarga la lista', async () => {
    await abrirSiigo(VER, [['POST', `${SIIGO}/sincronizar`, () => [200, RESULTADO]]]);
    const listasAntes = llamadas('GET', SIIGO).length;

    fireEvent.click(await screen.findByRole('button', { name: 'Sincronizar ahora' }));

    expect(
      await screen.findByText('Sincronización completa: 1 nueva, 3 actualizadas y 0 eliminadas.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(llamadas('GET', SIIGO).length).toBeGreaterThan(listasAntes));
  });

  test('ante un 409 muestra que ya hay una sincronización en curso', async () => {
    await abrirSiigo(VER, [
      [
        'POST',
        `${SIIGO}/sincronizar`,
        () => [409, { estado: 409, mensaje: 'Ya hay una sincronización en curso' }],
      ],
    ]);
    fireEvent.click(await screen.findByRole('button', { name: 'Sincronizar ahora' }));
    expect(await screen.findByText('Ya hay una sincronización en curso')).toBeInTheDocument();
  });

  test('ante un 502 muestra el mensaje del backend tal como llega', async () => {
    await abrirSiigo(VER, [
      [
        'POST',
        `${SIIGO}/sincronizar`,
        () => [502, { estado: 502, mensaje: 'Siigo no respondió a tiempo' }],
      ],
    ]);
    fireEvent.click(await screen.findByRole('button', { name: 'Sincronizar ahora' }));
    expect(await screen.findByText('Siigo no respondió a tiempo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sincronizar ahora' })).toBeEnabled();
  });
});

// ---------- Supervisor: solo Siigo, sin el registro propio ----------
describe('supervisor (siigo:explorar y siigo:editar, sin cotizaciones:ver)', () => {
  const SUPERVISOR = ['siigo:explorar', 'siigo:editar'];

  test('al entrar al módulo termina en la vista de Siigo, sin pestañas ni botones del registro', async () => {
    backend(SUPERVISOR);
    renderApp('/modulos/cotizaciones');

    expect(await screen.findByText('C-1-2856')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Control de cotizaciones' })).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Vistas de cotizaciones' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Registro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Clientes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nueva cotización/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Subir PDF/ })).not.toBeInTheDocument();
    // Nunca consulta el módulo viejo (le respondería 403)
    expect(llamadas('GET', '/api/cotizaciones')).toHaveLength(0);
    expect(llamadas('GET', '/api/cotizaciones/responsables')).toHaveLength(0);
  });

  test('una ruta desconocida vuelve al índice y de ahí a Siigo', async () => {
    backend(SUPERVISOR);
    renderApp('/modulos/cotizaciones/algo/raro');
    expect(await screen.findByText('C-1-2856')).toBeInTheDocument();
  });

  test('puede cambiar el estado desde la tabla', async () => {
    const fila = await abrirSiigo(SUPERVISOR, [
      ['PATCH', `${SIIGO}/15/estado`, () => [200, { ...FILA, estado: 'POR_EJECUTAR' }]],
    ]);
    fireEvent.click(within(fila).getByRole('button', { name: /Cambiar estado de C-1-2856/ }));
    fireEvent.change(within(fila).getByLabelText('Nuevo estado de C-1-2856'), {
      target: { value: 'POR_EJECUTAR' },
    });
    await waitFor(() => expect(llamadas('PATCH', `${SIIGO}/15/estado`)).toHaveLength(1));
  });

  test('puede editar el control y no se le ofrece "Crear cliente"', async () => {
    const fila = await abrirSiigo(SUPERVISOR, [
      ['PUT', `${SIIGO}/15/control`, () => [200, { ...DETALLE, numeroFactura: 'FV-1020' }]],
    ]);
    expect(screen.queryByRole('button', { name: /Crear cliente/ })).not.toBeInTheDocument();

    fireEvent.click(within(fila).getByText('C-1-2856'));
    const modal = await screen.findByRole('dialog');
    await within(modal).findByText('24011');
    fireEvent.change(within(modal).getByLabelText('Factura'), { target: { value: 'FV-1020' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(llamadas('PUT', `${SIIGO}/15/control`)).toHaveLength(1));
    expect(cuerpo(llamadas('PUT', `${SIIGO}/15/control`)[0]).numeroFactura).toBe('FV-1020');
    expect(await within(modal).findByText('Control guardado.')).toBeInTheDocument();
  });

  test('con solo siigo:explorar ve la lista pero sin controles de edición', async () => {
    backend(['siigo:explorar']);
    renderApp('/modulos/cotizaciones');
    const fila = (await screen.findByText('C-1-2856')).closest('tr');

    expect(within(fila).getByText('Por aprobar')).toBeInTheDocument();
    expect(within(fila).queryByRole('button', { name: /Cambiar estado/ })).not.toBeInTheDocument();
    fireEvent.click(within(fila).getByText('C-1-2856'));
    const modal = await screen.findByRole('dialog');
    expect(await within(modal).findByText('Control SIEV')).toBeInTheDocument();
    expect(within(modal).queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument();
  });
});
