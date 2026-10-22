# Trazabilidad — inicio de sesión persistente

Los requisitos y pruebas de implementación de servidor se detallan en
[`persistent-login/traceability.md`](../../../ez-nihongo-platform/specs/persistent-login/traceability.md).
Esta tabla mantiene la trazabilidad del cliente y de las verificaciones de
extremo a extremo.

| Requisito | Implementación prevista | Verificación |
| --- | --- | --- |
| REQ-01, REQ-10 | Casilla sólo en login; DTO de registro sin opción persistente | Unit web: visibilidad; integración API: registro no establece cookie |
| REQ-02, SEC-02, SEC-03 | JWT en memoria; token de renovación opaco; hash en base de datos; no almacenar/loguear secretos | Unit web: no hay Web Storage; integración: cookie HttpOnly y valor no persistido/logueado |
| REQ-03 | Login no persistente devuelve JWT corto sin sesión renovable | Integración API: sin `Set-Cookie` de renovación; web: reload anónimo |
| REQ-04, SEC-01 | Cookie protegida y sesión con expiración absoluta 30 días | Integración API: flags y expiración; pruebas con `TimeProvider` |
| REQ-05 | Endpoint refresh y restauración asíncrona antes de habilitar la app | Unit web: restauración exitosa/401; E2E: reload autenticado |
| REQ-06 | Token hash, rotación atómica y revocación de familia ante reutilización | Integración API: refresh único, concurrencia y reuse detection |
| REQ-07 | Endpoint logout y limpieza inmediata del store | Integración API: revocación/cookie; unit web: estado limpiado aunque falle red |
| REQ-08 | Cookie SameSite Strict, origen permitido y cabecera personalizada | Integración API: origen permitido/no permitido, ausencia de cabecera y cookie |
| REQ-09 | FK al usuario, filtro/validación por sesión en API | Integración API: usuario eliminado, sesión revocada y familia independiente |
| SEC-04 | Entidad EF y migración aditiva en base de datos actual | Prueba de migración y reinicio de API con sesión válida |
| Todos | Contrato coordinado API/web y proxy same-origin | Prueba integrada, type-check, tests y build web; build y tests API |
