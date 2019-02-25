import { DocumentNode } from 'graphql';
import { getKeyForRequest } from './keyForQuery';

type QueryType = string | DocumentNode;

export function createRequest<Q extends QueryType>(
  query: Q
): { key: number; query: Q; variables: {} };
export function createRequest<Q extends QueryType, T extends object>(
  query: Q,
  vars: T
): { key: number; query: Q; variables: T };
export function createRequest<Q extends QueryType, T extends object>(
  q: Q,
  vars?: T
) {
  return {
    key: getKeyForRequest(q, vars),
    query: q,
    variables: vars || {},
  };
}
