# Propuesta SDD — Lista personal de contenido conocido

## Estado

Plan para desarrollo coordinado con
[`ez-nihongo-platform/specs/personal-known-content/`](../../../ez-nihongo-platform/specs/personal-known-content/).
El contrato de servidor se define allí y quedó congelado en la Fase 1 SDD. Este
plan cubre el flujo de navegador, interfaz y uso en ejercicios.

## Decisiones de producto

- Inicio de sesión obligatorio para abrir/gestionar la lista.
- Una única lista personal «Contenido conocido», con vocabulario y kanji.
- Puede contener elementos de los catálogos existentes o elementos creados por el
  usuario.
- La lista es manual: se añaden/quitan elementos y los resultados no la cambian.
- Vocabulario y kanji ofrecen un filtro de ejercicio: todo, sólo conocidos o
  excluir conocidos.
- Sin modo offline/anónimo para esta característica.

## Flujos

### Añadir desde la lista

1. Usuario autenticado abre «Contenido conocido».
2. Pulsa «Añadir» y elige vocabulario o kanji.
3. Busca en el catálogo correspondiente; si encuentra una entrada, la añade
   desde el resultado con identidad de catálogo.
4. Si no encuentra lo que busca, selecciona «Crear contenido propio», completa y
   valida el formulario y lo añade a su lista.
5. La pantalla muestra origen (catálogo/propio), contenido y nivel JLPT sólo
   para catálogo. Permite quitarlo de la lista.

La búsqueda sirve también para comprobar previamente si el concepto ya está en
el catálogo. No se debe crear una entrada personalizada cuando el usuario decide
añadir el resultado oficial.

### Usar la lista en ejercicios

En la configuración de vocabulario y kanji se ofrece el filtro `all`, `known` o
`not-known`. `known` usa sólo pertenencias de lista, incluidas entradas propias;
`not-known` excluye las pertenencias y usa el catálogo restante. `all` incorpora
el catálogo dentro de los niveles seleccionados y las entradas custom propias, sin
duplicar referencias oficiales de la lista. En una sesión anónima, `all` conserva
el catálogo y comportamiento actuales. El filtro se guarda en la URL y se conserva
al reanudar una sesión.

El filtro no altera el nivel JLPT seleccionado. Las entradas propias no tienen
nivel, por lo que se incluyen en `known`/`all` independientemente de nivel; la UI
lo indica y no las etiqueta con un nivel oficial. Para `not-known`, el catálogo
continúa restringido por niveles elegidos.

Si el conjunto resultante es menor que el número solicitado, la web muestra el
número disponible y ofrece iniciar con esa cantidad, aunque sea menor que diez;
nunca completa en silencio con contenido excluido por el filtro. Si faltan distractores para un
ejercicio de kanji de cuatro opciones, el generador puede tomar distractores de
todo el catálogo, pero las preguntas correctas siguen respetando el filtro.

## Acceso y error

- Usuario anónimo que abre la lista o intenta añadir: solicitar inicio de sesión
  y volver al destino después de autenticar.
- Error al cargar/guardar/quitar: mostrar estado recuperable y permitir reintento;
  no presentar como guardado un cambio rechazado por API.
- Catálogo sin coincidencias: mostrar el acceso claro al formulario propio.
- Duplicado personalizado: mantener el formulario con mensaje y ofrecer la
  entrada coincidente ya guardada.

## Criterio de éxito

Desde la interfaz, una cuenta puede encontrar y guardar una entrada del catálogo
o crear una propia, volver a verla y obtener sesiones de vocabulario/kanji cuyos
objetivos se ajustan a `all`, `known` o `not-known`.
