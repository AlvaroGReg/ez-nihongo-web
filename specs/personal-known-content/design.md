# Diseño técnico — Lista personal de contenido conocido (web)

## Frontera de integración

La plataforma es fuente de verdad para listas, entradas propias y autorización.
El contrato y esquema están en
[`platform design`](../../../ez-nihongo-platform/specs/personal-known-content/design.md).
La web no persiste copias en localStorage ni crea IDs de catálogo. El token bearer
en memoria se usa para todas las llamadas.

## Interfaz y rutas propuestas

- Añadir ruta autenticada `/known-content`, enlazada
  desde navegación/cuenta.
- Crear vista de lista con tabs/filtros de vocabulario y kanji, búsqueda local
  sobre el resultado descargado, filtros JLPT para entradas oficiales, conteos,
  estado vacío/loading/error y acción quitar.
- «Añadir» abre un diálogo/vista con selección de tipo, campo de búsqueda y
  resultados de catálogo con acción «Añadir». Los catálogos locales ya
  empaquetados pueden indexarse en el cliente; el servidor vuelve a validar el
  ID al añadir. Si no hay resultado (o ninguno corresponde), el formulario de
  contenido propio recoge los campos acordados.
- En formulario de vocabulario: escritura (máximo 100 valores escalares), lectura
  kana (máximo 200), romaji (máximo 200) y significado (máximo 500); todos
  obligatorios.
- En formulario de kanji: un carácter, lista editable de lecturas y lista de
  significados (hasta 20 de cada uno, 200 caracteres por lectura y 500 por
  significado). La forma de entrada de arrays debe ser sencilla para móvil.
- Impedir crear más de 1000 entradas personales. La API es autoridad para límites
  y duplicados; la web valida para dar feedback temprano.
- La traducción del UI no transforma el significado privado. El campo se muestra
  como lo introdujo el usuario; el significado es un texto único sin idioma y no
  se traduce. Los significados de catálogo sí usan el locale UI y el fallback
  existente.

## Servicio y modelo cliente

- Crear `services/knownContent.ts` como frontera API con tipos discriminados por
  `contentType` y `source`; validar respuestas desconocidas antes de usarlas.
- Añadir store/reactividad compartida para `items`, `loading`, `error` y acciones;
  invalidar/recargar tras alta o borrado. Al cerrar sesión, limpiar el estado en
  memoria.
- Usar `GET /api/v1/me/known-content?type=&offset=&limit=&language=` (defaults:
  offset 0, limit 50, language en) y solicitar páginas de 200 items hasta
  completar `total` (máximo 1000). La lista paginada es
  también la fuente de datos para los filtros de ejercicio; no hay endpoint
  `exercise-items` separado.
- El locale UI viaja como `language=en|es` para resolver significados oficiales;
  el texto custom no se localiza.
- Validar el DTO discriminado `{id,contentType,source,catalogContentId,createdAt,
  content}` y mapear `content.reading` a `furigana` en el modelo local de ejercicios.
  No inferir integridad de datos de un `as` TypeScript.
- Al añadir catálogo, enviar `{ contentType, catalogContentId }` y `language`; nunca
  enviar datos editables del catálogo. La respuesta `200` es `{item, alreadyPresent}`;
  mostrar «Ya está en tu lista» cuando sea true, incluso si otra pestaña lo añadió.
  Al crear propio, usar los DTO custom definidos por plataforma. Alta custom
  devuelve `201`; DELETE devuelve `204`. Usar ID de lista retornado por servidor
  para elementos propios. Resolver Problem Details `409` por código estable.

## Integración con ejercicios

- Extender `TestConfig` con `knownContentFilter: 'all' | 'known' | 'not-known'`;
  valor omitido equivale a `all` para restaurar sesiones antiguas.
- Persistir el filtro en query string, usando `filter=known|not-known`; omitir
  `filter` en `all` para preservar URLs existentes.
- En el setup de vocabulario/kanji, solicitar el conjunto personal autenticado
  para `known` y `not-known`, y para `all` si hay sesión iniciada. Anónimo en
  `all` conserva el comportamiento actual de catálogo solamente. Si falla la
  carga autenticada, no iniciar ningún modo dependiente de la lista (`all`,
  `known`, `not-known`); mostrar reintento.
- La selección de niveles puede quedar vacía en `all` y `known`; se consideran
  sólo elementos propios custom. En `not-known`, niveles vacíos producen cero
  objetivos. En URL, `levels=none` representa explícitamente vacío; parámetro
  ausente conserva el default N5. Esta excepción permite no seleccionar ningún
  JLPT y practicar sólo contenido propio en `known` o `all`.
- `known`: objetivos = entradas personales del tipo; aplicar los niveles
  seleccionados sólo a entradas de catálogo y conservar custom sin nivel.
- `not-known`: objetivos = catálogo dentro de niveles menos los IDs del tipo en
  lista. Custom están en lista por definición y por ello se excluyen.
- `all`: objetivos = catálogo dentro de niveles más custom propios (sin nivel,
  siempre incluidos); no concatenar referencias oficiales de la lista de nuevo.
- Para vocabulario se adapta el proveedor de preguntas para combinar tipos
  normalizados. Para kanji, se adapta `toQuestion`/generación de opciones para
  mapear registros propios y oficiales al modelo de pregunta. IDs custom tienen
  namespace no colisionante (`custom:<uuid>`); IDs oficiales conservan sus
  prefijos actuales (`kanji:<id>` / ID de vocabulario).
- Distinguir conjunto de objetivos de conjunto de distractores. Las opciones
  múltiples de kanji respetan el filtro sólo para el objetivo/pregunta correcta;
  los distractores se pueden tomar del pool general del catálogo para conservar
  cuatro alternativas. Un elemento excluido puede aparecer como distractor, pero
  nunca como objetivo correcto. Contenido custom no se usa como distractor.
- Si quedan menos objetivos que los solicitados, avisar y ofrecer iniciar con la
  cantidad disponible incluso si es menor que 10. Con cero objetivos, no iniciar
  y explicar la causa: ofrecer añadir conocidos para `known`, elegir nivel o añadir
  custom para `all`, y elegir niveles o cambiar filtro para `not-known`. Nunca
  completar objetivos fuera del filtro.
- Al confirmar una sesión más corta, actualizar `questionCount` en `TestConfig`
  con el número real de preguntas para preservar invariantes de sesión/storage.
- No cambiar las respuestas/historial al editar la lista. El snapshot existente
  de `TestSession.questions` permite reanudar sin volver a aplicar filtro.

## Persistencia de filtro y compatibilidad

Actualizar validación de configuración de rutas y `storage.ts`: filtro válido y
default `all` en sesiones/resultados legacy. Sesiones activas guardan el valor
usado al generarlas; las preguntas guardadas prevalecen al restaurar. Sin bearer,
se bloquean modos `known` y `not-known` con retorno a login/setup autenticado; no
se sustituyen silenciosamente por `all`.

## Accesibilidad e i18n

Definir textos ES/EN para acciones, estado de origen, formulario, filtros,
errores y aviso de cantidad disponible. Diálogos con foco inicial, cierre
accesible, etiquetas asociadas y regiones de estado para resultados asíncronos.

## Verificación

- Unit tests: identidad discriminada, combinación/dedupe, filtro por tipo/ID y
  nivel, custom sin nivel, suficiencia y pool de distractores.
- Componentes: acceso, búsqueda/alta catálogo, formulario custom y estados
  error/loading/duplicado.
- Integración: revisar contrato OpenAPI de plataforma; ejecutar
  `npm run type-check`, `npm run test:unit -- --run` y `npm run build`.

## Decisiones de producto cerradas

- Romaji es obligatorio en vocabulario propio; kanji propio es un solo carácter.
- Se aceptan los límites acordados y la API rechaza coincidencias oficiales o
  entradas propias duplicadas, devolviendo el ID oficial cuando corresponda.
- La clave de duplicado recorta extremos, aplica NFKC y para lecturas convierte
  katakana U+30A1–U+30F6 a hiragana restando U+0060 y normaliza los signos de
  iteración; preserva espacios/puntuación interiores y diferencias de vocales.
  La forma mostrada conserva texto recortado en NFC.
- Los niveles JLPT restringen entradas oficiales en `known` y `all`; custom entra
  siempre en `known` y `all`, y no entra en `not-known`.
- Niveles vacíos son válidos en `known`/`all` y significan custom propio solamente;
  en `not-known` no hay objetivos. El parámetro omitido conserva el default N5.
- `all` anónimo usa catálogo solamente; `all` autenticado carga también custom y
  no inicia si no puede recuperar la lista.
- Si no hay suficientes objetivos, se ofrece iniciar con menos preguntas; con
  cero se bloquea el inicio y se guía a añadir elementos.
- Quitar custom la borra definitivamente; quitar una entrada de catálogo elimina
  sólo la pertenencia.
- POST catálogo devuelve `alreadyPresent` para diferenciar alta nueva y repetida
  de forma autoritativa.
- Significados propios son un texto literal sin idioma.
- La ruta de interfaz es `/known-content`; filtro se mantiene como `filter` en
  URL y omite el parámetro para `all`.
