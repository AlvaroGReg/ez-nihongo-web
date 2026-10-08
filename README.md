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

Vocabulary is bundled from the public
[`ez-nihongo-platform`](https://github.com/AlvaroGReg/ez-nihongo-platform)
repository, included as the `data-source` Git submodule. Initialize it when
cloning the web repository:

```sh
git clone --recurse-submodules https://github.com/AlvaroGReg/ez-nihongo-web.git
```

The app is configured for deployment to GitHub Pages at `/ez-nihongo/`. The
deployment workflow checks out the submodule and is defined in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
