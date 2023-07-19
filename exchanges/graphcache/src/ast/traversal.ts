import {
  SelectionNode,
  DocumentNode,
  OperationDefinitionNode,
  FragmentSpreadNode,
  InlineFragmentNode,
  valueFromASTUntyped,
  Kind,
} from '@0no-co/graphql.web';

import { FormattedNode } from '@urql/core';
import { getName, getDirectives } from './node';
import { invariant } from '../helpers/help';
import { Fragments, Variables } from '../types';

function getMainOperation(
  doc: FormattedNode<DocumentNode>
): FormattedNode<OperationDefinitionNode>;
function getMainOperation(doc: DocumentNode): OperationDefinitionNode;

/** Returns the main operation's definition */
function getMainOperation(doc: DocumentNode): OperationDefinitionNode {
  for (let i = 0; i < doc.definitions.length; i++) {
    if (doc.definitions[i].kind === Kind.OPERATION_DEFINITION) {
      return doc.definitions[i] as FormattedNode<OperationDefinitionNode>;
    }
  }

  invariant(
    false,
    'Invalid GraphQL document: All GraphQL documents must contain an OperationDefinition' +
      'node for a query, subscription, or mutation.',
    1
  );
}

export { getMainOperation };

/** Returns a mapping from fragment names to their selections */
export const getFragments = (doc: FormattedNode<DocumentNode>): Fragments => {
  const fragments: Fragments = {};
  for (let i = 0; i < doc.definitions.length; i++) {
    const node = doc.definitions[i];
    if (node.kind === Kind.FRAGMENT_DEFINITION) {
      fragments[getName(node)] = node;
    }
  }

  return fragments;
};

/** Resolves @include and @skip directives to determine whether field is included. */
export const shouldInclude = (
  node: FormattedNode<SelectionNode>,
  vars: Variables
): boolean => {
  const directives = getDirectives(node);
  if (directives.include || directives.skip) {
    // Finds any @include or @skip directive that forces the node to be skipped
    for (const name in directives) {
      const directive = directives[name];
      if (
        directive &&
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
  }
  return true;
};

/** Resolves @defer directive to determine whether a fragment is potentially skipped. */
export const isDeferred = (
  node: FormattedNode<FragmentSpreadNode | InlineFragmentNode>,
  vars: Variables
): boolean => {
  const { defer } = getDirectives(node);
  if (defer) {
    for (const argument of defer.arguments || []) {
      if (getName(argument) === 'if') {
        // Return whether `@defer(if: )` is enabled
        return !!valueFromASTUntyped(argument.value, vars);
      }
    }
    return true;
  }

  return false;
};
