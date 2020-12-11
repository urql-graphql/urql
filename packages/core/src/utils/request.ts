import { TypedDocumentNode } from '@graphql-typed-document-node/core';

import {
  Location,
  DefinitionNode,
  DocumentNode,
  Kind,
  parse,
  print,
} from 'graphql';

import { hash, phash } from './hash';
import { stringifyVariables } from './stringifyVariables';
import { GraphQLRequest } from '../types';

interface WritableLocation {
  loc: Location | undefined;
}

export interface KeyedDocumentNode extends DocumentNode {
  __key: number;
}

export const stringifyDocument = (
  node: string | DefinitionNode | DocumentNode
): string => {
  // Stringify or normalise input
  const str = (typeof node !== 'string'
    ? (node.loc && node.loc.source.body) || print(node)
    : node
  )
    .replace(/([\s,]|#[^\n\r]+)+/g, ' ')
    .trim();

  // Add location information to stringified node
  if (typeof node !== 'string' && !node.loc) {
    (node as WritableLocation).loc = {
      start: 0,
      end: str.length,
      source: {
        body: str,
        name: 'gql',
        locationOffset: { line: 1, column: 1 },
      },
    } as Location;
  }

  return str;
};

const docs = new Map<number, KeyedDocumentNode>();

export const keyDocument = (q: string | DocumentNode): KeyedDocumentNode => {
  let key: number;
  let query: DocumentNode;
  if (typeof q === 'string') {
    key = hash(stringifyDocument(q));
    query = docs.get(key) || parse(q, { noLocation: true });
  } else if ((q as any).__key != null) {
    key = (q as any).__key;
    query = q;
  } else {
    key = hash(stringifyDocument(q));
    query = docs.get(key) || q;
  }

  // Add location information if it's missing
  if (!query.loc) stringifyDocument(query);

  (query as KeyedDocumentNode).__key = key;
  docs.set(key, query as KeyedDocumentNode);
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
