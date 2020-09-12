<div align="center">
  <img alt="urql" width="250" src="packages/site/src/assets/sidebar-badge.svg" />

  <br />
  <br />

  <strong>
    A highly customisable and versatile GraphQL client
  </strong>

  <br />
  <br />
  <a href="https://circleci.com/gh/FormidableLabs/urql">
    <img alt="Test Status" src="https://badgen.net/github/status/FormidableLabs/urql/main/ci/circleci?label=circleci" />
  </a>
  <a href="https://github.com/FormidableLabs/urql#maintenance-status">
    <img alt="Maintenance Status" src="https://badgen.net/badge/maintenance/active/green" />
  </a>
  <a href="https://www.npmjs.com/package/urql">
    <img alt="Weekly downloads" src="https://badgen.net/npm/dw/urql?color=blue" />
  </a>
  <a href="https://formidable.com/open-source/urql/docs/">
    <img alt="Visit docs" src="https://badgen.net/badge/docs/visit site/orange" />
  </a>
  <a href="https://spectrum.chat/urql">
    <img alt="Spectrum badge" src="https://badgen.net/badge/spectrum/chat with us/purple" />
  </a>
  <br />
  <br />
</div>

## ✨ Features

- 📦 **One package** to get a working GraphQL client in React, Preact, and Svelte
- ⚙️ Fully **customisable** behaviour [via "exchanges"](https://formidable.com/open-source/urql/docs/concepts/exchanges)
- 🗂 Logical but simple default behaviour and document caching
- 🌱 Normalized caching via [`@urql/exchange-graphcache`](https://formidable.com/open-source/urql/docs/graphcache)
- 🔬 Easy debugging with the [`urql` devtools browser extensions](https://formidable.com/open-source/urql/docs/advanced/debugging/)

`urql` is a GraphQL client that exposes a set of helpers for several frameworks. It's built to be highly customisable and versatile so you can take it from getting started with your first GraphQL project all the way to building complex apps and experimenting with GraphQL clients.

While GraphQL is an elegant protocol and schema language, client libraries today typically come with large API footprints. We aim to create something more lightweight instead.

## Installation

```sh
yarn add urql graphql
# or
npm install --save urql graphql
```

## 📃 [Documentation](https://formidable.com/open-source/urql/docs/)

The documentation contains everything you need to know about `urql`, and contains several sections in order of importance
when you first get started:

- **[Basics](https://formidable.com/open-source/urql/docs/basics/)** — contains the ["Getting Started" guide](https://formidable.com/open-source/urql/docs/basics/getting-started/) and all you need to know when first using `urql`.
- **[Main Concepts](https://formidable.com/open-source/urql/docs/concepts/)** — explains how `urql` functions and is built and covers GraphQL clients in general, on the ["Philosophy" page](https://formidable.com/open-source/urql/docs/concepts/philosophy).
- **[Advanced](https://formidable.com/open-source/urql/docs/advanced/)** — covers more uncommon use-cases and things you don't immediately need when getting started.
- **[Graphcache](https://formidable.com/open-source/urql/docs/graphcache/)** — documents ["Normalized Caching" support](https://formidable.com/open-source/urql/docs/graphcache/normalized-caching/) which enables more complex apps and use-cases.
- **[API](https://formidable.com/open-source/urql/docs/api/)** — the API documentation for each individual package.

_You can find the raw markdown files inside this repository's `docs` folder._

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue work on this project for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

<img width="100%" src="docs/assets/urql-spoiler.png" />
