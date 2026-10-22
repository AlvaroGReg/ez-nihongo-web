# Requisitos — inicio de sesión persistente

## Objetivo

Permitir que una persona mantenga su sesión iniciada hasta 30 días cuando
selecciona «Recordarme», sin guardar la contraseña ni tokens de renovación en el
navegador accesibles a JavaScript. La función afecta al cliente web y a la API
de plataforma.

## Contexto actual

- `ez-nihongo-web/src/stores/auth.ts` guarda el JWT de acceso en `localStorage` y
  lo restaura al iniciar la SPA.
- La API entrega un JWT de acceso desde `POST /api/v1/auth/login` y no ofrece
  renovación ni revocación de sesión.
- El inicio de sesión, el registro, el progreso y algunas consultas usan el JWT
  como bearer token.

La implementación debe reemplazar la persistencia actual del JWT, no añadir un
token de renovación junto a ella.

## Propiedad de especificaciones

Este documento define el comportamiento del cliente web y los criterios de
integración entre cliente y API. Los contratos, requisitos y verificaciones
propios de la API son propiedad de `ez-nihongo-platform`, en
[`specs/persistent-login`](../../../ez-nihongo-platform/specs/persistent-login/); esa
especificación es la fuente de verdad para endpoints, persistencia, rotación,
cookies y controles de seguridad del servidor. Ambas especificaciones deben
implementarse juntas y conservar los contratos compatibles.

## Alcance

- Una casilla opcional «Recordarme» en el formulario de inicio de sesión; no se
  presenta durante el registro.
- Sesión no persistente cuando la casilla está desmarcada: el token de acceso
  sólo existe en memoria y la sesión termina al recargar/cerrar la SPA.
- Sesión persistente de hasta 30 días cuando está marcada, mantenida mediante
  una cookie de renovación protegida y una sesión revocable en la API.
- Renovación de JWT de acceso, rotación de credenciales de renovación y cierre
  de sesión.
- Cambios coordinados en `ez-nihongo-web/` y `ez-nihongo-platform/`.

## Requisitos funcionales

### REQ-01 — Opción explícita

El formulario de inicio de sesión debe mostrar «Recordarme» desmarcada por
defecto. El formulario de registro no debe mostrarla. La casilla nunca debe
alterar los requisitos de contraseña ni enviar una contraseña distinta de la
introducida en ese intento.

### REQ-02 — No persistir credenciales ni bearer tokens

El cliente no debe guardar la contraseña, el JWT de acceso ni el token de
renovación en cookies legibles por JavaScript, `localStorage`, IndexedDB,
`sessionStorage`, URL, logs ni estado persistido. La contraseña sólo se envía
por HTTPS al endpoint de autenticación y se descarta al finalizar el flujo.

### REQ-03 — Inicio de sesión no persistente

Si «Recordarme» está desmarcada, la API debe emitir únicamente un JWT de acceso
de vida corta en el cuerpo de la respuesta y no crear una sesión de renovación.
El cliente debe mantener el JWT sólo en memoria; una recarga no debe restaurar
la sesión.

### REQ-04 — Inicio de sesión persistente

Si «Recordarme» está marcada y las credenciales son válidas, la API debe:

1. emitir un JWT de acceso de vida corta;
2. crear una sesión persistente revocable con vencimiento absoluto máximo de
   30 días desde ese inicio de sesión; y
3. entregar el token de renovación únicamente mediante una cookie `HttpOnly`.

El vencimiento debe ser absoluto: las renovaciones no prolongan la fecha límite
original más allá de esos 30 días. Una sesión nueva requiere volver a validar la
contraseña.

### REQ-05 — Renovación y arranque de la aplicación

Al iniciar la SPA, el cliente debe solicitar una renovación usando la cookie
HttpOnly. Si la sesión sigue vigente, la API debe rotar el token de renovación y
devolver un nuevo JWT de acceso e identidad; el cliente debe mantener ambos
datos de autenticación exclusivamente en memoria. Si la sesión no es válida,
está vencida o revocada, la aplicación debe continuar como anónima y la API debe
expirar la cookie.

El cliente debe impedir peticiones autenticadas y decisiones de navegación
protegida hasta completar la restauración inicial. Las peticiones simultáneas
que requieran renovación deben compartir una única operación en curso. Las
distintas pestañas del mismo origen también deben coordinar la renovación para
no presentar en paralelo el mismo token rotatorio.

### REQ-06 — Rotación y detección de reutilización

Cada renovación válida debe invalidar atómicamente el token presentado y emitir
uno nuevo para la misma familia de sesión, conservando el vencimiento absoluto.
El almacenamiento de la API sólo debe conservar un hash criptográfico del
token opaco. La reutilización de un token ya rotado debe revocar la familia de
sesión afectada y requerir un nuevo inicio de sesión.

### REQ-07 — Cierre de sesión

El cierre de sesión debe revocar la sesión persistente asociada a la cookie,
expirar la cookie y limpiar inmediatamente el JWT y la identidad de la memoria
del cliente. Debe tener resultado idempotente: incluso si la cookie no existe,
ha vencido o ya fue revocada, el cliente termina desconectado.

### REQ-08 — Protección CSRF de endpoints con cookie

Los endpoints que autentican usando la cookie de renovación deben rechazar
peticiones de origen no permitido. Deben exigir origen de aplicación
configurado, método y tipo de contenido esperados, y una cabecera personalizada
de la aplicación. La cookie debe usar `SameSite=Strict` cuando el despliegue
permita el flujo same-site. No se debe habilitar CORS con credenciales y origen
comodín.

### REQ-09 — Aislamiento y revocación

Una sesión persistente debe estar asociada al usuario autenticado en servidor;
ningún identificador de usuario recibido del cliente puede determinar el
propietario. Una sesión revocada, vencida, desconocida o perteneciente a una
cuenta eliminada no puede emitir JWT. La revocación de una sesión no debe
revocar las sesiones de otros dispositivos.

### REQ-10 — Registro de cuentas

El registro de cuenta no debe crear una sesión persistente ni establecer la
cookie de renovación. Si el registro inicia una sesión con el comportamiento
actual, el JWT de acceso resultante sólo se mantiene en memoria y se pierde al
recargar.

## Requisitos de seguridad y operación

### SEC-01 — Atributos de cookie

La cookie de renovación debe ser host-only (sin atributo `Domain`), `HttpOnly`,
`Secure` en todos los entornos expuestos por HTTPS, `SameSite=Strict`, de ruta
restringida al área de autenticación y con `Max-Age` no superior al tiempo
restante de la sesión. El borrado debe usar el mismo nombre, ruta y ámbito.
Ningún entorno de producción puede degradar `Secure` por una configuración
ausente. El modo local HTTP puede usar una excepción explícita sólo para
desarrollo.

### SEC-02 — Tokens y almacenamiento

El token de renovación debe generarse con un generador criptográficamente seguro,
ser opaco y tener al menos 256 bits de entropía. Sólo su hash SHA-256 o un hash
HMAC con una clave de servidor debe persistirse en la base de datos. Nunca se
debe guardar la contraseña en claro, reversible o cifrada por el cliente.

### SEC-03 — Transporte y exposición

La autenticación y renovación sólo pueden usarse sobre HTTPS fuera del entorno
local de desarrollo. La API y el cliente no deben incluir contraseñas, JWT ni
tokens de renovación en mensajes de error, telemetría, logs o datos de analítica.

### SEC-04 — Persistencia duradera

Las sesiones deben sobrevivir a reinicios de la API y a despliegues. La
persistencia debe usar la base de datos existente y una migración aditiva. La
falla o ausencia de la base de datos no debe provocar una sesión persistente
local alternativa.

## Criterios de aceptación

1. La casilla aparece desmarcada sólo en el inicio de sesión y no aparece en el
   registro.
2. Con la casilla desmarcada, el login correcto no crea cookie de renovación ni
   fila/sesión persistente; tras recargar, el usuario queda anónimo.
3. Con la casilla marcada, la respuesta establece una cookie HttpOnly y el
   acceso autenticado se restaura después de recargar, sin solicitar de nuevo la
   contraseña.
4. La cookie tiene vencimiento máximo de 30 días y sucesivas renovaciones no
   superan el vencimiento absoluto original.
5. No hay contraseña ni JWT persistente en `localStorage`, `sessionStorage`,
   cookies legibles por JavaScript, IndexedDB ni logs.
6. La rotación invalida el token anterior; reutilizarlo revoca su familia.
7. Logout revoca la sesión de ese navegador, elimina la cookie y limpia el
   estado local; una sesión de otro navegador permanece válida.
8. Cookie ausente, alterada, revocada o vencida produce estado anónimo y cookie
   expirada, sin errores no controlados.
9. Un origen no permitido o una petición sin la cabecera CSRF requerida no puede
   renovar ni cerrar una sesión usando la cookie.
10. El registro y los logins no persistentes no emiten cookie de renovación.
11. La migración conserva los datos Identity existentes y la API valida
    integridad y vencimiento en el servidor.
12. La suite cubre rotación concurrente, reutilización, revocación, vencimiento,
    CSRF, flags de cookie y restauración cliente; build, type-check y pruebas de
    los dos repositorios pasan.

## Fuera de alcance

- Guardar o autocompletar la contraseña.
- Sesiones persistentes superiores a 30 días o duración configurable por el
  usuario.
- Administración de dispositivos/sesiones desde una pantalla.
- Revocar todas las sesiones por cambio de contraseña, recuperación de cuenta,
  MFA o gestión de permisos; deberán añadirse como requisitos propios si se
  incorporan esos flujos.
- Cambiar el mecanismo actual de inicio de sesión por proveedores externos.
