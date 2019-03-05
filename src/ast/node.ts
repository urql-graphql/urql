import {
  DefinitionNode,
  FragmentDefinitionNode,
  NamedTypeNode,
  NameNode,
  OperationDefinitionNode,
  SelectionSetNode,
} from 'graphql';

import { OperationType, SelectionSet } from './types';

/** Returns the name of a given node */
export const getName = (node: { name: NameNode }): string => node.name.value;

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

export const isOperationNode = (
  node: DefinitionNode
): node is OperationDefinitionNode => node.kind === 'OperationDefinition';

export const isFragmentNode = (
  node: DefinitionNode
): node is FragmentDefinitionNode => node.kind === 'FragmentDefinition';

export const getOperationType = (
  node: OperationDefinitionNode
): OperationType => {
  switch (node.operation) {
    case 'query':
      return 'Query';
    case 'mutation':
      return 'Mutation';
    case 'subscription':
      return 'Subscription';
  }
};
