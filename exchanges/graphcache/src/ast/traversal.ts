import {
  SelectionNode,
  DocumentNode,
  OperationDefinitionNode,
  FragmentSpreadNode,
  InlineFragmentNode,
  valueFromASTUntyped,
  Kind,
} from 'graphql';

import { getName } from './node';

import { invariant } from '../helpers/help';
import { Fragments, Variables } from '../types';

/** Returns the main operation's definition */
export const getMainOperation = (
  doc: DocumentNode
): OperationDefinitionNode => {
  for (let i = 0; i < doc.definitions.length; i++) {
    if (doc.definitions[i].kind === Kind.OPERATION_DEFINITION) {
      return doc.definitions[i] as OperationDefinitionNode;
    }
  }

  invariant(
    false,
    'Invalid GraphQL document: All GraphQL documents must contain an OperationDefinition' +
      'node for a query, subscription, or mutation.',
    1
  );
};

/** Returns a mapping from fragment names to their selections */
export const getFragments = (doc: DocumentNode): Fragments => {
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
  node: SelectionNode,
  vars: Variables
): boolean => {
  // Finds any @include or @skip directive that forces the node to be skipped
  for (let i = 0; node.directives && i < node.directives.length; i++) {
    const directive = node.directives[i];
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

/** Resolves @defer directive to determine whether a fragment is potentially skipped. */
export const isDeferred = (
  node: FragmentSpreadNode | InlineFragmentNode,
  vars: Variables
): boolean => {
  for (let i = 0; node.directives && i < node.directives.length; i++) {
    const directive = node.directives[i];
    const name = getName(directive);
    if (name === 'defer') {
      for (
        let j = 0;
        directive.arguments && j < directive.arguments.length;
        j++
      ) {
        const argument = directive.arguments[i];
        if (getName(argument) === 'if') {
          // Return whether `@defer(if: )` is enabled
          return !!valueFromASTUntyped(argument.value, vars);
        }
      }

      return true;
    }
  }

  return false;
};
