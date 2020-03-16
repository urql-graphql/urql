/* NOTE:
 * This demo is running a mock API in a service worker!
 * In this file you can find the GraphQL handler. The
 * service worker will call our BroadcastChannel with
 * incoming GraphQL requests, which are handled here.
 * For all intents and purposes _this_ is your GraphQL
 * server file.
 * You can find the resolvers and schema in `./graphql.ts`.
 */

import { parse, execute } from 'graphql';
import { rootValue, schema } from './graphql';

const channel = new BroadcastChannel("cs-graphql");

channel.addEventListener("message", ({ data }) => {
  if (
    typeof data !== 'object' ||
    typeof data.key !== 'number' ||
    typeof data.query !== 'string' ||
    (typeof data.variables !== 'object' && data.variables !== undefined)
  ) {
    return;
  }

  const { key, variables, query } = data;

  Promise.resolve()
    .then(() => {
      return execute(
        schema,
        parse(query),
        rootValue,
        variables,
        variables
      );
    })
    .then(result => {
      channel.postMessage({ ...result, key });
    })
    .catch(error => {
      channel.postMessage({ errors: [error], data: null, key });
    });
});
