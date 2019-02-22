import {
  DocumentNode,
  FieldNode,
  InlineFragmentNode,
  OperationDefinitionNode,
  visit,
} from 'graphql';

interface EntityLike {
  [key: string]: EntityLike | EntityLike[] | any;
  __typename: string | null | void;
}

const collectTypes = (obj: EntityLike | EntityLike[], types: string[] = []) => {
  if (Array.isArray(obj)) {
    obj.forEach(inner => collectTypes(inner, types));
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
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

const formatNode = (
  n: FieldNode | InlineFragmentNode | OperationDefinitionNode
) =>
  n.selectionSet !== undefined && n.selectionSet.selections !== undefined
    ? {
        ...n,
        selectionSet: {
          ...n.selectionSet,
          selections: [
            ...n.selectionSet.selections,
            {
              kind: 'Field',
              name: {
                kind: 'Name',
                value: '__typename',
              },
            },
          ],
        },
      }
    : false;

export const formatDocument = (astNode: DocumentNode) =>
  visit(astNode, {
    Field: formatNode,
    InlineFragment: formatNode,
    OperationDefinition: formatNode,
  });
