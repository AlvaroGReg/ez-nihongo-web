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
- [x] Reflejar esos acuerdos junto con el manejo de sesión anónima en el contrato
      compartido.
- [x] Confirmar que el contenido personal se limita al diccionario y no participa
      en ejercicios.
- [x] Definir borrado definitivo de custom y respuesta `alreadyPresent` en POST
      de catálogo.
- [x] Confirmar que niveles JLPT se usan sólo para filtrar el diccionario.
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

## Fase 4 — Aceptación conjunta

- [ ] Probar cuenta A/B, alta oficial, alta propia, búsqueda y eliminación en el
       diccionario contra API real; verificar que los ejercicios mantienen sus
       fuentes y comportamiento actuales.
- [ ] Revisar todos los diffs/status de web y plataforma; comprobar OpenAPI y
      migración; completar trazabilidad y documentar limitaciones pendientes.
