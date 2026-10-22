# Trazabilidad — progreso de vocabulario

| Requisito | Implementación prevista | Verificación |
| --- | --- | --- |
| REQ-01, REQ-03 | Endpoint autorizado y `UserId` derivado del principal | Integración: anónimo 401 y aislamiento de propietarios |
| REQ-02 | `CreatedAt` asignado por `TimeProvider` en API | Integración: fecha reciente y UTC |
| REQ-04 | GET paginado filtrado por usuario | Integración: orden, paginación y datos propios |
| REQ-05 | Servicio web llamado tras persistencia local; fallo sólo a consola | Unit tests del store/servicio |
| REQ-06 | Índice único por usuario y `EventId` | Integración: POST repetido no duplica |
| Alcance vocabulario | Guardar sólo `contentType === 'vocabulary'` con sesión autenticada | Unit tests: anónimo, kana, kanji y vocabulario |
