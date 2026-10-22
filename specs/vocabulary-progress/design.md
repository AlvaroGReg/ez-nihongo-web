# Diseño técnico — progreso de vocabulario

## Flujo

1. El store de sesión calcula y persiste localmente la respuesta como hasta
   ahora.
2. Si la sesión está autenticada y es de vocabulario, el cliente envía el evento
   a la API de plataforma con el bearer token.
3. El envío se ejecuta en segundo plano respecto al avance del ejercicio. Los
   fallos HTTP o de red se registran en consola sin reintento.
4. La API valida el token, deriva el usuario de los claims, valida que el
   `contentId` pertenezca al catálogo JLPT y persiste el evento en PostgreSQL.
5. La consulta del historial filtra siempre por el usuario autenticado y pagina
   los eventos ordenados por `createdAt` descendente.

## Contrato HTTP

### `POST /api/v1/progress/vocabulary/attempts`

Requiere bearer token.

```json
{
  "eventId": "event-...",
  "sessionId": "session-...",
  "contentId": "<id-estable-del-catalogo>",
  "exerciseType": "reading",
  "correct": true
}
```

La API no acepta `userId`, fecha ni respuesta libre. Devuelve `204 No Content`
para eventos nuevos y duplicados del mismo `eventId` y usuario.

### `GET /api/v1/progress/vocabulary/attempts?offset=0&limit=50`

Requiere bearer token. `offset` debe ser >= 0 y `limit` entre 1 y 200. Devuelve
`total`, `offset`, `limit` y los eventos del usuario autenticado, con fecha UTC.

## Persistencia

Agregar `VocabularyAttempt` a `PlatformIdentityDbContext`, con clave primaria,
FK a `Users` con borrado en cascada y los campos:

- `Id`: identidad interna.
- `UserId`: propietario obtenido del JWT.
- `EventId`: identificador estable de evento, único junto a `UserId`.
- `SessionId`: sesión local del ejercicio.
- `ContentId`: ID estable del catálogo JLPT.
- `ExerciseType`: tipo de ejercicio (`reading` en el alcance actual).
- `Correct`: resultado booleano.
- `CreatedAt`: `DateTimeOffset` en UTC, asignado por servidor.

Crear índice para recuperar por usuario y fecha descendente y una migración
aditiva de EF Core. No alterar las tablas Identity existentes.

## Organización

- `VocabularyProgress/`: entidad, contratos, servicio y Minimal API endpoints.
- Servicio scoped con interfaz para registrar eventos y consultar historial.
- La ruta se registra desde `Program.cs` y exige autorización en el grupo.
- Cliente: `services/vocabularyProgress.ts` como límite HTTP; `testSession`
  dispara el envío sólo para vocabulario autenticado.

## Verificación

- API: build y pruebas de integración con PostgreSQL disponibles, cubriendo
  autenticación requerida, registro, fecha de servidor, idempotencia, paginación
  y aislamiento entre usuarios.
- Web: pruebas unitarias de payload/token, errores no bloqueantes y exclusión de
  ejercicios anónimos/no vocabulario; type-check, unit tests y build.
