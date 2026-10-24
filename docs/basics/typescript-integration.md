---
title: TypeScript integration
order: 7
---

# URQL and TypeScript

URQL, with the help of [GraphQL Code Generator](https://www.the-guild.dev/graphql/codegen), can leverage the typed-design of GraphQL Schemas to generate TypeScript types on the flight.

## Getting started

### Installation

To get and running, install the following packages:

```sh
yarn add -D graphql typescript @graphql-codegen/cli @graphql-codegen/client-preset
# or
npm install -D graphql typescript @graphql-codegen/cli @graphql-codegen/client-preset
```

Then, add the following script to your `package.json`:

```json
{
  "scripts": {
    "codegen": "graphql-codegen"
  }
}
```

Now, let's create a configuration file for our current framework setup:

### Configuration

#### React project configuration

Create the following `codegen.ts` configuration file:

```ts
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '<YOUR_GRAPHQL_API_URL>',
  documents: ['src/**/*.tsx'],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    './src/gql/': {
      preset: 'client',
      plugins: [],
    },
  },
};

export default config;
```

#### Vue project configuration

Create the following `codegen.ts` configuration file:

```ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '<YOUR_GRAPHQL_API_URL>',
  documents: ['src/**/*.vue'],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    './src/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
      },
      plugins: [],
    },
  },
};

export default config;
```

## Typing queries, mutations and subscriptions

Now that your project is properly configured, let's start codegen in watch mode:

```sh
yarn codegen
# or
npm run codegen
```

This will generate a `./src/gql` folder that exposes a `graphql()` function.

Let's use this `graphql()` function to write our GraphQL Queries, Mutations and Subscriptions.

Here, an example with the React bindings, however, the usage remains the same for Vue and Svelte bindings:

```tsx
import React from 'react';
import { useQuery } from 'urql';

import './App.css';
import Film from './Film';
import { graphql } from '../src/gql';

const allFilmsWithVariablesQueryDocument = graphql(/* GraphQL */ `
  query allFilmsWithVariablesQuery($first: Int!) {
    allFilms(first: $first) {
      edges {
        node {
          ...FilmItem
        }
      }
    }
  }
`);

function App() {
  // `data` is typed!
  const [{ data }] = useQuery({
    query: allFilmsWithVariablesQueryDocument,
    variables: { first: 10 },
  });
  return (
    <div className="App">
      {data && (
        <ul>
          {data.allFilms?.edges?.map(
            (e, i) => e?.node && <Film film={e?.node} key={`film-${i}`} />
          )}
        </ul>
      )}
    </div>
  );
}

export default App;
```

_Examples with Vue are available [in the GraphQL Code Generator repository](https://github.com/dotansimha/graphql-code-generator/tree/master/examples/vue/urql)_.

Using the generated `graphql()` function to write your GraphQL document results in instantly typed result and variables for queries, mutations and subscriptions!

Let's now see how to go further with GraphQL fragments.

## Getting further with Fragments

> Using GraphQL Fragments helps to explicitly declaring the data dependencies of your UI component and safely accessing only the data it needs.

Our `<Film>` component relies on the `FilmItem` definition, passed through the `film` props:

```tsx
// ...
import Film from './Film';
import { graphql } from '../src/gql';

const allFilmsWithVariablesQueryDocument = graphql(/* GraphQL */ `
  query allFilmsWithVariablesQuery($first: Int!) {
    allFilms(first: $first) {
      edges {
        node {
          ...FilmItem
        }
      }
    }
  }
`);

function App() {
  // ...
  return (
    <div className="App">
      {data && (
        <ul>
          {data.allFilms?.edges?.map(
            (e, i) => e?.node && <Film film={e?.node} key={`film-${i}`} />
          )}
        </ul>
      )}
    </div>
  );
}
// ...
```

GraphQL Code Generator generates type helpers to type your component props based on Fragments (for example, the `film=` prop) and retrieve your fragment's data (see example below).

Again, here is an example with the React bindings:

```tsx
import { useFragment } from 'urql';
import type { FragmentType } from './gql/fragment-masking';
import { graphql } from '../src/gql';

export const FilmFragment = graphql(/* GraphQL */ `
  fragment FilmItem on Film {
    id
    title
    releaseDate
    producers
  }
`);

const Film = (props: { film: FragmentType<typeof FilmFragment> }) => {
  const { data: film } = useFragment({
    fragment: FilmFragment,
    data: props.film,
  });

  return film ? (
    <div>
      <h3>{film.title}</h3>
      <p>{film.releaseDate}</p>
    </div>
  ) : null;
};

export default Film;
```

The `FragmentType` reference and the fragment's result type are intentionally
separate. `useFragment` accepts the generated reference as its input and infers
its returned `data` from `FilmFragment`. This also allows an incremental
fragment reference to be passed before an `@defer` patch has arrived; with
Suspense enabled, the hook waits for that patch.

GraphQL Code Generator calls its generated unmasking helper `useFragment` by
default, but that helper isn't a React hook. To avoid a naming collision, name
it `readFragment` (or `getFragmentData`) in your Codegen configuration:

```ts
presetConfig: {
  fragmentMasking: {
    unmaskFunctionName: 'readFragment',
  },
},
```

The generated `readFragment(Fragment, data)` helper may still be used before
calling urql's hook for non-deferred data. It is not required: passing the
fragment reference directly is preferred for `@defer`, since Codegen's
incremental reference is not considered fully readable until its patch arrives.

For a deferred fragment, type the component input from the parent query field so
its incremental state is retained:

```tsx
const Film = (props: { film: NonNullable<FilmsQuery['film']> }) => {
  const { data: film } = useFragment({
    fragment: FilmFragment,
    data: props.film,
  });
  // ...
};
```

### Using gql.tada fragment references

gql.tada's opaque `FragmentOf` references are also accepted directly:

```tsx
import { useFragment } from 'urql';
import { graphql, type FragmentOf } from 'gql.tada';

const FilmFragment = graphql(`
  fragment FilmItem on Film {
    id
    title
    releaseDate
  }
`);

const Film = (props: { film: FragmentOf<typeof FilmFragment> }) => {
  const { data: film } = useFragment({
    fragment: FilmFragment,
    data: props.film,
  });
  return film ? <h3>{film.title}</h3> : null;
};
```

You may equivalently pass
`readFragment(FilmFragment, props.film)` as `data`. Both gql.tada and GraphQL
Code Generator's readers preserve `null` and `undefined`, which `useFragment`
also returns unchanged. For deferred fields, pass the opaque/incremental
reference directly so the hook can suspend until the streamed patch arrives.

_Examples with Vue are available [in the GraphQL Code Generator repository](https://github.com/dotansimha/graphql-code-generator/tree/master/examples/vue/urql)._
