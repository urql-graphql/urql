import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { DocumentNode, Kind, parse, print } from 'graphql';
import { hash, phash } from './hash';
import { stringifyVariables } from './stringifyVariables';
import { GraphQLRequest } from '../types';

interface Documents {
  [key: number]: DocumentNode;
}

const hashQuery = (q: string): number =>
  hash(q.replace(/([\s,]|#[^\n\r]+)+/g, ' ').trim());

const docs: Documents = Object.create(null);

export const createRequest = <Data = any, Variables = object>(
  q: string | DocumentNode | TypedDocumentNode<Data, Variables>,
  vars?: Variables
): GraphQLRequest<Data, Variables> => {
  let key: number;
  let query: DocumentNode;
  if (typeof q === 'string') {
    key = hashQuery(q);
    query =
      docs[key] !== undefined ? docs[key] : parse(q, { noLocation: true });
  } else if ((q as any).__key !== undefined) {
    key = (q as any).__key;
    query = q;
  } else {
    key = hashQuery(print(q));
    query = docs[key] !== undefined ? docs[key] : q;
  }

  docs[key] = query;
  (query as any).__key = key;

  return {
    key: vars ? phash(key, stringifyVariables(vars)) >>> 0 : key,
    query,
    variables: vars || {},
  };
};

/**
 * Finds the Name value from the OperationDefinition of a Document
 */
export const getOperationName = (query: DocumentNode): string | undefined => {
  for (let i = 0, l = query.definitions.length; i < l; i++) {
    const node = query.definitions[i];
    if (node.kind === Kind.OPERATION_DEFINITION && node.name) {
      return node.name.value;
    }
  }
};
