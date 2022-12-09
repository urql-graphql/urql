import {
  DocumentNode,
  FieldNode,
  InlineFragmentNode,
  Kind,
  visit,
  print,
} from 'graphql';

import { KeyedDocumentNode, keyDocument } from './request';

interface EntityLike {
  [key: string]: EntityLike | EntityLike[] | any;
  __typename: string | null | void;
}

const collectTypes = (obj: EntityLike | EntityLike[], types: Set<string>) => {
  if (Array.isArray(obj)) {
    for (const item of obj) collectTypes(item, types);
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (key === '__typename' && typeof obj[key] === 'string') {
        types.add(obj[key] as string);
      } else {
        collectTypes(obj[key], types);
      }
    }
  }

  return types;
};

export const collectTypesFromResponse = (response: object): string[] => [
  ...collectTypes(response as EntityLike, new Set()),
];

const formatNode = (node: FieldNode | InlineFragmentNode) => {
  if (!node.selectionSet) return node;
  for (const selection of node.selectionSet.selections)
    if (
      selection.kind === Kind.FIELD &&
      selection.name.value === '__typename' &&
      !selection.alias
    )
      return node;

  return {
    ...node,
    selectionSet: {
      ...node.selectionSet,
      selections: [
        ...node.selectionSet.selections,
        {
          kind: Kind.FIELD,
          name: {
            kind: Kind.NAME,
            value: '__typename',
          },
        },
      ],
    },
  };
};

const formattedDocs = new Map<number, KeyedDocumentNode>();

export const formatDocument = <T extends DocumentNode>(node: T): T => {
  const query = keyDocument(node);

  let result = formattedDocs.get(query.__key);
  if (!result) {
    result = visit(query, {
      Field: formatNode,
      InlineFragment: formatNode,
    }) as KeyedDocumentNode;

    // Ensure that the hash of the resulting document won't suddenly change
    // we are marking __key as non-enumerable so when external exchanges use visit
    // to manipulate a document we won't restore the previous query due to the __key
    // property.
    Object.defineProperty(result, '__key', {
      value: query.__key,
      enumerable: false,
    });

    formattedDocs.set(query.__key, result);
    if (typeof node !== 'string' && node.loc?.source.name === 'gql') {
      const printed = print(result);
      node.loc.source.body = printed;
      (node.loc as any).end = printed.length;
    }
  }

  return (result as unknown) as T;
};
