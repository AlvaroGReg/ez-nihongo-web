# Trazabilidad — Lista personal de contenido conocido (web)

| Requisito | Diseño | Verificación prevista |
| --- | --- | --- |
| REQ-01 Login obligatorio | Ruta protegida, login-return, API bearer | servicio: bearer; ruta pendiente de prueba UI |
| REQ-02 Lista única | Vista con tabs/filtros | lista, estados, búsqueda y filtro nivel; implementado |
| REQ-03 Alta de catálogo/propio | Diálogo, búsqueda local, DTO tipados y flag `alreadyPresent` | formularios propios y validación probados; escenarios catálogo/API pendientes |
| REQ-04 Quitar | Mutación API y actualización de estado | acción disponible; validación con API real pendiente |
| REQ-05 Uso exclusivo en diccionario | Vista autenticada independiente de ejercicios | ejercicios no consumen la lista personal |
| REQ-06 Estados accesibles | i18n, feedback y reintentos | carga/error/éxito en componentes |

Estado: Fases 1–3 completadas en implementación. `services/knownContent.ts`
valida DTO discriminados, bearer, status HTTP y paginación completa hasta 1000;
`stores/knownContent.ts` conserva estado en memoria, limpia al cambiar/cerrar sesión,
y refresca o invalida tras mutaciones. `src/__tests__/knownContent.spec.ts` verifica
headers, parámetros, paginación, payloads, errores, DTO inválido, logout y mutaciones:
5 pruebas de servicio aprobadas. La Fase 3 añade ruta autenticada con retorno al
login, navegación, lista de vocabulario/kanji, filtros de nivel y búsqueda, acción
de quitar, búsqueda local de catálogos y formularios propios con validación
temprana. Hay pruebas de componentes de guardado custom y validación de kanji.
`npm run type-check`, `npm run test:unit -- --run` (26 suites, 103 pruebas) y
`npm run build` pasan. Pruebas UI específicas de la ruta, alta oficial y DELETE,
y aceptación contra API real quedan pendientes de integración conjunta. No se ha
implementado integración entre diccionario personal y ejercicios; no forma parte
del alcance actual.

Verificación de punto de guardado (2026-10-30): se volvieron a ejecutar
`npm run type-check`, `npm run test:unit -- --run` (26 suites, 103 pruebas) y
`npm run build`; los tres comandos pasan. La aceptación conjunta contra API real
sigue pendiente. La integración con ejercicios queda fuera de alcance.
