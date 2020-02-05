import {
  DocumentNode,
  FieldNode,
  InlineFragmentNode,
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
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (key === '__typename' && typeof val === 'string') {
          types.push(val);
        } else if (typeof val === 'object' && val !== null) {
          collectTypes(val, types);
        }
      }
    }
  }

  return types;
};

export const collectTypesFromResponse = (response: object) =>
  collectTypes(response as EntityLike).filter((v, i, a) => a.indexOf(v) === i);

const formatNode = (n: FieldNode | InlineFragmentNode) => {
  if (n.selectionSet === undefined) {
    return false;
  }

  if (
    n.selectionSet.selections.some(
      s => s.kind === 'Field' && s.name.value === '__typename'
    )
  ) {
    return n;
  }

  return {
    ...n,
    selectionSet: {
      ...n.selectionSet,
      selections: [
        ...n.selectionSet.selections,
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

export const formatDocument = (astNode: DocumentNode) =>
  visit(astNode, {
    Field: formatNode,
    InlineFragment: formatNode,
  });
