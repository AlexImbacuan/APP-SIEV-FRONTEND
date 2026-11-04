# Gestión de usuarios para el SUPERADMIN

Necesito que implementes en este frontend la **gestión de usuarios para el SUPERADMIN**,
conectada al backend APP-SIEV (Spring Boot), que ya está terminado y probado.

Ya revisaste el proyecto: no existe nada de gestión de usuarios, pero sí la base
(el cliente de la API con manejo de 401/403, el contexto de sesión `useAuth`,
`RutaProtegida` y el archivo de módulos por rol). **Reutiliza todo eso** y sigue las
mismas convenciones de carpetas, estilos y componentes. No instales librerías nuevas
si no hace falta. Si algo de lo que pido ya está hecho, dímelo y completa solo lo que falte.

El usuario SUPERADMIN **ya existe** en el backend (con su email y contraseña); no hay
que crearlo. Las pruebas se hacen iniciando sesión con ese usuario.

---

## 1. Backend

- URL local: `http://localhost:8080`. En producción es otra URL: usa la configuración
  que el proyecto ya tenga para la URL de la API (no la escribas fija en el código).
- CORS ya permite `http://localhost:3000`, `https://sievsas.com` y `https://www.sievsas.com`.
- Todas las rutas, excepto login, registro, refresh y logout, requieren el header
  `Authorization: Bearer <accessToken>`.
- Las rutas de autenticación responden en `/api/auth/*` y también en `/auth/*`.
  Usa la que ya use el proyecto.

---

## 2. Autenticación y sesión

### Login — `POST /api/auth/login`
```json
{ "email": "...", "password": "..." }
```
Respuesta 200:
```json
{ "accessToken": "eyJ...", "refreshToken": "..." }
```
- El `accessToken` dura **15 minutos**. El `refreshToken` dura **7 días**.
- **Guarda los dos.**

### Usuario actual — `GET /api/auth/me`
```json
{
  "id": 1,
  "nombre": "Super Administrador",
  "email": "...",
  "activo": true,
  "rol": "SUPERADMIN",
  "permisos": ["usuarios:gestionar", "roles:gestionar", "proyectos:ver", "..."]
}
```
Llámalo justo después del login (y al recargar la página si hay token guardado) y guarda
el resultado en la sesión. **La visibilidad de menús y pantallas se decide por
`permisos`, no por el nombre del rol.**

### Renovación automática — `POST /api/auth/refresh`
```json
{ "refreshToken": "<el guardado>" }
```
Respuesta 200: `{ "accessToken": "...", "refreshToken": "..." }` (misma forma que el login).

- Si una petición responde **401**, llama **una sola vez** a `/api/auth/refresh`.
  - Si responde 200: guarda el `accessToken` **y** el `refreshToken` NUEVOS (el anterior
    deja de servir) y repite la petición original.
  - Si el refresh también responde 401: borra los tokens y manda al login.
- Si varias peticiones fallan a la vez, haz **un solo** refresh y que las demás esperen
  su resultado. No lances varios refresh en paralelo: el segundo fallaría porque el
  primero ya cambió el token.
- No intentes refrescar cuando la petición que falló es el propio login o el refresh.
- Integra esto en el cliente de la API que ya existe, sin romper su manejo actual de 403.

### Cerrar sesión — `POST /api/auth/logout`
```json
{ "refreshToken": "..." }
```
Responde **204**. Después borra ambos tokens y los datos de sesión, y ve al login.
Si la llamada falla, igual cierra la sesión en el frontend.

---

## 3. Endpoints de usuarios (requieren el permiso `usuarios:gestionar`)

| Acción | Método y ruta | Body |
|---|---|---|
| Listar todos | `GET /api/usuarios` | — |
| Obtener uno | `GET /api/usuarios/{id}` | — |
| Crear | `POST /api/usuarios` → responde **201** | `{ "nombre", "email", "password", "rolId" }` |
| Editar datos | `PUT /api/usuarios/{id}` | `{ "nombre", "email", "password" }`. Todos opcionales; los vacíos no se cambian |
| Cambiar rol | `PUT /api/usuarios/{id}/rol` | `{ "rolId": 2 }` (`null` quita el rol) |
| Activar / desactivar | `PATCH /api/usuarios/{id}/activo` | `{ "activo": false }` |

Cada usuario que devuelve la API tiene esta forma (nunca incluye la contraseña):
```json
{ "id": 5, "nombre": "Juan", "email": "juan@siev.com", "activo": true,
  "rol": "TECNICO", "permisos": ["proyectos:ver", "empleados:ver", "trabajador:ver"] }
```
`rol` puede ser `null` si el usuario no tiene rol.

---

## 4. Roles (para el selector)

`GET /api/roles` (requiere `roles:gestionar`; el SUPERADMIN lo tiene):
```json
[
  { "id": 1, "nombre": "SUPERADMIN", "descripcion": "Acceso total; asigna roles y permisos", "permisos": ["..."] },
  { "id": 2, "nombre": "SUPERVISOR", "descripcion": "Gestiona proyectos y empleados", "permisos": ["..."] },
  { "id": 3, "nombre": "TECNICO",    "descripcion": "Consulta proyectos y empleados", "permisos": ["..."] }
]
```
Los `id` dependen de la base de datos: **cárgalos siempre de este endpoint**, nunca los
escribas fijos. Como en cada usuario el `rol` viene como nombre, para preseleccionar su
rol actual búscalo por `nombre` en esta lista.

---

## 5. Errores

Todos los errores llegan en JSON con esta forma:
```json
{ "fecha": "...", "estado": 409, "error": "Conflict",
  "mensaje": "Ya existe un usuario con ese email", "ruta": "/api/usuarios" }
```
Muestra siempre el campo **`mensaje`** al usuario (aviso/toast o debajo del formulario).

Casos que el backend ya controla:
- **400**: campo obligatorio vacío (`nombre`, `email`, `password` al crear) o rol inexistente.
- **401**: token ausente, inválido o expirado → refresh automático (sección 2).
- **403**: sin permiso, o intentar crear/modificar un SUPERADMIN sin serlo.
- **404**: usuario no encontrado.
- **409**: email repetido, desactivarse a uno mismo, quitarse a uno mismo el rol
  SUPERADMIN, o dejar el sistema sin ningún SUPERADMIN activo.

---

## 6. Lo que debes construir

1. **Sesión**: login que guarde ambos tokens y llame a `/api/auth/me`; refresh automático
   en el cliente de la API; logout que llame al backend.
2. **Menú**: opción **"Usuarios"** solo si `permisos` incluye `usuarios:gestionar`
   (agrégala al archivo de módulos por rol que ya existe). Protege la ruta con
   `RutaProtegida`: si alguien sin el permiso entra a la URL a mano, redirígelo o
   muestra "No tienes permiso".
3. **Pantalla Usuarios**:
   - Tabla con nombre, email, rol (o "Sin rol") y estado (Activo / Inactivo).
   - Buscador por nombre o email (filtrado en el frontend).
   - Botón **"Nuevo usuario"**.
   - Por fila: **Editar**, **Cambiar rol** y **Activar / Desactivar** (pide
     confirmación antes de desactivar).
   - En la fila del usuario que tiene la sesión iniciada, deshabilita "Desactivar" y el
     cambio de rol (el backend igual lo rechaza, pero así se evita el error).
4. **Formulario Nuevo usuario**: nombre, email, contraseña y selector de rol cargado de
   `GET /api/roles`, mostrando nombre y descripción. Validación básica antes de enviar
   (campos obligatorios, formato de email). Al guardar con éxito, cierra el formulario
   y recarga la tabla.
5. **Formulario Editar**: nombre y email precargados; la contraseña vacía significa
   "no cambiarla" (indícalo en el campo).
6. Estados de **cargando**, **lista vacía** y **error** en la tabla, y botones
   deshabilitados mientras se envía una petición (evita dobles envíos).

Todo el texto de la interfaz en **español**.

---

## 7. Cómo probarlo

Con el backend corriendo en `http://localhost:8080`:

1. Inicia sesión con el SUPERADMIN existente y abre **Usuarios**: debe verse la lista.
2. Crea un usuario con rol **TECNICO**.
3. Intenta crear otro con el **mismo email**: debe aparecer el mensaje del backend
   ("Ya existe un usuario con ese email").
4. Cierra sesión, entra con el usuario nuevo y verifica que **no** ve el menú "Usuarios"
   y que si escribe la URL a mano no puede entrar.
5. Vuelve como SUPERADMIN, cámbiale el rol a SUPERVISOR y luego desactívalo.
6. Verifica que en tu propia fila no puedes desactivarte ni cambiarte el rol.
7. Para probar el refresh: borra o altera el `accessToken` guardado (dejando el
   `refreshToken`) y navega; la sesión debe renovarse sola sin pedir login.

Al terminar, dime qué archivos creaste o modificaste y cualquier cosa del backend que te
haya faltado o que no coincida con esta descripción.
