import {
  NameNode,
  SelectionNode,
  SelectionSetNode,
  GraphQLOutputType,
  isWrappingType,
  GraphQLWrappingType,
} from 'graphql';

export type SelectionSet = ReadonlyArray<SelectionNode>;
export type GraphQLFlatType = Exclude<GraphQLOutputType, GraphQLWrappingType>;

/** Returns the name of a given node */
export const getName = (node: { name: NameNode }): string => node.name.value;

/** Returns the SelectionSet for a given inline or defined fragment node */
export const getSelectionSet = (node: {
  selectionSet?: SelectionSetNode;
}): SelectionSet =>
  node.selectionSet !== undefined ? node.selectionSet.selections : [];

export const unwrapType = (
  type: null | undefined | GraphQLOutputType
): GraphQLFlatType | null => {
  if (isWrappingType(type)) {
    return unwrapType(type.ofType);
  }

  return type || null;
};
