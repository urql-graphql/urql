import {
  FieldNode,
  OperationDefinitionNode,
  valueFromASTUntyped,
} from 'graphql';

import { getName } from './node';

import { Variables } from '../types';

/** Evaluates a fields arguments taking vars into account */
export const getFieldArguments = (
  node: FieldNode,
  vars: Variables
): null | Variables => {
  const args = {};
  let argsSize = 0;
  if (node.arguments && node.arguments.length) {
    for (let i = 0, l = node.arguments.length; i < l; i++) {
      const arg = node.arguments[i];
      const value = valueFromASTUntyped(arg.value, vars);
      if (value !== undefined && value !== null) {
        args[getName(arg)] = value;
        argsSize++;
      }
    }
  }

  return argsSize > 0 ? args : null;
};

/** Returns a filtered form of variables with values missing that the query doesn't require */
export const filterVariables = (
  node: OperationDefinitionNode,
  input: void | object
) => {
  if (!input || !node.variableDefinitions) {
    return undefined;
  }

  const vars = {};
  for (let i = 0, l = node.variableDefinitions.length; i < l; i++) {
    const name = getName(node.variableDefinitions[i].variable);
    vars[name] = input[name];
  }

  return vars;
};

/** Returns a normalized form of variables with defaulted values */
export const normalizeVariables = (
  node: OperationDefinitionNode,
  input: void | object
): Variables => {
  const vars = {};
  if (!input) return vars;

  if (node.variableDefinitions) {
    for (let i = 0, l = node.variableDefinitions.length; i < l; i++) {
      const def = node.variableDefinitions[i];
      const name = getName(def.variable);
      vars[name] =
        input[name] === undefined && def.defaultValue
          ? valueFromASTUntyped(def.defaultValue, input)
          : input[name];
    }
  }

  for (const key in input) {
    if (!(key in vars)) vars[key] = input[key];
  }

  return vars;
};
