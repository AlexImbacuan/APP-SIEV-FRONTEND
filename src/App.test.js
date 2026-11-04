import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { modulosVisibles } from './config/modulos';

function renderApp(ruta = '/') {
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

/**
 * Simula el backend. `rutas` es una lista de [método, fragmento de URL, handler].
 * El handler recibe (opciones de fetch) y devuelve [estado, cuerpo].
 */
function mockBackend(rutas) {
  global.fetch = jest.fn((url, opciones = {}) => {
    const metodo = opciones.method || 'GET';
    const ruta = rutas.find(([m, fragmento]) => m === metodo && url.endsWith(fragmento));
    if (!ruta) return Promise.resolve(respuesta(404, { mensaje: `Sin mock: ${metodo} ${url}` }));
    const [estado, cuerpo] = ruta[2](opciones);
    return Promise.resolve(respuesta(estado, cuerpo));
  });
}

const PERMISOS_ADMIN = ['usuarios:gestionar', 'roles:gestionar', 'proyectos:ver'];

function usuarioCon(rol, permisos = [], extra = {}) {
  return {
    id: 1,
    nombre: 'Ana Pérez',
    email: 'ana@siev.com',
    activo: true,
    rol,
    permisos,
    ...extra,
  };
}

const ROLES = [
  { id: 1, nombre: 'SUPERADMIN', descripcion: 'Acceso total', permisos: [] },
  { id: 2, nombre: 'SUPERVISOR', descripcion: 'Gestiona proyectos', permisos: [] },
  { id: 3, nombre: 'TECNICO', descripcion: 'Consulta proyectos', permisos: [] },
];

function iniciarSesionGuardada() {
  localStorage.setItem('authToken', 'token-de-prueba');
  localStorage.setItem('refreshToken', 'refresh-de-prueba');
}

beforeEach(() => {
  localStorage.clear();
  delete global.fetch;
});

describe('config/modulos', () => {
  const ids = (usuario) => modulosVisibles(usuario).map((m) => m.id);

  test('cada rol ve sus módulos y "usuarios" depende del permiso', () => {
    expect(ids(usuarioCon('SUPERADMIN', PERMISOS_ADMIN))).toEqual([
      'administracion',
      'ventas',
      'trabajador',
      'admin',
      'usuarios',
    ]);
    expect(ids(usuarioCon('SUPERVISOR'))).toEqual(['ventas', 'comun']);
    expect(ids(usuarioCon('TECNICO'))).toEqual(['trabajador', 'comun']);
    expect(ids(usuarioCon(null))).toEqual([]);
  });
});

describe('sesión y rutas protegidas', () => {
  test('la landing muestra el botón de iniciar sesión', () => {
    renderApp('/');
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test('sin sesión, /modulos lleva al login', () => {
    renderApp('/modulos/ventas');
    expect(screen.getByRole('dialog', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test('un TECNICO ve solo sus módulos y no ve "Usuarios"', async () => {
    iniciarSesionGuardada();
    mockBackend([['GET', '/api/auth/me', () => [200, usuarioCon('TECNICO', ['proyectos:ver'])]]]);
    renderApp('/modulos');

    expect(await screen.findByRole('heading', { name: 'Trabajador' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Uso común' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ventas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
  });

  test('sin el permiso, /modulos/usuarios muestra "No tienes permiso"', async () => {
    iniciarSesionGuardada();
    mockBackend([['GET', '/api/auth/me', () => [200, usuarioCon('TECNICO', ['proyectos:ver'])]]]);
    renderApp('/modulos/usuarios');

    expect(
      await screen.findByRole('heading', { name: /no tienes permiso para ver este módulo/i }),
    ).toBeInTheDocument();
  });

  test('un usuario sin rol ve el aviso y ningún módulo', async () => {
    iniciarSesionGuardada();
    mockBackend([['GET', '/api/auth/me', () => [200, usuarioCon(null)]]]);
    renderApp('/modulos');

    expect(await screen.findByText(/aún no tiene un rol asignado/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /entrar/i })).not.toBeInTheDocument();
  });

  test('con el accessToken vencido, se renueva con el refreshToken sin pedir login', async () => {
    iniciarSesionGuardada();
    mockBackend([
      [
        'GET',
        '/api/auth/me',
        (op) =>
          op.headers.Authorization === 'Bearer token-nuevo'
            ? [200, usuarioCon('TECNICO')]
            : [401, { estado: 401, mensaje: 'Token expirado' }],
      ],
      ['POST', '/auth/refresh', () => [200, { accessToken: 'token-nuevo', refreshToken: 'r2' }]],
    ]);
    renderApp('/modulos');

    expect(await screen.findByRole('heading', { name: 'Trabajador' })).toBeInTheDocument();
    expect(localStorage.getItem('authToken')).toBe('token-nuevo');
    expect(localStorage.getItem('refreshToken')).toBe('r2');
    const refreshes = global.fetch.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'));
    expect(refreshes).toHaveLength(1);
  });

  test('si el refresh también falla, se cierra la sesión y se pide login', async () => {
    iniciarSesionGuardada();
    mockBackend([
      ['GET', '/api/auth/me', () => [401, { estado: 401, mensaje: 'Token expirado' }]],
      ['POST', '/auth/refresh', () => [401, { estado: 401, mensaje: 'Refresh inválido' }]],
    ]);
    renderApp('/modulos');

    expect(await screen.findByText(/tu sesión expiró/i)).toBeInTheDocument();
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});

describe('gestión de usuarios', () => {
  const LISTA = [
    usuarioCon('SUPERADMIN', PERMISOS_ADMIN),
    { id: 2, nombre: 'Juan Gómez', email: 'juan@siev.com', activo: true, rol: 'TECNICO' },
    { id: 3, nombre: 'Luisa Díaz', email: 'luisa@siev.com', activo: false, rol: null },
  ];

  function backendAdmin(extra = []) {
    iniciarSesionGuardada();
    mockBackend([
      ['GET', '/api/auth/me', () => [200, usuarioCon('SUPERADMIN', PERMISOS_ADMIN)]],
      ['GET', '/api/usuarios', () => [200, LISTA]],
      ['GET', '/api/roles', () => [200, ROLES]],
      ...extra,
    ]);
  }

  test('lista los usuarios con rol y estado, y protege la fila propia', async () => {
    backendAdmin();
    renderApp('/modulos/usuarios');

    const filaJuan = (await screen.findByText('juan@siev.com')).closest('tr');
    expect(within(filaJuan).getByText('TECNICO')).toBeInTheDocument();
    expect(within(filaJuan).getByText('Activo')).toBeInTheDocument();

    const filaLuisa = screen.getByText('luisa@siev.com').closest('tr');
    expect(within(filaLuisa).getByText('Sin rol')).toBeInTheDocument();
    expect(within(filaLuisa).getByText('Inactivo')).toBeInTheDocument();

    const filaPropia = screen.getByText('ana@siev.com').closest('tr');
    expect(within(filaPropia).getByRole('button', { name: 'Desactivar' })).toBeDisabled();
    expect(within(filaPropia).getByRole('button', { name: 'Cambiar rol' })).toBeDisabled();
    expect(within(filaJuan).getByRole('button', { name: 'Desactivar' })).toBeEnabled();
  });

  test('el buscador filtra por nombre o email', async () => {
    backendAdmin();
    renderApp('/modulos/usuarios');
    await screen.findByText('juan@siev.com');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'luisa' } });
    expect(screen.queryByText('juan@siev.com')).not.toBeInTheDocument();
    expect(screen.getByText('luisa@siev.com')).toBeInTheDocument();
  });

  test('al crear con un email repetido muestra el mensaje del backend', async () => {
    backendAdmin([
      [
        'POST',
        '/api/usuarios',
        () => [
          409,
          { estado: 409, error: 'Conflict', mensaje: 'Ya existe un usuario con ese email' },
        ],
      ],
    ]);
    renderApp('/modulos/usuarios');
    await screen.findByText('juan@siev.com');

    fireEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));
    const dialogo = screen.getByRole('dialog', { name: 'Nuevo usuario' });
    fireEvent.change(within(dialogo).getByLabelText('Nombre'), { target: { value: 'Otro' } });
    fireEvent.change(within(dialogo).getByLabelText('Email'), {
      target: { value: 'juan@siev.com' },
    });
    fireEvent.change(within(dialogo).getByLabelText('Contraseña'), {
      target: { value: 'secreto123' },
    });
    await waitFor(() =>
      expect(within(dialogo).getByRole('option', { name: /TECNICO/ })).toBeInTheDocument(),
    );
    fireEvent.change(within(dialogo).getByLabelText('Rol'), { target: { value: '3' } });
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Crear usuario' }));

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'Ya existe un usuario con ese email',
    );
    const crear = global.fetch.mock.calls.find(([, op]) => op?.method === 'POST');
    expect(JSON.parse(crear[1].body)).toEqual({
      nombre: 'Otro',
      email: 'juan@siev.com',
      password: 'secreto123',
      rolId: 3,
    });
  });

  test('valida los campos antes de enviar', async () => {
    backendAdmin();
    renderApp('/modulos/usuarios');
    await screen.findByText('juan@siev.com');

    fireEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));
    const dialogo = screen.getByRole('dialog', { name: 'Nuevo usuario' });
    // Espera a que carguen los roles del selector
    await within(dialogo).findByRole('option', { name: /TECNICO/ });
    fireEvent.change(within(dialogo).getByLabelText('Email'), { target: { value: 'no-es-email' } });
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Crear usuario' }));

    expect(within(dialogo).getByText('Ingresa el nombre.')).toBeInTheDocument();
    expect(within(dialogo).getByText('El email no es válido.')).toBeInTheDocument();
    expect(within(dialogo).getByText('Ingresa una contraseña.')).toBeInTheDocument();
    expect(global.fetch.mock.calls.some(([, op]) => op?.method === 'POST')).toBe(false);
  });
});
