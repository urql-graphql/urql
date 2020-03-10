import { execute } from 'graphql';
import { rootValue, schema } from './graphql';
import gql from 'graphql-tag';

self.addEventListener('install', (event: any) => {
  console.log('GraphQL service worker installed.');
  event.waitUntil((self as any).skipWaiting());
});

self.addEventListener('fetch', event => {
  const request = (event as any).request as Request;

  if (!/\/graphql$/.test(request.url)) {
    return;
  }

  (event as any).respondWith(
    Promise.resolve().then(async () => {
      const { query, variables } = await (await request.clone()).json();

      const response = await execute(
        schema,
        gql(query),
        rootValue,
        variables,
        variables
      );

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    })
  );
});
