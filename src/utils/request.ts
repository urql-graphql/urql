import { DocumentNode, parse } from 'graphql';
import { getKeyForRequest } from './keyForQuery';
import { GraphQLRequest, Operation, OperationContext } from '../types';

export const createRequest = (
  q: string | DocumentNode,
  vars?: object
): GraphQLRequest => {
  const query = typeof q === 'string' ? parse(q) : q;

  return {
    key: getKeyForRequest(query, vars),
    query,
    variables: vars || {},
  };
};

/** Spreads the provided metadata to the source operation's meta property in context.  */
export const addMetadata = (
  source: Operation,
  meta: Exclude<OperationContext['meta'], undefined>
) => ({
  ...source,
  context: {
    ...source.context,
    meta: {
      ...source.context.meta,
      ...meta,
    },
  },
});
