# ez-nihongo

Responsive web app for practising Japanese. The interface is available in
English and Spanish, with light and dark themes.

## Project status

The current functional version is **0.9**. It includes:

- Japanese vocabulary exercises for JLPT levels N5 through N1. Choose one or
  more levels and configure a test of 10 to 100 questions.
- Hiragana and katakana practice, with selectable scripts, rows and kana types.
  Exercises include kana-to-romaji, romaji-to-kana and hiragana-katakana
  conversion.
- Answer checking and feedback during exercises, session progress, a final
  score and a review of mistakes.
- English and Spanish interface, a persistent language preference, and light
  and dark themes.
- A bundled JLPT vocabulary catalog, so vocabulary practice does not depend on
  the API.

## Roadmap to 1.0

- Kanji exercises. (maybe not available in demo, the .json weights 90mb).
- Logos and themes with own personality.

## GitHub Pages deployment

The `demo-github-pages-offline` branch is automatically built and deployed to
GitHub Pages on every push. The workflow can also be run manually from GitHub
Actions. For the first deployment, set the Pages source to **GitHub Actions**
under **Settings → Pages**.

Pages publishes a static build of the web client—the SPA and the JLPT catalog
bundled from `public/data/jlpt-vocabulary.json`—under the `/ez-nihongo-web/` base
path. The demo's vocabulary exercises work without connecting to the API. The
platform API is not deployed to GitHub Pages, so features that require a backend
are not part of this demo.

## Development

Install dependencies and start the local development server:

```sh
npm i
npm run dev
```

Useful checks:

```sh
npm run type-check
npm run test:unit -- --run
npm run build
```

Vocabulary is loaded from the
[`ez-nihongo-platform`](https://github.com/AlvaroGReg/ez-nihongo-platform)
ASP.NET Core API at `/api/v1/vocabulary`. For local development, the Vite dev
server proxies API requests to `http://localhost:5080`; run the platform API or
start the complete workspace with `deploy.ps1`.

The app keeps the `/ez-nihongo/` base path for GitHub Pages builds. The
workspace Docker build overrides it to `/` for the combined web/API stack.
