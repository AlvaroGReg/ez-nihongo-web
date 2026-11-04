# Propuesta SDD — Lista personal de contenido conocido

## Estado

Plan para desarrollo coordinado con
[`ez-nihongo-platform/specs/personal-known-content/`](../../../ez-nihongo-platform/specs/personal-known-content/).
El contrato de servidor se define allí. Este plan cubre la gestión de contenido
personal desde la interfaz de diccionario.

## Decisiones de producto

- Inicio de sesión obligatorio para abrir/gestionar la lista.
- Una única lista personal «Contenido conocido», con vocabulario y kanji.
- Puede contener elementos de los catálogos existentes o elementos creados por el
  usuario.
- La lista es manual: se añaden/quitan elementos y los resultados no la cambian.
- Las entradas propias son contenido de diccionario personal y no se usan en
  ejercicios.
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

### Diccionario personal

La lista permite consultar, buscar, añadir y quitar entradas de los catálogos
compartidos o vocabulario/kanji propios. Las entradas propias no se incorporan a
la selección, generación ni persistencia de ejercicios. La integración con
ejercicios queda fuera de alcance.

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
o crear una entrada propia de vocabulario/kanji, volver a verla y gestionarla en
su diccionario personal. Las entradas propias no participan en ejercicios.
