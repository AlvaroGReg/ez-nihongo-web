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

Estado: **En curso**. El bloqueo del retorno tras autenticación está corregido y
verificado con el router de la aplicación. Falta completar la aceptación conjunta
contra navegador y API real.

- [ ] Probar cuenta A/B, alta oficial, alta propia, búsqueda y eliminación en el
       diccionario contra API real; verificar que los ejercicios mantienen sus
       fuentes y comportamiento actuales.
- [ ] Revisar todos los diffs/status de web y plataforma; comprobar OpenAPI y
      migración; completar trazabilidad y documentar limitaciones pendientes.

Ejecución parcial (2026-11-10): se abrió `/known-content` sin sesión y la UI
redirigió al formulario de autenticación. La API temporal real aceptó registro
(`201`) y login (`200`), pero el navegador permaneció en la ruta de autenticación;
no se alcanzó la lista privada. OpenAPI se consultó y se compararon las cinco
rutas conocidas con bearer. Los escenarios privados y de ejercicios quedan sin
verificar, así que la fase sigue pendiente y no se acepta.

Seguimiento (2026-11-10): causa reproducida y corregida en el guard web; el
retorno exitoso a `/known-content` y conservación del bearer pasan en una prueba
con el router de producción. Type-check, suite completa (27 suites/104 pruebas) y
build pasan. No se hizo una nueva aceptación en navegador ni CRUD contra API;
Playwright no está instalado. La Fase 4 y su aceptación conjunta siguen
pendientes hasta verificar cuenta A/B, altas/bajas e independencia de ejercicios.

Intento de aceptación segura (2026-11-10): se confirmó que `playwright-cli` y
Playwright local no están disponibles; Edge está instalado, pero no se inició una
sesión de navegador porque el único stack activo sirve una imagen web preexistente
y conecta la API a `ez-nihongo-project_postgres-data`, volumen persistente sin
dataset de prueba autorizado. No se registraron cuentas ni se mutaron datos. La
API activa respondió `/health`; OpenAPI mostró GET, los tres POST y DELETE bajo
`/api/v1/me/known-content`, todos con bearer. Escenarios 1–7: **sin ejecutar**
contra el código web actual y API/datos seguros; no son aprobados ni fallidos.
Para continuar hace falta una instancia web actual y API conectada a PostgreSQL
descartable, además de automatización o inspección real del navegador disponible.
Fase 4 permanece en curso.
