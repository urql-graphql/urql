import { DocumentNode } from 'graphql';
import { getKeyForRequest } from './keyForQuery';

export const createRequest = (q: string | DocumentNode, vars?: object) => ({
  key: getKeyForRequest(q, vars),
  query: q,
  variables: vars || {},
});
