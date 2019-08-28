import invariant from 'invariant';

import {
  SelectionNode,
  DefinitionNode,
  DocumentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  Kind,
} from 'graphql';

import { getName } from './node';
import { evaluateValueNode } from './variables';
import { Fragments, Variables } from '../types';

const isFragmentNode = (
  node: DefinitionNode
): node is FragmentDefinitionNode => {
  return node.kind === Kind.FRAGMENT_DEFINITION;
};

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
      'node for a query, subscription, or mutation.'
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
  if (node.directives === undefined) {
    return true;
  }

  // Finds any @include or @skip directive that forces the node to be skipped
  const { directives } = node;
  for (let i = 0, l = directives.length; i < l; i++) {
    const directive = directives[i];
    const name = getName(directive);

    // Ignore other directives
    const isInclude = name === 'include';
    if (!isInclude && name !== 'skip') continue;

    // Get the first argument and expect it to be named "if"
    const arg = directive.arguments ? directive.arguments[0] : null;
    if (!arg || getName(arg) !== 'if') continue;

    const value = evaluateValueNode(arg.value, vars);
    if (typeof value !== 'boolean' && value !== null) continue;

    // Return whether this directive forces us to skip
    // `@include(if: false)` or `@skip(if: true)`
    return isInclude ? !!value : !value;
  }

  return true;
};
