# Requisitos — Lista personal de contenido conocido (web)

## Propiedad de especificaciones

La plataforma posee contratos HTTP y persistencia en
[`ez-nihongo-platform/specs/personal-known-content/`](../../../ez-nihongo-platform/specs/personal-known-content/).
Este documento posee experiencia de navegador, configuración de ejercicios y
integración. Ambas carpetas se deben leer antes de cada fase de implementación.

## Requisitos funcionales

### REQ-01 — Acceso autenticado

La lista y sus mutaciones requieren iniciar sesión. Un usuario anónimo debe
recibir una invitación a autenticarse y regresar al destino después del login; no
se almacena un duplicado local como sustituto de la API.

### REQ-02 — Una lista única

La UI expone una lista por cuenta llamada «Contenido conocido», con filtro por
tipo y nivel (cuando hay nivel de catálogo), búsqueda y estado vacío útil. No
permite crear listas adicionales.

### REQ-03 — Añadir desde catálogo o crear propio

Desde la lista, un botón «Añadir» abre un flujo con tipo y búsqueda del catálogo
existente. El usuario puede añadir una coincidencia existente o, si no encuentra
la entrada adecuada, crear vocabulario propio (escritura, lectura kana, romaji,
significado) o kanji propio (un carácter, lecturas kana, significados), respetando
los límites de longitud y cantidad definidos en el diseño técnico. Se presenta
validación, confirmación de guardado y control de duplicados.

### REQ-04 — Quitar

Cada fila puede quitarse de la lista con resultado confirmado. La UI distingue
origen oficial y propio; sólo las entradas de catálogo muestran nivel JLPT.
Quitar una entrada propia la elimina definitivamente; quitar una entrada de
catálogo conserva el elemento en el catálogo global.

### REQ-05 — Filtro de ejercicio

Las configuraciones de vocabulario y kanji exponen `all`, `known` y `not-known`.
El modo `known` pregunta sobre elementos de la lista; `not-known` los excluye;
`all` usa el catálogo seleccionado por niveles y contenido propio. El filtro no
se aplica a kana. Para una persona anónima, `all` conserva los ejercicios actuales
del catálogo sin contenido propio. Una cuenta autenticada carga su lista también
en `all` para incorporar entradas custom; si falla esa carga no empieza el
ejercicio y se ofrece reintentar.

El filtrado debe operar sobre la identidad de catálogo estable (tipo + ID), no
sobre el texto traducido. Los niveles seleccionados limitan entradas de catálogo
en `known` y `all`; las entradas propias, sin nivel, se incluyen en ambos. Las
propias pertenecen a la lista y no aparecen en `not-known`.
Se permiten niveles vacíos en `known` y `all`: sólo entran entradas propias
custom. En `not-known`, niveles vacíos dan cero objetivos. La URL representa ese
estado mediante `levels=none`; la ausencia de `levels` conserva N5.

### REQ-06 — Cantidad disponible

Antes de iniciar, la UI valida que existen suficientes objetivos según filtro,
nivel y número solicitado. Si no, indica cantidad disponible y ofrece reducir
el número de preguntas; no relaja el filtro ni mezcla contenido excluido sin
consentimiento. Se permite iniciar con cualquier cantidad positiva disponible,
incluyendo menos de 10. Si hay cero objetivos, el inicio queda deshabilitado y se
ofrece una acción apropiada: añadir conocidos para `known`, elegir nivel o añadir
contenido para `all`, y seleccionar niveles/cambiar filtro para `not-known`.
Para kanji, el filtro aplica al objetivo/pregunta correcta; los distractores
pueden venir del pool general del catálogo, pero nunca convierten un elemento
excluido en objetivo correcto. El contenido propio no se usa como distractor.

### REQ-07 — Persistencia y sesión

La lista se consulta y modifica a través de los endpoints autenticados de
plataforma. El filtro forma parte de la configuración de ejercicio, se codifica
en la URL y se conserva al restaurar sesión. La sesión guarda una instantánea de
las preguntas ya generadas; cambios posteriores de lista no reescriben una sesión
en curso.

### REQ-08 — Estados de interfaz

La UI comunica carga, error, vacío, éxito, catálogo sin coincidencias, duplicado,
sesión requerida y lista insuficiente. Una operación fallida no produce
confirmación de éxito ni bloquea navegación global.

## Criterios de aceptación

1. Anónimo no puede consultar/gestionar lista ni generar ejercicios `known` o
   `not-known`; se solicita autenticación. Sí puede usar `all` con el catálogo
   actual, sin contenido propio.
2. Se puede añadir/quitar un ítem oficial desde resultados de catálogo y se
   muestra su nivel cuando aplica.
3. Se puede crear, mostrar, quitar y practicar vocabulario y kanji propios; al
   quitarlos se borran definitivamente.
4. Duplicados y errores API son estados explícitos y no crean elementos fantasma.
   Si la API detecta un registro oficial equivalente, la UI ofrece añadir ese ID
   del catálogo en vez de repetir la entrada como propia.
   La respuesta de alta oficial informa `alreadyPresent`, de modo que la UI
   diferencia alta nueva de una entrada previamente guardada.
5. `known`, `not-known` y `all` producen el conjunto esperado, sin colisión entre
   tipos ni IDs oficiales y personalizados.
6. Cuando no hay suficientes objetivos, se comunica disponibilidad y no se
   inicia una sesión alterada silenciosamente; se puede iniciar con menos de 10
   si hay al menos un objetivo y con cero no se inicia.
7. El filtro persiste en URL/sesión; una sesión restaurada usa sus preguntas
   originales.
8. En `all` autenticado se cargan elementos propios; si falla la API se ofrece
   reintentar. `all` anónimo sigue usando sólo el catálogo.
9. Pruebas unitarias cubren filtros/IDs/conjuntos insuficientes y pruebas de UI
   cubren acceso autenticado, alta desde catálogo, formulario propio y errores.

## Fuera de alcance

- Marcar conocido por haber acertado, SRS, revisión por calendario o estadísticas.
- Más listas, etiquetas, importación masiva, sync offline o edición de contenido
  propio ya creado.
- Cambios en ejercicios de kana.
