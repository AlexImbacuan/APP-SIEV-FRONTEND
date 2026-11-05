import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { AuthProvider } from '../../context/AuthContext';
import { aNumero, formatearMoneda } from './cotizacionesUtils';

// ---------- Utilidades de prueba ----------
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

/** rutas: [método, pathname exacto, handler(opciones, url) → [estado, cuerpo]] */
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

const TODOS = [
  'cotizaciones:ver',
  'cotizaciones:crear',
  'cotizaciones:editar',
  'cotizaciones:aprobar',
  'cotizaciones:eliminar',
];

function usuario(rol, permisos) {
  return { id: 1, nombre: 'Ana', email: 'ana@siev.com', activo: true, rol, permisos };
}

const FILA = {
  id: 12,
  numero: 'C-1-2562',
  cliente: 'POLLOS EL BUCANERO S.A',
  ingSolicitante: 'MAYRA QUIROGA',
  estado: 'PENDIENTE',
  responsable: { id: 3, nombre: 'Carlos Pérez' },
  total: 26180000,
  numeroFactura: null,
  facturada: false,
  creadoEn: '2026-11-04T10:15:00',
};

const DETALLE = {
  ...FILA,
  motivoRechazo: null,
  items: [
    {
      descripcion: 'Cable encauchetado 4x12',
      cantidad: 120,
      valorUnitario: 16600,
      valorBruto: 1992000,
    },
  ],
  subtotal: 1992000,
  iva: 378480,
  total: 2370480,
  notas: 'Entrega antes del 15',
  actualizadoEn: '2026-11-04T10:15:00',
  avisos: ['La suma de los materiales no coincide con el subtotal del PDF'],
};

const PAGINA = (contenido) => ({
  contenido,
  pagina: 0,
  tamano: 20,
  totalElementos: contenido.length,
  totalPaginas: contenido.length ? 1 : 0,
});

function backend(permisos, extra = []) {
  localStorage.setItem('authToken', 't');
  localStorage.setItem('refreshToken', 'r');
  mockBackend([
    ['GET', '/api/auth/me', () => [200, usuario('SUPERVISOR', permisos)]],
    ['GET', '/api/cotizaciones', () => [200, PAGINA([FILA])]],
    ['GET', '/api/cotizaciones/responsables', () => [200, [{ id: 3, nombre: 'Carlos Pérez' }]]],
    ['GET', '/api/cotizaciones/12', () => [200, DETALLE]],
    ...extra,
  ]);
}

beforeEach(() => {
  localStorage.clear();
  delete global.fetch;
});

// ---------- Utilidades de formato ----------
describe('cotizacionesUtils', () => {
  test('formatea pesos colombianos', () => {
    expect(formatearMoneda(26180000)).toMatch(/\$\s?26\.180\.000/);
  });

  test('interpreta números escritos en formato colombiano', () => {
    expect(aNumero('16.600')).toBe(16600);
    expect(aNumero('1.992.000')).toBe(1992000);
    expect(aNumero('16600,5')).toBe(16600.5);
    expect(aNumero('1,234')).toBe(1.234);
    expect(aNumero('')).toBeNull();
    expect(aNumero('abc')).toBeNull();
  });
});

// ---------- Lista y permisos ----------
describe('lista de cotizaciones', () => {
  test('muestra las filas con total, estado y factura', async () => {
    backend(TODOS);
    renderApp('/modulos/cotizaciones');

    const fila = (await screen.findByText('C-1-2562')).closest('tr');
    expect(within(fila).getByText('POLLOS EL BUCANERO S.A')).toBeInTheDocument();
    expect(within(fila).getByText(/26\.180\.000/)).toBeInTheDocument();
    expect(within(fila).getByText('Pendiente')).toBeInTheDocument();
    expect(within(fila).getByText('No facturada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nueva cotización/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subir pdf de siigo/i })).toBeInTheDocument();
  });

  test('un TÉCNICO (solo ver) no ve botones de crear, editar, estado ni eliminar', async () => {
    backend(['cotizaciones:ver']);
    renderApp('/modulos/cotizaciones');
    await screen.findByText('C-1-2562');
    expect(screen.queryByRole('button', { name: /nueva cotización/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subir pdf/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('C-1-2562'));
    expect(await screen.findByText('Cable encauchetado 4x12')).toBeInTheDocument();
    for (const nombre of [/editar/i, /eliminar/i, /^aprobar$/i, /no aprobar/i]) {
      expect(screen.queryByRole('button', { name: nombre })).not.toBeInTheDocument();
    }
  });

  test('sin cotizaciones:ver no puede entrar al módulo', async () => {
    backend(['proyectos:ver']);
    renderApp('/modulos/cotizaciones');
    expect(
      await screen.findByRole('heading', { name: /no tienes permiso para ver este módulo/i }),
    ).toBeInTheDocument();
  });

  test('los filtros se envían al servidor', async () => {
    backend(TODOS);
    renderApp('/modulos/cotizaciones');
    await screen.findByText('C-1-2562');

    fireEvent.change(screen.getByLabelText('Filtrar por facturación'), {
      target: { value: 'true' },
    });
    await waitFor(() =>
      expect(llamadas('GET', '/api/cotizaciones').at(-1)[0]).toContain('facturada=true'),
    );

    fireEvent.change(screen.getByLabelText('Buscar cotizaciones'), {
      target: { value: 'bucanero' },
    });
    await waitFor(() =>
      expect(llamadas('GET', '/api/cotizaciones').at(-1)[0]).toContain('texto=bucanero'),
    );
  });
});

// ---------- Detalle ----------
describe('detalle de la cotización', () => {
  test('muestra datos, avisos y totales', async () => {
    backend(TODOS);
    renderApp('/modulos/cotizaciones/12');

    expect(await screen.findByText('Cable encauchetado 4x12')).toBeInTheDocument();
    expect(screen.getByText(/no coincide con el subtotal/i)).toBeInTheDocument();
    expect(screen.getByText('Entrega antes del 15')).toBeInTheDocument();
    expect(screen.getAllByText(/2\.370\.480/).length).toBeGreaterThan(0);
  });

  test('"No aprobar" exige el motivo y lo envía', async () => {
    backend(TODOS, [
      [
        'PATCH',
        '/api/cotizaciones/12/estado',
        (op) => [
          200,
          { ...DETALLE, estado: 'NO_APROBADA', motivoRechazo: JSON.parse(op.body).motivoRechazo },
        ],
      ],
    ]);
    renderApp('/modulos/cotizaciones/12');
    await screen.findByText('Cable encauchetado 4x12');

    fireEvent.click(screen.getByRole('button', { name: 'No aprobar' }));
    const dialogo = screen.getByRole('dialog', { name: /no aprobar cotización/i });
    fireEvent.click(within(dialogo).getByRole('button', { name: /marcar como no aprobada/i }));
    expect(within(dialogo).getByRole('alert')).toHaveTextContent(/escribe el motivo/i);
    expect(llamadas('PATCH', '/api/cotizaciones/12/estado')).toHaveLength(0);

    fireEvent.change(within(dialogo).getByLabelText(/motivo/i), {
      target: { value: 'Mejor precio' },
    });
    fireEvent.click(within(dialogo).getByRole('button', { name: /marcar como no aprobada/i }));

    expect(await screen.findByText(/Mejor precio/)).toBeInTheDocument();
    const [, op] = llamadas('PATCH', '/api/cotizaciones/12/estado')[0];
    expect(JSON.parse(op.body)).toEqual({ estado: 'NO_APROBADA', motivoRechazo: 'Mejor precio' });
  });

  test('eliminar pide confirmación con el número', async () => {
    backend(TODOS, [['DELETE', '/api/cotizaciones/12', () => [204, null]]]);
    renderApp('/modulos/cotizaciones/12');
    await screen.findByText('Cable encauchetado 4x12');

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    const dialogo = screen.getByRole('dialog', { name: /eliminar cotización/i });
    fireEvent.click(within(dialogo).getByRole('button', { name: /sí, eliminar C-1-2562/i }));

    expect(await screen.findByText(/Cotización C-1-2562 eliminada/)).toBeInTheDocument();
    expect(llamadas('DELETE', '/api/cotizaciones/12')).toHaveLength(1);
  });
});

// ---------- Formulario ----------
describe('formulario de cotización', () => {
  test('calcula en vivo y envía números al crear', async () => {
    backend(TODOS, [
      ['POST', '/api/cotizaciones', () => [201, { ...DETALLE, id: 99 }]],
      ['GET', '/api/cotizaciones/99', () => [200, { ...DETALLE, id: 99 }]],
    ]);
    renderApp('/modulos/cotizaciones/nueva');
    await screen.findByRole('heading', { name: 'Nueva cotización' });

    fireEvent.change(screen.getByLabelText('Número *'), { target: { value: 'C-9' } });
    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: 'Cargill' } });
    fireEvent.change(screen.getByLabelText('Descripción del material 1'), {
      target: { value: 'Tablero' },
    });
    fireEvent.change(screen.getByLabelText('Cantidad del material 1'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Valor unitario del material 1'), {
      target: { value: '1.000.000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /agregar material/i }));
    fireEvent.change(screen.getByLabelText('Descripción del material 2'), {
      target: { value: 'Cable' },
    });
    fireEvent.change(screen.getByLabelText('Cantidad del material 2'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Valor unitario del material 2'), {
      target: { value: '50000' },
    });

    // Subtotal 2.500.000 · IVA 475.000 · Total 2.975.000
    expect(screen.getByText(/2\.500\.000/)).toBeInTheDocument();
    expect(screen.getByLabelText(/IVA/)).toHaveValue('475000');
    expect(screen.getByText(/2\.975\.000/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cotización' }));
    expect(await screen.findByText('Cotización creada.')).toBeInTheDocument();

    const [, op] = llamadas('POST', '/api/cotizaciones')[0];
    expect(JSON.parse(op.body)).toEqual({
      numero: 'C-9',
      cliente: 'Cargill',
      ingSolicitante: null,
      responsableId: null,
      items: [
        { descripcion: 'Tablero', cantidad: 2, valorUnitario: 1000000, valorBruto: 2000000 },
        { descripcion: 'Cable', cantidad: 10, valorUnitario: 50000, valorBruto: 500000 },
      ],
      subtotal: 2500000,
      iva: 475000,
      total: 2975000,
      numeroFactura: null,
      notas: null,
    });
  });

  test('se puede guardar sin materiales (la fila vacía se ignora)', async () => {
    backend(TODOS, [
      ['POST', '/api/cotizaciones', () => [201, { ...DETALLE, id: 99, items: [] }]],
      ['GET', '/api/cotizaciones/99', () => [200, { ...DETALLE, id: 99, items: [] }]],
    ]);
    renderApp('/modulos/cotizaciones/nueva');
    await screen.findByRole('heading', { name: 'Nueva cotización' });

    fireEvent.change(screen.getByLabelText('Número *'), { target: { value: 'C-10' } });
    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: 'Savicol' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cotización' }));

    expect(await screen.findByText('Cotización creada.')).toBeInTheDocument();
    const cuerpo = JSON.parse(llamadas('POST', '/api/cotizaciones')[0][1].body);
    expect(cuerpo.items).toEqual([]);
    expect(cuerpo.subtotal).toBe(0);
  });

  test('valida obligatorios y valores negativos antes de enviar', async () => {
    backend(TODOS);
    renderApp('/modulos/cotizaciones/nueva');
    await screen.findByRole('heading', { name: 'Nueva cotización' });

    fireEvent.change(screen.getByLabelText('Cantidad del material 1'), { target: { value: '-3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cotización' }));

    expect(screen.getByText('Ingresa el número de la cotización.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa el cliente.')).toBeInTheDocument();
    expect(screen.getByText('Falta la descripción.')).toBeInTheDocument();
    expect(screen.getByText('No puede ser negativa.')).toBeInTheDocument();
    expect(llamadas('POST', '/api/cotizaciones')).toHaveLength(0);
  });

  test('editar carga los datos y envía todo con PUT', async () => {
    backend(TODOS, [['PUT', '/api/cotizaciones/12', (op) => [200, { ...DETALLE }]]]);
    renderApp('/modulos/cotizaciones/12/editar');

    expect(await screen.findByLabelText('Número *')).toHaveValue('C-1-2562');
    expect(screen.getByLabelText('Descripción del material 1')).toHaveValue(
      'Cable encauchetado 4x12',
    );
    fireEvent.change(screen.getByLabelText('Número de factura'), {
      target: { value: 'FV-001-933' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument();
    const cuerpo = JSON.parse(llamadas('PUT', '/api/cotizaciones/12')[0][1].body);
    expect(cuerpo.numeroFactura).toBe('FV-001-933');
    expect(cuerpo.items).toHaveLength(1);
    expect(cuerpo.responsableId).toBe(3);
  });
});

// ---------- PDF de Siigo ----------
describe('subir PDF de Siigo', () => {
  const LECTURA = {
    numero: 'C-1-2562',
    cliente: 'POLLOS EL BUCANERO S.A',
    ingSolicitante: null,
    items: [{ descripcion: 'Cable', cantidad: 120, valorUnitario: 16600, valorBruto: 1992000 }],
    subtotal: 1992000,
    iva: 378480,
    total: 2370480,
    avisos: ['No se encontró el ingeniero solicitante'],
  };

  async function subirPdf() {
    renderApp('/modulos/cotizaciones');
    await screen.findByText('C-1-2562');
    fireEvent.click(screen.getByRole('button', { name: /subir pdf de siigo/i }));
    const archivo = new File(['%PDF-1.4'], 'cotizacion.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Elegir PDF de Siigo'), {
      target: { files: [archivo] },
    });
  }

  test('llena el formulario con los datos leídos y muestra los avisos', async () => {
    backend(TODOS, [
      ['POST', '/api/cotizaciones/leer-pdf', () => [200, { ...LECTURA, idExistente: null }]],
    ]);
    await subirPdf();

    expect(await screen.findByLabelText('Número *')).toHaveValue('C-1-2562');
    expect(screen.getByLabelText('Cliente *')).toHaveValue('POLLOS EL BUCANERO S.A');
    expect(screen.getByLabelText('Descripción del material 1')).toHaveValue('Cable');
    expect(screen.getByText('No se encontró el ingeniero solicitante')).toBeInTheDocument();
    expect(screen.getByText(/no se guarda/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cotización' })).toBeEnabled();

    const [, op] = llamadas('POST', '/api/cotizaciones/leer-pdf')[0];
    expect(op.body).toBeInstanceOf(FormData);
    expect(op.body.get('archivo').name).toBe('cotizacion.pdf');
    expect(op.headers['Content-Type']).toBeUndefined();
  });

  test('si la cotización ya existe, avisa y no deja guardar otra igual', async () => {
    backend(TODOS, [
      ['POST', '/api/cotizaciones/leer-pdf', () => [200, { ...LECTURA, idExistente: 12 }]],
    ]);
    await subirPdf();

    expect(await screen.findByText(/ya está registrada/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cotización' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /abrir la cotización existente/i }));
    expect(await screen.findByText('Cable encauchetado 4x12')).toBeInTheDocument();
  });

  test('un PDF de más de 10 MB se rechaza sin enviarlo', async () => {
    backend(TODOS);
    renderApp('/modulos/cotizaciones');
    await screen.findByText('C-1-2562');
    fireEvent.click(screen.getByRole('button', { name: /subir pdf de siigo/i }));

    const grande = new File(['%PDF'], 'grande.pdf', { type: 'application/pdf' });
    Object.defineProperty(grande, 'size', { value: 10 * 1024 * 1024 + 1 });
    fireEvent.change(screen.getByLabelText('Elegir PDF de Siigo'), {
      target: { files: [grande] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('El archivo pesa más de 10 MB.');
    expect(llamadas('POST', '/api/cotizaciones/leer-pdf')).toHaveLength(0);
  });

  test('muestra el mensaje del backend si el PDF no es válido', async () => {
    backend(TODOS, [
      [
        'POST',
        '/api/cotizaciones/leer-pdf',
        () => [400, { estado: 400, mensaje: 'El archivo no parece una cotización de Siigo' }],
      ],
    ]);
    await subirPdf();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El archivo no parece una cotización de Siigo',
    );
  });
});
