# Web repository instructions

These instructions supplement the shared workspace guidance in `../AGENTS.md`.

## Project

- This repository is a Vue 3 single-page application built with TypeScript, Vite, and Vue Router.
- Feature specifications live in `specs/<feature>/`, organized by feature rather than release version.
- Keep changes focused and follow the existing structure and patterns.

## CSS

- Use native CSS nesting for new or modified styles to group related rules and avoid repeating ancestor selectors.
- As a flexible guideline, keep nesting to three levels or fewer. A fourth level is acceptable when it reduces repetition or improves clarity.

## Workflow

- Install dependencies with `npm install` if they are missing.
- Use `npm run dev` to start the development server.
- Before handing off web changes, run the applicable checks:
  - `npm run type-check`
  - `npm run test:unit -- --run`
  - `npm run build`
  - Run `npm run lint` or `npm run format` only when needed; both may modify files.
- Review `git diff` and `git status` after editing.
