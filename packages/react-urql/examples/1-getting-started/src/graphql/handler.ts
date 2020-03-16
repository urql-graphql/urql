import { parse, execute } from 'graphql';
import { rootValue, schema } from './schema';

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
