# Diseño técnico — Lista personal de contenido conocido (web)

## Frontera de integración

La plataforma es fuente de verdad para el diccionario personal, entradas propias y autorización.
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
  completar `total` (máximo 1000) para mostrar el diccionario personal.
- El locale UI viaja como `language=en|es` para resolver significados oficiales;
  el texto custom no se localiza.
- Validar el DTO discriminado `{id,contentType,source,catalogContentId,createdAt,
  content}`. No inferir integridad de datos de un `as` TypeScript.
- Al añadir catálogo, enviar `{ contentType, catalogContentId }` y `language`; nunca
  enviar datos editables del catálogo. La respuesta `200` es `{item, alreadyPresent}`;
  mostrar «Ya está en tu lista» cuando sea true, incluso si otra pestaña lo añadió.
  Al crear propio, usar los DTO custom definidos por plataforma. Alta custom
  devuelve `201`; DELETE devuelve `204`. Usar ID de lista retornado por servidor
  para elementos propios. Resolver Problem Details `409` por código estable.

## Frontera con ejercicios

El diccionario personal es independiente de los ejercicios. No se modifican
`TestConfig`, URLs, almacenamiento de sesiones, proveedores de preguntas ni
generadores. Las entradas propias no pueden ser objetivos ni distractores. Si se
decide integrarlas en ejercicios en el futuro, requerirá una especificación aparte.

## Accesibilidad e i18n

Definir textos ES/EN para acciones, estado de origen, formulario y
errores. Diálogos con foco inicial, cierre
accesible, etiquetas asociadas y regiones de estado para resultados asíncronos.

## Verificación

- Unit tests: validación de DTO, paginación y mutaciones de diccionario.
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
- El diccionario personal no afecta ejercicios, filtros, niveles ni sesiones.
- Quitar custom la borra definitivamente; quitar una entrada de catálogo elimina
  sólo la pertenencia.
- POST catálogo devuelve `alreadyPresent` para diferenciar alta nueva y repetida
  de forma autoritativa.
- Significados propios son un texto literal sin idioma.
- La ruta de interfaz es `/known-content`.
