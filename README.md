<div align="center">
  <img alt="urql" width="250" src="packages/site/src/assets/sidebar-badge.svg" />

  <br />
  <br />

  <strong>
    A highly customisable and versatile GraphQL client
  </strong>

  <br />
  <br />
  <a href="https://github.com/urql-graphql/urql/actions/workflows/ci.yml">
    <img alt="CI Status" src="https://github.com/urql-graphql/urql/actions/workflows/ci.yml/badge.svg?branch=main" />
  </a>
  <a href="https://www.npmjs.com/package/@urql/core">
    <img alt="Weekly downloads" src="https://badgen.net/npm/dw/@urql/core?color=blue" />
  </a>
  <a href="https://urql.dev/discord">
    <img alt="Discord" src="https://img.shields.io/discord/1082378892523864074?color=7389D8&label&logo=discord&logoColor=ffffff" />
  </a>
  <br />
  <br />
</div>

## ✨ Features

- 📦 **One package** to get a working GraphQL client in React, Preact, Vue, and Svelte
- ⚙️ Fully **customisable** behaviour [via "exchanges"](https://formidable.com/open-source/urql/docs/advanced/authoring-exchanges/)
- 🗂 Logical but simple default behaviour and document caching
- 🌱 Normalized caching via [`@urql/exchange-graphcache`](https://formidable.com/open-source/urql/docs/graphcache)
- 🔬 Easy debugging with the [`urql` devtools browser extensions](https://formidable.com/open-source/urql/docs/advanced/debugging/)

`urql` is a GraphQL client that exposes a set of helpers for several frameworks. It's built to be highly customisable and versatile so
you can take it from getting started with your first GraphQL project all the way to building complex apps and experimenting with GraphQL clients.

**📃 For more information, [check out the docs](https://formidable.com/open-source/urql/docs/).**

## 💙 [Sponsors](https://github.com/sponsors/urql-graphql)

<table>
  <tr>
   <td align="center"><a href="https://bigcommerce.com/"><img src="https://avatars.githubusercontent.com/u/186342?s=200&v=4" width="150" alt="BigCommerce"/><br />BigCommerce</a></td>
   <td align="center"><a href="https://wundergraph.com/"><img src="https://avatars.githubusercontent.com/u/64281914?s=200&v=4" width="150" alt="WunderGraph"/><br />WunderGraph</a></td>
   <td align="center"><a href="https://the-guild.dev/"><img src="https://avatars.githubusercontent.com/u/42573040?s=200&v=4" width="150" alt="The Guild "/><br />The Guild</a></td>
  </tr>
</table>
<table>
  <tr>
   <td align="center"><a href="https://beatgig.com/"><img src="https://avatars.githubusercontent.com/u/51333382?s=200&v=4" width="100" alt="BeatGig"/><br />BeatGig</a></td>
  </tr>
</table>

## 🙌 Contributing

**The urql project was founded by [Formidable](https://formidable.com/) and is actively developed
by the urql GraphQL team.**

If you'd like to get involved, [check out our Contributor's guide.](https://github.com/urql-graphql/urql/blob/main/CONTRIBUTING.md)

## 📦 [Releases](https://github.com/urql-graphql/urql/releases)

All new releases and updates are listed on GitHub with full changelogs. Each package in this
repository further contains an independent `CHANGELOG.md` file with the historical changelog, for
instance, [here’s `@urql/core`’s
changelog](https://github.com/urql-graphql/urql/blob/main/packages/core/CHANGELOG.md).

If you’re upgrading to v4, [check out our migration guide, posted as an
issue.](https://github.com/urql-graphql/urql/issues/3114)

New releases are prepared using
[changesets](https://github.com/urql-graphql/urql/blob/main/CONTRIBUTING.md#how-do-i-document-a-change-for-the-changelog),
which are changelog entries added to each PR, and we have “Version Packages” PRs that once merged
will release new versions of `urql` packages. You can use `@canary` releases from `npm` if you’d
like to get a preview of the merged changes.

## 📃 [Documentation](https://urql.dev/goto/docs)

The documentation contains everything you need to know about `urql`, and contains several sections in order of importance
when you first get started:

- **[Basics](https://formidable.com/open-source/urql/docs/basics/)** — contains the ["Getting Started" guide](https://formidable.com/open-source/urql/docs/#where-to-start) and all you need to know when first using `urql`.
- **[Architecture](https://formidable.com/open-source/urql/docs/architecture/)** — explains how `urql` functions and is built.
- **[Advanced](https://formidable.com/open-source/urql/docs/advanced/)** — covers more uncommon use-cases and things you don't immediately need when getting started.
- **[Graphcache](https://formidable.com/open-source/urql/docs/graphcache/)** — documents ["Normalized Caching" support](https://formidable.com/open-source/urql/docs/graphcache/normalized-caching/) which enables more complex apps and use-cases.
- **[API](https://formidable.com/open-source/urql/docs/api/)** — the API documentation for each individual package.

Furthermore, all APIs and packages are self-documented using TSDocs. If you’re using a language
server for TypeScript, the documentation for each API should pop up in your editor when hovering
`urql`’s code and APIs.

_You can find the raw markdown files inside this repository's `docs` folder._

<img width="100%" src="docs/assets/urql-spoiler.png" />
