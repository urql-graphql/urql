import { DocumentNode } from 'graphql';
import { getKeyForRequest } from './keyForQuery';
import { GraphQLRequest, Operation, OperationContext } from '../types';

export const createRequest = (
  q: DocumentNode,
  vars?: object
): GraphQLRequest => ({
  key: getKeyForRequest(q, vars),
  query: q,
  variables: vars || {},
});

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
