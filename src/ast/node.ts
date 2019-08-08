import { NamedTypeNode, NameNode, SelectionSetNode, FieldNode } from 'graphql';

import { SelectionSet } from '../types';

/** Returns the name of a given node */
export const getName = (node: { name: NameNode }): string => node.name.value;

/** Returns either the field's name or the field's alias */
export const getFieldAlias = (node: FieldNode): string =>
  node.alias !== undefined ? node.alias.value : getName(node);

/** Returns the SelectionSet for a given inline or defined fragment node */
export const getSelectionSet = (node: {
  selectionSet?: SelectionSetNode;
}): SelectionSet =>
  node.selectionSet !== undefined ? node.selectionSet.selections : [];

export const getTypeCondition = ({
  typeCondition,
}: {
  typeCondition?: NamedTypeNode;
}): string | null =>
  typeCondition !== undefined ? getName(typeCondition) : null;
