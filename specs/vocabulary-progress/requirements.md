# Requisitos — progreso de vocabulario

## Objetivo

Registrar en la plataforma el resultado de cada respuesta de vocabulario de un
usuario autenticado, con fecha, y permitir consultar todos los intentos propios.

## Alcance

- Sólo ejercicios de vocabulario y usuarios con una sesión autenticada.
- La pregunta se identifica por `contentId` y tipo de ejercicio.
- En esta versión, vocabulario usa el tipo `reading`.
- Se guarda un evento por respuesta: identificador de evento, sesión, contenido,
  tipo de ejercicio, resultado correcto/incorrecto y fecha UTC del servidor.
- El evento remoto no almacena ni transmite la respuesta escrita por el usuario;
  el almacenamiento local existente de la sesión permanece sin cambios.
- La consulta devuelve todos los eventos de vocabulario del usuario autenticado,
  con paginación. Nunca permite consultar los eventos de otros usuarios.
- Si el registro remoto falla, el ejercicio continúa y el cliente escribe el
  error en el log; no reintenta ni muestra un error al usuario.
- Los ejercicios anónimos, kana y kanji no envían progreso remoto.

## Requisitos funcionales

### REQ-01 — Registrar intento

La API debe aceptar intentos de vocabulario sólo con credencial válida. El
usuario propietario se obtiene del principal autenticado, no del cuerpo de la
petición.

### REQ-02 — Fecha autoritativa

La API debe asignar `createdAt` en UTC al registrar cada intento. El cliente no
puede establecer ni modificar esa fecha.

### REQ-03 — Privacidad y datos mínimos

Cada evento remoto se asocia al usuario autenticado y no incluye el texto de
respuesta. La pareja `contentId` + `exerciseType` identifica la pregunta. El
formato local de sesión permanece sin cambios.

### REQ-04 — Consulta propia

La API debe devolver el historial de intentos de vocabulario del usuario
autenticado, ordenado del más reciente al más antiguo y paginado. La consulta
debe excluir los intentos de otros usuarios incluso si se conoce su ID.

### REQ-05 — Integración tolerante a errores

Al confirmar una respuesta de vocabulario, el cliente debe enviar el intento
sin bloquear el flujo de ejercicio. Ante error de red o HTTP, debe registrar el
fallo en consola y conservar el comportamiento local actual.

### REQ-06 — Idempotencia

El identificador de evento del cliente debe evitar crear dos registros para el
mismo evento y usuario si la petición se repite.

## Criterios de aceptación

1. Un usuario autenticado puede registrar un intento correcto o incorrecto y
   recuperarlo en su historial con fecha UTC.
2. Una petición sin token o con token inválido recibe `401`.
3. Un usuario sólo obtiene sus propios intentos en la consulta.
4. La respuesta guardada no contiene el texto que el usuario escribió.
5. Intentos duplicados con el mismo identificador no crean filas adicionales.
6. Los errores al guardar se registran en consola y no impiden avanzar ni
   finalizar el ejercicio.
7. Los ejercicios anónimos, kana y kanji no llaman al endpoint de progreso.
8. La consulta pagina, ordena por fecha descendente y permite recorrer todos
   los eventos propios.

## Fuera de alcance

- UI de estadísticas o presentación del historial.
- Progreso de kana, kanji, gramática u otros tipos de contenido.
- SRS, estados de aprendizaje, sincronización offline o cola de reintentos.
- Consulta administrativa o acceso a resultados de otros usuarios.
