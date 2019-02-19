import {
  DocumentNode,
  FieldNode,
  InlineFragmentNode,
  OperationDefinitionNode,
  visit,
} from 'graphql';

const getTypeNameFromField = (obj: object) =>
  Object.values(obj).reduce(
    (all, val) =>
      typeof val !== 'object' || val === null
        ? all
        : val.__typename !== undefined
        ? { ...all, [val.__typename]: true }
        : { ...all, ...getTypeNameFromField(val) },
    {}
  );

export const gankTypeNamesFromResponse = (response: object) => {
  const typeNames = Object.keys(getTypeNameFromField(response));
  return [...typeNames].filter((v, i, a) => a.indexOf(v) === i);
};

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
