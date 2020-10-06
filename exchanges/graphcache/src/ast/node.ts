import {
  NamedTypeNode,
  NameNode,
  SelectionNode,
  SelectionSetNode,
  InlineFragmentNode,
  FieldNode,
  FragmentDefinitionNode,
  Kind,
} from 'graphql';

export type SelectionSet = ReadonlyArray<SelectionNode>;

/** Returns the name of a given node */
export const getName = (node: { name: NameNode }): string => node.name.value;

export const getFragmentTypeName = (node: FragmentDefinitionNode): string =>
  node.typeCondition.name.value;

/** Returns either the field's name or the field's alias */
export const getFieldAlias = (node: FieldNode): string =>
  node.alias ? node.alias.value : getName(node);

/** Returns the SelectionSet for a given inline or defined fragment node */
export const getSelectionSet = (node: {
  selectionSet?: SelectionSetNode;
}): SelectionSet => (node.selectionSet ? node.selectionSet.selections : []);

export const getTypeCondition = (node: {
  typeCondition?: NamedTypeNode;
}): string | null => (node.typeCondition ? getName(node.typeCondition) : null);

export const isFieldNode = (node: SelectionNode): node is FieldNode =>
  node.kind === Kind.FIELD;

export const isInlineFragment = (
  node: SelectionNode
): node is InlineFragmentNode => node.kind === Kind.INLINE_FRAGMENT;
