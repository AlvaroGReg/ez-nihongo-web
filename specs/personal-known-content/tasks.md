# Tareas — Lista personal de contenido conocido (web)

## Reglas para sesiones de implementación

- Cada sesión comienza leyendo proposal, requirements, design y traceability de
  esta carpeta y de la plataforma. Revisar `git status`/rama en ambos repos.
- Trabajar sólo en los archivos asignados; no inventar ni cambiar el contrato.
- Antes de consumir un endpoint, confirmar que plataforma lo implementó y que
  OpenAPI coincide con el diseño aprobado.
- Validar y reportar comandos ejecutados; actualizar trazabilidad al completar
  criterios verificables.

## Fase 1 — Cierre SDD (sesión de coordinación, sin código)

- [x] Sincronizar DTO/rutas/límites y reglas exactas de normalización con la
      plataforma.
- [x] Cerrar romaji obligatorio, kanji de un carácter y límites aceptados.
- [x] Reflejar esos acuerdos junto con el manejo de sesión anónima y `all`
      predeterminado en el contrato compartido.
- [x] Confirmar reglas de niveles de listas mixtas y pool de distractores para
      kanji.
- [x] Definir borrado definitivo de custom y respuesta `alreadyPresent` en POST
      de catálogo.
- [x] Definir comportamiento de `all` anónimo/autenticado y niveles vacíos.
- [x] Congelar contrato, actualizar traceability y registrar cualquier decisión
      futura como fuera de alcance.

## Fase 2 — Cliente API y estado (sesión web 1; después de contrato)

- [x] Implementar `services/knownContent.ts` con DTOs, validación de respuestas,
      autorización y paginación.
- [x] Añadir estado/store con carga, error, limpieza al logout e invalidación tras
      mutaciones.
- [x] Añadir pruebas de servicio para headers, payloads, errores y validación.
- [x] Validar: `npm run type-check` y tests unitarios relacionados.

## Fase 3 — Lista y alta (sesión web 2)

- [x] Añadir ruta, enlace de navegación y protección/login-return.
- [x] Implementar listado, tabs, filtros, búsqueda, conteos, estados vacíos/error,
      y quitar elemento.
- [x] Implementar flujo Añadir: búsqueda de catálogo, alta de referencia y
      formularios custom de vocabulario/kanji con validación y duplicados.
- [x] Añadir traducciones ES/EN y pruebas de componentes.
- [x] Validar: type-check, unit tests y build web.

## Fase 4 — Filtro setup/URL/config (sesión web 3)

- [ ] Añadir selección all/known/not-known a ejercicios vocabulario/kanji, no
      kana; sincronizar query y valores inválidos/default all.
- [ ] Cargar items de usuario y computar objetivos con dedupe, niveles y custom.
- [ ] Indicar cantidad disponible; prevenir inicio insuficiente sin relajar
      filtro.
- [ ] Persistir filtro en TestConfig/sesión y mantener compatibilidad de sesiones
      legacy; probar retorno a login requerido.
- [ ] Añadir pruebas unitarias de selección y reglas límite.
- [ ] Probar niveles vacíos (`levels=none`) para `known`, `all` y `not-known`, y
      fallback de rutas legacy sin query al nivel N5.

## Fase 5 — Generación de preguntas e integración (sesión web 4)

- [ ] Adaptar proveedores para mapear vocabulario/kanji propios y oficiales a
      preguntas con IDs no colisionantes.
- [ ] Mantener pool de objetivos separado del pool de distractores para kanji.
- [ ] Verificar que los objetivos respetan el filtro y que respuestas/lista no
      se alteran.
- [ ] Probar sesiones reanudadas, catálogo mixto, custom, filtro vacío/insuficiente
      y errores API.
- [ ] Ejecutar `npm run type-check`, `npm run test:unit -- --run` y
      `npm run build`.

## Fase 6 — Aceptación conjunta

- [ ] Probar cuenta A/B, alta oficial, alta propia, eliminación y filtros para
      vocabulario/kanji contra API real.
- [ ] Revisar todos los diffs/status de web y plataforma; comprobar OpenAPI y
      migración; completar trazabilidad y documentar limitaciones pendientes.
