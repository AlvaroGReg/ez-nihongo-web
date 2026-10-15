# Trazabilidad — 0.2.0

| Requisito | Implementación prevista | Verificación |
| --- | --- | --- |
| REQ-01 | `src/i18n/index.ts`, diccionarios `en`/`es` y `App.vue` | `i18n.spec.ts` y render de `HomeView` |
| REQ-02 | `storage.ts`, clave `ez-nihongo:locale:v1` | `i18n.spec.ts` con persistencia |
| REQ-03 | Locale solo para presentación; sesión en `testSession.ts` | `i18n.spec.ts` y contratos sin traducciones renderizadas |
| REQ-04 | `types/domain.ts`, `content.ts` y eventos del store | `content.spec.ts`, `testSession.spec.ts` y type-check |
| REQ-05 | `contentId` de la API para usuarios autenticados; `createVocabularyContentId` para contenido local | `content.spec.ts` y `vocabulary.spec.ts` |
| REQ-06 | Unión `ContentType` en `types/domain.ts` | Type-check y `content.spec.ts` |
| REQ-07 | Unión `ExerciseType` y `createReadingExercise` | `content.spec.ts` |
| REQ-08 | `storage.ts`, clave `active-session:v2` y limpieza de `v1` | `testSession.spec.ts` prueba sesiones heredadas, JSON corrupto y formato desconocido |
| REQ-09 | `loadQuestions` selecciona el locale y recurre al significado inglés | `vocabulary.spec.ts` |
| REQ-10 | `ContentProvider`, `VocabularyContentError` y flujo existente | `vocabulary.spec.ts`, `testSession.spec.ts` y HomeView |
| REQ-11 | `types/domain.ts` y `entitlements.ts` | `entitlements.spec.ts`, sin autoridad de seguridad |
| REQ-12 | `PLAN_DEFINITIONS`, separada de validación del test | `entitlements.spec.ts` |
| REQ-13 | `vocabulary.ts` selecciona API autenticada o catálogo local anónimo; token Bearer y `contentId` del backend | `vocabulary.spec.ts` verifica API autenticada; `testSession.spec.ts` verifica fuente local anónima |
| Compatibilidad actual | Vistas y store actuales | `npm run type-check`, `npm run test:unit -- --run`, `npm run build` |

## Criterio de cierre

0.2.0 se considera completa cuando todos los requisitos tienen una prueba o
verificación documentada, las sesiones heredadas se descartan de forma segura
y no se ha introducido ninguna dependencia obligatoria de backend,
autenticación o pagos.
