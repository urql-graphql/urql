import {
  NamedTypeNode,
  NameNode,
  SelectionNode,
  SelectionSetNode,
  InlineFragmentNode,
  FieldNode,
  FragmentDefinitionNode,
  GraphQLOutputType,
  Kind,
  isWrappingType,
} from 'graphql';

import { SelectionSet, GraphQLFlatType } from '../types';

/** Returns the name of a given node */
export const getName = (node: { name: NameNode }): string => node.name.value;

export const getFragmentTypeName = (node: FragmentDefinitionNode): string =>
  node.typeCondition.name.value;

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

export const isFieldNode = (node: SelectionNode): node is FieldNode =>
  node.kind === Kind.FIELD;

export const isInlineFragment = (
  node: SelectionNode
): node is InlineFragmentNode => node.kind === Kind.INLINE_FRAGMENT;

export const unwrapType = (
  type: null | undefined | GraphQLOutputType
): GraphQLFlatType | null => {
  if (isWrappingType(type)) {
    return unwrapType(type.ofType);
  }

  return type || null;
};
