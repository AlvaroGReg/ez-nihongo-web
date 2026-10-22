# Instrucciones locales de ez-nihongo

Estas reglas complementan el contexto común de `../AGENTS.md`.

## Proyecto

- Es una aplicación Vue 3 con Vite, TypeScript y Vue Router.
- Las especificaciones propias de este repositorio viven en `specs/<feature>/`, organizadas por funcionalidad y no por versión.
- Mantén los cambios pequeños y respeta la estructura existente.

## Estilos CSS

- Todo el CSS nuevo o modificado debe seguir el patrón de anidación CSS nativa
  para agrupar reglas relacionadas y evitar repetir selectores ancestros.
- Como guía flexible, procura no superar tres niveles de profundidad. Un cuarto
  nivel es aceptable, pero evítalo si no reduce repetición ni hace el código más
  conciso.

## Flujo de trabajo

- Instala dependencias con `npm install` si faltan.
- Usa `npm run dev` para desarrollo.
- Antes de entregar, ejecuta según corresponda:
  - `npm run type-check`
  - `npm run test:unit`
  - `npm run build`
  - `npm run lint` y `npm run format` solo si la tarea lo requiere; ambos
    pueden modificar archivos.
- Revisa siempre `git diff` y `git status` después de editar.
