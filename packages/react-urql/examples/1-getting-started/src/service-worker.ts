import { execute } from 'graphql';
import { rootValue, schema } from './sw/graphql';
import gql from 'graphql-tag';

self.addEventListener('install', (event: any) => {
  console.log('GraphQL service worker installed.');
  // @ts-ignore
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event: any) => {
  const request = event.request;

  if (!/\/graphql$/.test(request.url)) {
    return;
  }

  event.respondWith(
    Promise.resolve().then(async () => {
      const { query, variables } = await (await request.clone()).json();

      const response = await execute(
        schema,
        gql(query),
        rootValue,
        variables,
        variables
      );

      await delay(1000);
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    })
  );
});

const delay = (t: number) => new Promise(resolve => setTimeout(resolve, t));
