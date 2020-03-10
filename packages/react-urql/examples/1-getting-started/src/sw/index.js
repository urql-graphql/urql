const { execute } = require('graphql');
const { rootValue, schema } = require('./graphql');
const gql = require('graphql-tag');

self.addEventListener('install', event => {
  console.log('GraphQL service worker installed.');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
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

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    })
  );
});
