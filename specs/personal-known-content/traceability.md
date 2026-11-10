# Trazabilidad — Lista personal de contenido conocido (web)

| Requisito | Diseño | Verificación prevista |
| --- | --- | --- |
| REQ-01 Login obligatorio | Ruta protegida, login-return, API bearer | servicio: bearer; flujo de retorno tras autenticación probado con router real de la app |
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

Aceptación conjunta parcial (2026-11-10): el navegador abrió `/known-content`
contra Vite y fue redirigido a autenticación. En la API real desechable, el
registro respondió `201` y el login `200`; aun así, la UI siguió en la pantalla de
autenticación y no mostró la lista. Se verificó en `/openapi/v1.json` que las
cinco operaciones de `/api/v1/me/known-content` están publicadas y protegidas
con bearer. No se llegaron a ejecutar desde la UI los casos de aislamiento A/B,
altas/bajas, idempotencia ni ejercicios. La fase no se acepta; investigar el
bloqueo del retorno desde autenticación y repetir la aceptación UI/API.

Seguimiento del retorno (2026-11-10): se reprodujo el fallo con el router real,
`AuthView` y un login exitoso simulado: la navegación volvía a `/auth` y el
bearer de memoria se borraba. El guard de `/known-content` restauraba siempre
sesión desde la cookie; un login sin «recordarme» no tiene cookie persistente.
Ahora sólo restaura cuando no hay bearer en memoria. La prueba
`src/__tests__/KnownContentAuthFlow.spec.ts` pasó y verifica destino, bearer
conservado y que no se solicita refresh; el mismo caso falló antes del cambio.
Validación web: `npm run type-check`, `npm run test:unit -- --run` (27 suites,
104 pruebas) y `npm run build` pasan. La API activa responde `/health` y su
OpenAPI publica las cinco operaciones protegidas. No se pudo repetir el flujo en
navegador/API real porque no hay Playwright instalado en el entorno; siguen
pendientes aceptación CRUD/aislamiento A/B y verificación de ejercicios. La fase
conjunta continúa pendiente.

Intento de aceptación segura (2026-11-10): se comprobó que `playwright-cli` y
Playwright local no están disponibles (no se instaló ninguna herramienta). Edge
está instalado, pero el stack accesible usa una imagen web preexistente y una API
conectada al volumen PostgreSQL persistente `ez-nihongo-project_postgres-data`;
no se usó porque no se autorizó mutar datos compartidos. `/health` respondió OK y
OpenAPI publicó las cinco rutas personales con bearer. Los siete escenarios de
aceptación en navegador quedan sin ejecutar; no hay resultados aprobados ni
fallidos que atribuir al producto. No se alteraron cuentas ni datos. Para cerrar
REQ-01–REQ-05 en integración hace falta un stack de prueba con web actual y base
PostgreSQL descartable, observado en navegador real. Fase 4 sigue en curso.
