# URQL with SolidStart

This example demonstrates how to use URQL with SolidStart.

## Features

- Basic query with `createQuery`
- Client setup with `Provider`
- SSR with automatic hydration
- Route-level preloading
- Suspense integration

## Getting Started

```bash
pnpm install
pnpm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## What's Inside

- `src/app.tsx` - Sets up the URQL client and router
- `src/routes/index.tsx` - Demonstrates `createQuery` with preloading and Suspense

## Key Features Demonstrated

### Route Preloading

The example uses SolidStart's `preload` function to start fetching data before the route component renders:

```tsx
export const route = {
  preload: () => {
    const pokemons = createQuery({ query: POKEMONS_QUERY });
    return pokemons(); // Start fetching
  },
} satisfies RouteDefinition;
```

### Server-Side Rendering

Queries automatically execute on the server during SSR and hydrate on the client without refetching.

## Learn More

- [SolidStart Documentation](https://start.solidjs.com/)
- [URQL SolidStart Documentation](https://formidable.com/open-source/urql/docs/basics/solid-start/)
