import type { Exchange } from '@urql/core';
import { mapExchange } from '@urql/core';
import { toe } from 'graphql-toe';

/** Exchange factory that maps the fields of the data to throw an error on access if the field was errored.
 *
 * @returns the created throw-on-error {@link Exchange}.
 */
export const throwOnErrorExchange = (): Exchange => {
  return mapExchange({
    onResult(result) {
      if (result.data) {
        const errors = result.error && result.error.graphQLErrors;
        result.data = toe({ data: result.data, errors });
      }
      return result;
    },
  });
};
