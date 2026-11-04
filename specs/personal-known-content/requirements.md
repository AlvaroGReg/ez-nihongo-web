# Requisitos — Lista personal de contenido conocido (web)

## Propiedad de especificaciones

La plataforma posee contratos HTTP y persistencia en
[`ez-nihongo-platform/specs/personal-known-content/`](../../../ez-nihongo-platform/specs/personal-known-content/).
Este documento posee experiencia de navegador e integración del diccionario
personal. Ambas carpetas se deben leer antes de cada fase de implementación.

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

### REQ-05 — Uso exclusivo en diccionario

Las entradas propias se muestran y gestionan únicamente en la vista autenticada
del diccionario personal. No se usan para generar ejercicios ni alteran la
configuración, URL, sesión, respuestas o historial de ejercicios. Los ejercicios
continúan usando sus fuentes actuales.

### REQ-06 — Estados de interfaz

La UI comunica carga, error, vacío, éxito, catálogo sin coincidencias, duplicado y
sesión requerida. Una operación fallida no produce
sesión requerida y lista insuficiente. Una operación fallida no produce
confirmación de éxito ni bloquea navegación global.

## Criterios de aceptación

1. Anónimo no puede consultar ni gestionar el diccionario personal; se solicita
   autenticación.
2. Se puede añadir/quitar un ítem oficial desde resultados de catálogo y se
   muestra su nivel cuando aplica.
3. Se puede crear, mostrar y quitar vocabulario y kanji propios; al quitarlos se
   borran definitivamente. No aparecen en ejercicios.
4. Duplicados y errores API son estados explícitos y no crean elementos fantasma.
   Si la API detecta un registro oficial equivalente, la UI ofrece añadir ese ID
   del catálogo en vez de repetir la entrada como propia.
   La respuesta de alta oficial informa `alreadyPresent`, de modo que la UI
   diferencia alta nueva de una entrada previamente guardada.
5. La lista personal no participa en ejercicios; los ejercicios existentes
   mantienen su comportamiento y fuentes actuales.
6. Pruebas unitarias cubren acceso autenticado, alta desde catálogo, formulario
   propio, errores y ausencia de integración con ejercicios.

## Fuera de alcance

- Marcar conocido por haber acertado, SRS, revisión por calendario o estadísticas.
- Más listas, etiquetas, importación masiva, sync offline o edición de contenido
  propio ya creado.
- Cambios en ejercicios de kana.
