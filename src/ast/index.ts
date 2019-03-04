export * from './types';
export * from './node';

import {
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  InlineFragmentNode,
  OperationDefinitionNode,
  SelectionNode,
} from 'graphql';

import {
  getName,
  getSelectionSet,
  isFragmentNode,
  isOperationNode,
} from './node';
import { FragmentSelectionSets, VarsMap } from './types';
import { evaluateValueNode } from './value';

/** Checks whether a SelectionNode is a FieldNode */
export const isFieldNode = (node: SelectionNode): node is FieldNode =>
  node.kind === 'Field';

/** Checks whether a SelectionNode is an InlineFragmentNode */
export const isInlineFragment = (
  node: SelectionNode
): node is InlineFragmentNode => node.kind === 'InlineFragment';

/** Returns the main operation's definition */
export const getMainOperation = (
  doc: DocumentNode
): OperationDefinitionNode | void => {
  return doc.definitions.find(isOperationNode) as OperationDefinitionNode;
};

/** Returns the first fragment definition */
export const getMainFragment = (
  doc: DocumentNode
): FragmentDefinitionNode | void => {
  return doc.definitions.find(isFragmentNode) as FragmentDefinitionNode;
};

/** Returns a normalized form of variables with defaulted values */
export const getNormalizedVars = (
  node: OperationDefinitionNode,
  input?: null | object
): VarsMap => {
  if (node.variableDefinitions === undefined) {
    return {};
  }

  const args: VarsMap = input ? (input as VarsMap) : {};
  return node.variableDefinitions.reduce((vars, def) => {
    const name = getName(def.variable);
    let value = args[name];
    if (value === undefined) {
      if (def.defaultValue !== undefined) {
        value = evaluateValueNode(def.defaultValue, args);
      } else {
        return vars;
      }
    }

    vars[name] = value;
    return vars;
  }, {});
};

/** Returns a mapping from fragment names to their selections */
export const getFragmentSelectionSets = (
  doc: DocumentNode
): FragmentSelectionSets =>
  doc.definitions
    .filter(isFragmentNode)
    .reduce((map: FragmentSelectionSets, node) => {
      map[getName(node)] = getSelectionSet(node);
      return map;
    }, {});

/** Returns either the field's name or the field's alias */
export const getFieldAlias = (node: FieldNode): string =>
  node.alias !== undefined ? node.alias.value : getName(node);

/** Evaluates a fields arguments taking vars into account */
export const getFieldArguments = (
  node: FieldNode,
  vars: VarsMap
): null | VarsMap => {
  if (node.arguments === undefined || node.arguments.length === 0) {
    return null;
  }

  return node.arguments.reduce((args, arg) => {
    args[getName(arg)] = evaluateValueNode(arg.value, vars);
    return args;
  }, {});
};

/** Checks whether a given SelectionNode should be ignored based on @skip or @include directives */
export const shouldInclude = (node: SelectionNode, vars: VarsMap): boolean => {
  if (node.directives === undefined) {
    return true;
  }

  // Finds any @include or @skip directive that forces the node to be skipped
  return !node.directives.some(directive => {
    const name = getName(directive);
    // Ignore other directives
    const isInclude = name === 'include';
    if (!isInclude && name !== 'skip') {
      return false;
    }

    // Get the first argument and expect it to be named "if"
    const firstArg =
      directive.arguments !== undefined ? directive.arguments[0] : null;
    if (firstArg === null) {
      return false;
    } else if (getName(firstArg) !== 'if') {
      return false;
    }

    const value = evaluateValueNode(firstArg.value, vars);
    if (typeof value !== 'boolean' && value !== null) {
      return false;
    }

    // Return whether this directive forces us to skip
    // `@include(if: false)` or `@skip(if: true)`
    return isInclude ? !value : !!value;
  });
};
