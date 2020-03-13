import {
  SelectionNode,
  DefinitionNode,
  DocumentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  valueFromASTUntyped,
  Kind,
} from 'graphql';

import { getName } from './node';

import { invariant } from '../helpers/help';
import { Fragments, Variables } from '../types';

const isFragmentNode = (node: DefinitionNode): node is FragmentDefinitionNode =>
  node.kind === Kind.FRAGMENT_DEFINITION;

/** Returns the main operation's definition */
export const getMainOperation = (
  doc: DocumentNode
): OperationDefinitionNode => {
  const operation = doc.definitions.find(
    node => node.kind === Kind.OPERATION_DEFINITION
  ) as OperationDefinitionNode;

  invariant(
    !!operation,
    'Invalid GraphQL document: All GraphQL documents must contain an OperationDefinition' +
      'node for a query, subscription, or mutation.',
    1
  );

  return operation;
};

/** Returns a mapping from fragment names to their selections */
export const getFragments = (doc: DocumentNode): Fragments =>
  doc.definitions.filter(isFragmentNode).reduce((map: Fragments, node) => {
    map[getName(node)] = node;
    return map;
  }, {});

export const shouldInclude = (
  node: SelectionNode,
  vars: Variables
): boolean => {
  const { directives } = node;
  if (!directives) return true;

  // Finds any @include or @skip directive that forces the node to be skipped
  for (let i = 0, l = directives.length; i < l; i++) {
    const directive = directives[i];
    const name = getName(directive);

    if (
      (name === 'include' || name === 'skip') &&
      directive.arguments &&
      directive.arguments[0] &&
      getName(directive.arguments[0]) === 'if'
    ) {
      // Return whether this directive forces us to skip
      // `@include(if: false)` or `@skip(if: true)`
      const value = valueFromASTUntyped(directive.arguments[0].value, vars);
      return name === 'include' ? !!value : !value;
    }
  }

  return true;
};
