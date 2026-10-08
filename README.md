# ez-nihongo

A localized Vue SPA for practising Japanese JLPT vocabulary. Choose English or
Spanish, select one or more JLPT levels and type the romanji reading for each
kanji and hiragana prompt.

Version `0.2.0` adds the localization, versioned session storage, content and
exercise contracts, provider adapter, attempt events, and local plan hints. Its
requirements and implementation decisions are documented in
[`specs/0.2.0/`](specs/0.2.0/). Authentication, payments and remote progress are
outside this release.

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
