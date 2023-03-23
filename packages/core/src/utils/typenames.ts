import { Kind, visit } from '@0no-co/graphql.web';

import type { DocumentNode, FieldNode, InlineFragmentNode } from './graphql';

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

/** Finds and returns a list of `__typename` fields found in response data.
 *
 * @privateRemarks
 * This is used by `@urql/core`’s document `cacheExchange` to find typenames
 * in a given GraphQL response’s data.
 */
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

/** Adds `__typename` fields to a GraphQL `DocumentNode`.
 *
 * @param node - a {@link DocumentNode}.
 * @returns a copy of the passed {@link DocumentNode} with added `__typename` introspection fields.
 *
 * @remarks
 * Cache {@link Exchange | Exchanges} will require typename introspection to
 * recognize types in a GraphQL response. To retrieve these typenames,
 * this function is used to add the `__typename` fields to non-root
 * selection sets of a GraphQL document.
 *
 * This utility also preserves the internally computed key of the
 * document as created by {@link createRequest} to avoid any
 * formatting from being duplicated.
 *
 * @see {@link https://spec.graphql.org/October2021/#sec-Type-Name-Introspection} for more information
 * on typename introspection via the `__typename` field.
 */
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
  }

  return result as unknown as T;
};
