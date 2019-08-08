import {
  FieldNode,
  SelectionNode,
  DefinitionNode,
  DocumentNode,
  InlineFragmentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  Kind,
} from 'graphql';

import { getName, getSelectionSet } from './node';
import { evaluateValueNode } from './variables';
import { Fragments, Variables, SelectionSet } from '../types';

const isFragmentNode = (
  node: DefinitionNode
): node is FragmentDefinitionNode => {
  return node.kind === Kind.FRAGMENT_DEFINITION;
};

const isFieldNode = (node: SelectionNode): node is FieldNode =>
  node.kind === Kind.FIELD;

const isInlineFragment = (node: SelectionNode): node is InlineFragmentNode =>
  node.kind === Kind.INLINE_FRAGMENT;

/** Returns the main operation's definition */
export const getMainOperation = (
  doc: DocumentNode
): OperationDefinitionNode => {
  const operation = doc.definitions.find(
    node => node.kind === Kind.OPERATION_DEFINITION
  ) as OperationDefinitionNode;

  if (!operation) {
    throw new TypeError(
      'OperationDefinition is missing from GraphQL DocumentNode'
    );
  }

  return operation;
};

/** Returns a mapping from fragment names to their selections */
export const getFragments = (doc: DocumentNode): Fragments =>
  doc.definitions.filter(isFragmentNode).reduce((map: Fragments, node) => {
    map[getName(node)] = node;
    return map;
  }, {});

const shouldInclude = (node: SelectionNode, vars: Variables): boolean => {
  if (node.directives === undefined) {
    return true;
  }

  // Finds any @include or @skip directive that forces the node to be skipped
  const isSkipped = node.directives.some(directive => {
    const name = getName(directive);
    // Ignore other directives
    const isInclude = name === 'include';
    if (!isInclude && name !== 'skip') {
      return false;
    }

    // Get the first argument and expect it to be named "if"
    const arg = directive.arguments ? directive.arguments[0] : null;
    if (!arg || getName(arg) !== 'if') {
      return false;
    }

    const value = evaluateValueNode(arg.value, vars);
    if (typeof value !== 'boolean' && value !== null) {
      return false;
    }

    // Return whether this directive forces us to skip
    // `@include(if: false)` or `@skip(if: true)`
    return isInclude ? !value : !!value;
  });

  return !isSkipped;
};

export const forEachFieldNode = (
  select: SelectionSet,
  fragments: Fragments,
  vars: Variables,
  cb: (node: FieldNode) => void
) => {
  select.forEach(node => {
    if (!shouldInclude(node, vars)) {
      // Directives instruct this node to be skipped
      return;
    } else if (!isFieldNode(node)) {
      // A fragment is either referred to by FragmentSpread or inline
      const def = isInlineFragment(node) ? node : fragments[getName(node)];

      if (def !== undefined) {
        const fragmentSelect = getSelectionSet(def);
        // TODO: Check for getTypeCondition(def) to match
        // Recursively process the fragments' selection sets
        forEachFieldNode(fragmentSelect, fragments, vars, cb);
      }
    } else if (getName(node) !== '__typename') {
      cb(node);
    }
  });
};
