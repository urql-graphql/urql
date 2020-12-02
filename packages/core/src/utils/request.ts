import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { DocumentNode, Kind, parse, print } from 'graphql';
import { hash, phash } from './hash';
import { stringifyVariables } from './stringifyVariables';
import { GraphQLRequest } from '../types';

export interface KeyedDocumentNode extends DocumentNode {
  __key: number;
}

interface Documents {
  [key: number]: KeyedDocumentNode;
}

const hashQuery = (q: string): number =>
  hash(q.replace(/([\s,]|#[^\n\r]+)+/g, ' ').trim());

const docs: Documents = Object.create(null);

export const keyDocument = (
  q: string | DocumentNode | TypedDocumentNode
): KeyedDocumentNode => {
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

  (query as KeyedDocumentNode).__key = key;
  docs[key] = query as KeyedDocumentNode;
  return query as KeyedDocumentNode;
};

export const createRequest = <Data = any, Variables = object>(
  q: string | DocumentNode | TypedDocumentNode<Data, Variables>,
  vars?: Variables
): GraphQLRequest<Data, Variables> => {
  const query = keyDocument(q);
  return {
    key: vars
      ? phash(query.__key, stringifyVariables(vars)) >>> 0
      : query.__key,
    query,
    variables: vars || ({} as Variables),
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
