import {
  DefinitionNode,
  FragmentDefinitionNode,
  NameNode,
  OperationDefinitionNode,
  SelectionSetNode,
} from 'graphql';

import { SelectionSet } from './types';

/** Returns the name of a given node */
export const getName = (node: { name: NameNode }): string => node.name.value;

/** Returns the SelectionSet for a given inline or defined fragment node */
export const getSelectionSet = (node: {
  selectionSet: SelectionSetNode;
}): SelectionSet => node.selectionSet.selections;

export const isOperationNode = (
  node: DefinitionNode
): node is OperationDefinitionNode => node.kind === 'FragmentDefinition';

export const isFragmentNode = (
  node: DefinitionNode
): node is FragmentDefinitionNode => node.kind === 'FragmentDefinition';
