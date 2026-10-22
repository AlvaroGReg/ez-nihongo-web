# Diseño técnico — inicio de sesión persistente

## Límite de responsabilidad

Este documento describe los cambios del cliente y la secuencia integrada. El
diseño de endpoints, modelos de persistencia, emisión/revocación de cookies,
controles CSRF y migraciones pertenece a la especificación de plataforma
[`persistent-login/design.md`](../../../ez-nihongo-platform/specs/persistent-login/design.md);
si hay discrepancias, el contrato de API definido allí es autoritativo. No
duplicar su implementación en el repositorio web.

## Decisiones

- La API conserva JWT bearer de vida corta para las llamadas autenticadas ya
  existentes. El JWT sólo vive en memoria en el cliente.
- El token persistente es una credencial aleatoria opaca gestionada por la API,
  no un JWT de larga duración ni una contraseña guardada.
- La cookie HttpOnly sólo transporta ese token a los endpoints de autenticación;
  los endpoints de vocabulario/progreso siguen recibiendo el JWT bearer.
- La opción «Recordarme» determina si el login emite una sesión de renovación.
  La casilla no altera la cookie de una sesión distinta hasta que el login
  válido sustituya esa sesión.
- El vencimiento de 30 días es absoluto por familia. Rotar renueva el secreto,
  no la fecha de expiración.
- Los despliegues públicos usan mismo origen mediante el proxy `/api` siempre
  que sea posible. Si web y API usan distintos orígenes, se configuran orígenes
  exactos y se verifica el soporte de cookies; no se relajan `SameSite` ni CORS
  con comodines para hacer funcionar el flujo.

## Flujo de inicio de sesión

1. El cliente envía correo, contraseña y `rememberMe` a
   `POST /api/v1/auth/login` con `credentials: 'include'`.
2. La API valida credenciales y rate limit. Para `rememberMe=false`, revoca una
   cookie anterior que pertenezca a este navegador si existe, expira esa cookie
   y devuelve sólo el JWT de acceso e identidad.
3. Para `rememberMe=true`, la API crea un token opaco aleatorio de 256 bits,
   guarda el hash asociado a usuario/familia y devuelve el JWT de acceso e
   identidad. El token opaco sólo se envía como cookie HttpOnly.
4. El cliente guarda la respuesta de acceso en el store reactivo en memoria; no
   la serializa.
5. Si las credenciales son inválidas, la API no emite token ni establece una
   sesión nueva.

## Restauración y renovación

1. Antes de montar el router/permitir peticiones autenticadas, el cliente llama
   una vez a `POST /api/v1/auth/refresh`, con `credentials: 'include'`, JSON y
   `X-EZ-Nihongo-Request: 1`.
2. La API valida cookie, vencimiento, revocación y origen. La operación de
   rotación es atómica: marca el token presentado como consumido y almacena el
   hash de un token nuevo en la misma familia.
3. La API devuelve el nuevo JWT de acceso e identidad y restablece la cookie con
   `Max-Age` igual al tiempo restante de los 30 días absolutos.
4. El cliente conserva el resultado en memoria. Ante respuesta 401/404, limpia
   autenticación y continúa anónimo; no reintenta indefinidamente.
5. El cliente coordina las llamadas concurrentes de renovación mediante una
   única promesa en curso. La API sigue siendo autoridad y rechaza reutilización
   de un token rotado; la coordinación cliente evita falsos positivos por
   llamadas simultáneas legítimas.

La coordinación debe cubrir también pestañas del mismo origen. Usar un lock
compartido entre pestañas (por ejemplo, Web Locks API) alrededor de la llamada de
refresh; la pestaña que espera debe renovar usando la cookie vigente después de
obtener el lock. No se debe transmitir el token ni la respuesta con credenciales
por `BroadcastChannel` o almacenamiento compartido.

## Cierre de sesión

`POST /api/v1/auth/logout` valida origen y cabecera CSRF, revoca el token/familia
identificada por la cookie si está disponible y siempre expira la cookie. El
cliente limpia estado de autenticación en `finally`, aunque la API no responda.
La revocación del token de acceso actual no está disponible de forma inmediata:
el JWT corto puede seguir válido hasta su expiración, pero el cliente deja de
usarlo al cerrar sesión.

## Contratos HTTP

Todos los endpoints siguientes pertenecen al grupo rate-limited de
`/api/v1/auth`. La implementación debe documentar respuestas y errores en
OpenAPI.

### `POST /api/v1/auth/login`

Petición:

```json
{
  "email": "learner@example.com",
  "password": "<contraseña introducida>",
  "rememberMe": true
}
```

Respuesta `200 OK` (cuerpo compatible con la sesión actual):

```json
{
  "user": { "id": "<id>", "email": "learner@example.com" },
  "accessToken": "<jwt-de-vida-corta>",
  "tokenType": "Bearer",
  "expiresAt": "<fecha-utc>"
}
```

`rememberMe` ausente equivale a `false` para compatibilidad. `rememberMe` sólo
se admite en login. La cookie de renovación no aparece en el cuerpo. Credenciales
inválidas devuelven el `401` actual y no dejan cookie de sesión nueva.

### `POST /api/v1/auth/refresh`

No acepta tokens en el cuerpo ni en headers custom de credencial. Requiere la
cookie HttpOnly y `X-EZ-Nihongo-Request: 1`. Devuelve `200 OK` con la misma
respuesta de identidad/JWT corta del login y rota la cookie. Cookie o sesión
inválida devuelve `401`, expira la cookie y no revela la causa específica.

### `POST /api/v1/auth/logout`

Requiere origen permitido y `X-EZ-Nihongo-Request: 1`. Revoca la sesión asociada
si existe, expira la cookie y devuelve `204 No Content`. La ausencia de sesión
también devuelve `204`.

### `POST /api/v1/auth/register`

Conserva el contrato de registro. No acepta `rememberMe`, no establece la cookie
de renovación y no crea sesión persistente.

## Cookie

El cliente no construye, lee ni persiste el valor de la cookie; las llamadas a
login, refresh y logout usan `credentials: 'include'`. Nombre, atributos,
expiración y política de entorno son propiedad de la API y están definidos en
[`persistent-login/design.md`](../../../ez-nihongo-platform/specs/persistent-login/design.md).

## Persistencia de renovaciones

Agregar una entidad, por ejemplo `PersistentLoginSession`, al
`PlatformIdentityDbContext` y una migración EF Core aditiva. Campos mínimos:

- identificador interno;
- `UserId` FK a `Users`, con borrado en cascada;
- `FamilyId` aleatorio para agrupar rotaciones de una sesión de navegador;
- `TokenHash` binario/hexadecimal, único e indexado; nunca valor original;
- `CreatedAt`, `ExpiresAt` absolutos y `RevokedAt` nullable en UTC;
- referencia opcional a sesión reemplazante para auditar rotación/reutilización.

La API debe usar `TimeProvider` para comparar fechas. Una transacción o
actualización condicional debe garantizar que dos peticiones no consuman el
mismo token válidamente. En detección de reutilización, revocar todas las filas
activas de esa `FamilyId`. Indexar por `TokenHash`, `FamilyId` y `UserId` según
las consultas de validación/revocación.

No registrar tokens ni incluirlos en excepciones. La expiración lógica es
obligatoria aunque exista limpieza periódica de filas expiradas.

## Organización prevista

### Plataforma (`ez-nihongo-platform/`)

- Extender `Authentication/AuthContracts.cs` para `rememberMe` sólo en login.
- Extender `IAuthService`/`AuthService` para emitir, rotar, validar y revocar
  credenciales de renovación.
- Añadir entidad, configuración EF, migración y servicio de persistencia de
  sesiones.
- Extender `Authentication/AuthEndpoints.cs` con cookie y endpoints refresh y
  logout, manteniendo autorización/rate limit y metadatos OpenAPI.
- Configurar orígenes de confianza y política de cookie desde configuración
  tipada validada al arranque.
- No cambiar el `JwtBearer` para autenticar APIs mediante la cookie; los
  recursos existentes siguen usando `Authorization: Bearer`.

### Web (`ez-nihongo-web/`)

- `AuthView.vue`: casilla y `rememberMe` sólo en login.
- `services/authApi.ts`: login/refresh/logout con `credentials: 'include'` y
  cabecera CSRF en operaciones que usan cookie.
- `stores/auth.ts`: estado en memoria, restauración asíncrona y logout en
  servidor; eliminar lectura/escritura de JWT en `localStorage`.
- `main.ts` y router: completar una única restauración antes de autorizar vistas
  o iniciar peticiones autenticadas.
- Actualizar `vocabulary.ts`, `vocabularyProgress.ts`, vistas y pruebas para que
  dependan del estado en memoria, sin leer tokens persistidos.
- Añadir mensajes/localización para el checkbox y errores de sesión si hace
  falta; nunca mostrar detalles internos de validación de tokens.

## Orden de implementación SDD

1. Acordar contrato login/refresh/logout y configuración de origen/cookie entre
   repositorios.
2. Implementar persistencia, rotación, revocación y endpoints en la plataforma;
   añadir migración y pruebas de integración de seguridad.
3. Implementar estado sólo en memoria y restauración/logout en la web.
4. Añadir la casilla `rememberMe` y conectar el formulario.
5. Verificar el flujo integrado con web y API detrás del proxy same-origin,
   incluida configuración local de desarrollo.
6. Retirar cualquier serialización antigua de `ez-nihongo:auth-session:v1` y
   documentar que sesiones preexistentes requerirán iniciar sesión de nuevo.

## Verificación

- API: `dotnet build` y pruebas de integración con PostgreSQL cubriendo login
  persistente/no persistente, flags/expiración de cookie, refresh, rotación
  atómica, repetición, vencimiento absoluto, logout, aislamiento de familias,
  origen/CSRF, rate limit y reinicio de proceso.
- Web: type-check, unit tests y build; pruebas para checkbox, login con/sin
  remember, arranque bloqueado hasta refresh, estado anónimo en refresh 401,
  coordinación de refresh concurrente, logout y ausencia de escrituras de token
  en Web Storage.
- Integrado: recargar antes/después de 30 días (reloj controlado), iniciar en
  dos navegadores, revocar uno, y comprobar que no se envían cookies en endpoints
  ajenos a autenticación.
