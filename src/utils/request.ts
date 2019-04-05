import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import { getKeyForRequest } from './keyForQuery';

export const createRequest = (q: string | DocumentNode, vars?: object) => {
  const query = typeof q === 'string' ? gql([q]) : q;

  return {
    key: getKeyForRequest(query, vars),
    query,
    variables: vars || {},
  };
};
