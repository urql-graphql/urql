import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import { getKeyForRequest } from './keyForQuery';
import { GraphQLRequest } from '../types';

export const createRequest = (
  q: string | DocumentNode,
  vars?: object
): GraphQLRequest => {
  const query = typeof q === 'string' ? gql([q]) : q;

  return {
    key: getKeyForRequest(query, vars),
    query,
    variables: vars || {},
  };
};
