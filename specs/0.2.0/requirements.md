# Especificación de requisitos — 0.2.0

## Objetivo

Preparar la aplicación actual para soportar varios idiomas, tipos de contenido
y tipos de ejercicio sin activar todavía backend, login, CMS ni pagos.

## Alcance

### US-01 — Seleccionar idioma

Como estudiante, quiero elegir inglés o español para utilizar la interfaz en
mi idioma.

**REQ-01:** La interfaz debe ofrecer `en` y `es`, con inglés como fallback para
una clave no traducida.

**REQ-02:** La selección debe persistir localmente con una clave versionada y
aplicarse tras recargar la aplicación.

**REQ-03:** Cambiar de idioma no debe modificar preguntas, respuestas,
identificadores, score ni sesiones guardadas.

### US-02 — Separar contenido y ejercicio

Como desarrollador, quiero representar el contenido y el ejercicio por
separado para añadir kana, kanji, gramática y traducción sin duplicar el flujo.

**REQ-04:** El dominio debe distinguir como mínimo `ContentItem`,
`ExerciseDefinition`, `AttemptEvent`, `ProgressSnapshot` y `TestSession`.

**REQ-05:** Cada contenido debe tener un identificador estable independiente de
su texto traducido y de la posición que ocupe en una respuesta externa.

**REQ-06:** El modelo debe admitir como tipos de contenido `kana`, `kanji`,
`vocabulary`, `grammar` y `sentence`. 0.2.0 ejecuta vocabulario, kana y
ejercicios de kanji basados en palabras del catálogo JLPT.

**REQ-07:** El modelo debe admitir ejercicios de lectura, significado y
escritura. 0.2.0 ejecuta lectura y significado de kanji por selección múltiple,
además de los ejercicios de romanji y escritura existentes.

### US-03 — Gestionar la sesión actual

Como estudiante, quiero que las sesiones guardadas pertenezcan al formato
actual de la aplicación para evitar recuperar datos obsoletos.

**REQ-08:** La aplicación debe usar un formato versionado para la sesión activa
y eliminar las sesiones de formatos anteriores sin intentar migrarlas.

**REQ-09:** Un contenido externo con `meaning` único debe normalizarse como
significado inglés sin exigir que la API ya sea multilingüe.

**REQ-10:** Los errores de proveedor deben seguir siendo recuperables mediante
el flujo existente de retry/back.

### US-04 — Definir límites futuros

Como producto, quiero tener un punto de integración para demo, cuenta gratuita
y premium sin aplicar todavía autenticación ni cobros.

**REQ-11:** El dominio debe representar plan o entitlement sin confiar en un
estado premium enviado por el cliente.

**REQ-12:** La demo y los límites de uso deben poder configurarse fuera de la
lógica de validación del ejercicio.

**REQ-13:** Si el estudiante está autenticado, los ejercicios de vocabulario
JLPT deben cargar preguntas e identidades de contenido desde la API de
plataforma. Un error de API debe mostrarse como error recuperable y no debe
provocar un fallback al catálogo local. Los usuarios no autenticados pueden
seguir usando el catálogo local.

### US-05 — Practicar kanji JLPT sin conexión

Como estudiante, quiero practicar la lectura y el significado de kanji N1–N5
sin necesitar una cuenta ni conexión con la API.

**REQ-14:** La configuración debe permitir elegir cualquier combinación de
N1–N5 para kanji y cargar los caracteres desde los archivos locales de su nivel.
No se incluye la categoría `extra`.

**REQ-15:** Cada ejercicio de lectura o significado debe ofrecer cuatro
respuestas de selección múltiple distintas, incluida exactamente una opción
con el valor correcto. Las opciones se generan aleatoriamente a partir de los
niveles seleccionados; valores de respuesta duplicados no se presentan como
opciones distintas.

**REQ-16:** En el ejercicio de significado, la lectura permanece oculta hasta
que el estudiante active una pista durante la pregunta. No se revela
automáticamente después de responder.

**REQ-17:** Los distractores deben priorizar respuestas elegidas
incorrectamente antes en la sesión actual. No se reutilizan errores de sesiones
anteriores.

**REQ-18:** La sesión activa debe guardar las opciones de cada pregunta para
mantenerlas al reanudarla; al avanzar a una pregunta, sus opciones pueden
incorporar errores previos de esa misma sesión.

**REQ-19:** Al seleccionar N1, N2 o N3, la configuración debe avisar que sus
significados no están traducidos al español y que se mostrarán en inglés. Para
N4 y N5 se utilizarán las traducciones españolas disponibles.

## Fuera de alcance

- Supabase/Auth, CMS, Stripe y webhooks.
- Persistencia remota o sincronización entre dispositivos.
- Catálogo completo de kana, kanji o gramática.
- Información de trazos, orden de escritura, radicales o componentes de kanji.
- SRS, cola de repasos y analítica de usuario.
- IA, comunidad, móvil y modo offline completo de la aplicación (shell y
  recursos disponibles sin haber cargado previamente el cliente).
- Cambios visuales importantes no necesarios para seleccionar idioma.

## Escenarios verificables

```gherkin
Scenario: idioma español persistente
  Given the application is using English
  When the user selects Spanish
  And reloads the page
  Then the interface is displayed in Spanish
  And the selected locale remains Spanish
```

```gherkin
Scenario: fallback de traducción
  Given a UI key has no Spanish translation
  When the locale is Spanish
  Then the English translation is displayed
  And the application does not render the key identifier
```

```gherkin
Scenario: idioma no altera una sesión
  Given an active vocabulary session
  When the user changes the locale
  Then the current content and expected answer remain unchanged
  And only displayable text changes
```

```gherkin
Scenario: sesión heredada descartada
  Given a session from an older storage format exists in localStorage
  When the application starts version 0.2.0
  Then the old session is deleted
  And the resume dialog is not shown for that session
```

```gherkin
Scenario: proveedor con significado inglés
  Given an external word with a single meaning string
  When the adapter normalizes it
  Then the word has a stable local content key
  And its meaning is available as English
  And no Spanish value is fabricated at runtime
```

```gherkin
Scenario: ejercicio de vocabulario con sesión autenticada
  Given el estudiante tiene una sesión autenticada
  When inicia un ejercicio de vocabulario JLPT
  Then las preguntas y sus identificadores estables se cargan desde la API
  And las peticiones incluyen la credencial de la sesión
  And un error de API no carga preguntas del catálogo local
```
