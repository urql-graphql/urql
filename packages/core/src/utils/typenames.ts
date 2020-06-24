import {
  DocumentNode,
  FieldNode,
  InlineFragmentNode,
  SelectionNode,
  Kind,
  visit,
} from 'graphql';

interface EntityLike {
  [key: string]: EntityLike | EntityLike[] | any;
  __typename: string | null | void;
}

const collectTypes = (obj: EntityLike | EntityLike[], types: string[] = []) => {
  if (Array.isArray(obj)) {
    obj.forEach(inner => {
      collectTypes(inner, types);
    });
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (key === '__typename' && typeof obj[key] === 'string') {
        types.push(obj[key] as string);
      } else {
        collectTypes(obj[key], types);
      }
    }
  }

  return types;
};

export const collectTypesFromResponse = (response: object) =>
  collectTypes(response as EntityLike).filter((v, i, a) => a.indexOf(v) === i);

const formatNode = (node: FieldNode | InlineFragmentNode) => {
  if (
    node.selectionSet &&
    !node.selectionSet.selections.some(
      node => node.kind === Kind.FIELD && node.name.value === '__typename'
    )
  ) {
    return {
      ...node,
      selectionSet: {
        ...node.selectionSet,
        selections: [
          ...(node.selectionSet.selections as SelectionNode[]),
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
  }
};

export const formatDocument = (node: DocumentNode): DocumentNode => {
  const result = visit(node, {
    Field: formatNode,
    InlineFragment: formatNode,
  });

  // Ensure that the hash of the resulting document won't suddenly change
  result.__key = (node as any).__key;
  return result;
};
