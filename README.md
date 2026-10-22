<table align="center" border="0" bgcolor="#101936">
    <tr>
        <td align="center">
            <img src="public/res/logos/ez-nihongo/logo-horizontal-white.svg" alt="EZ Nihongo" width="420" />
        </td>
    </tr>
</table>

<br />

Responsive web app for practising Japanese. The interface is available in
English and Spanish, with light and dark themes.

## Features

- Vocabulary tests for JLPT N5–N1. Select one or more levels and configure 10 to
  100 questions.
- Dictionaries for hiragana, katakana, JLPT vocabulary, and kanji. Filter
  vocabulary and kanji by level; kanji entries include readings and meanings.
- Kanji exercises for JLPT N5–N1 with multiple-choice reading and meaning
  questions. Meaning questions can show a reading hint. Spanish meanings are
  available for N4 and N5; N3–N1 meanings are in English.
- Kana practice with selectable scripts, rows, and kana types. Exercise modes
  include kana-to-romaji, romaji-to-kana, and hiragana/katakana conversion.
- Immediate answer feedback, session progress, final scores, and review of
  incorrect answers.
- Account registration and sign-in, including optional persistent login.
- Authenticated vocabulary exercise attempts and a learner progress view backed
  by the platform API.
- English and Spanish interface, saved language preference, and light and dark
  themes.

## Catalogs and backend requirements

Vocabulary and kanji JSON catalogs are bundled under `public/data/`. Dictionaries
and local exercises can use these files without the platform API. Unauthenticated
vocabulary tests use the bundled catalog. Signed-in vocabulary tests load from
the API so their attempts can be associated with the account. Account and
server-backed progress features also require the platform API and PostgreSQL.

Kanji exercises and dictionaries use the bundled kanji catalogs. The web app
does not require the API for those activities.

## Development

Use Node.js `^22.18.0 || >=24.12.0` and npm, as declared by `package.json`. Then
install dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

By default, Vite serves the app at <http://localhost:5173> and proxies `/api`
requests to `http://localhost:5080`. Start the platform API for backend-dependent
features, or run the complete stack using the workspace's
[Docker development instructions](../README.md#run-the-docker-development-stack).

Run the applicable checks from this repository root:

```sh
npm run type-check
npm run test:unit -- --run
npm run build
```

The regular build uses `/ez-nihongo/` as its base path. Set `VITE_BASE_PATH=/`
for a root-path build; the workspace Docker build already does this.

## GitHub Pages demo

The `demo-github-pages-offline` branch is deployed to GitHub Pages on each push
and can also be deployed manually from GitHub Actions. For the first deployment,
set the repository's Pages source to **GitHub Actions** under **Settings →
Pages**.

The workflow builds a static SPA under `/ez-nihongo-web/` and publishes the
bundled vocabulary and kanji catalogs. Catalog-backed dictionaries and exercises
work offline. The API is not deployed to Pages, so registration, sign-in, and
server-backed progress features are unavailable in this demo. The demo toolbar
also omits account controls.
