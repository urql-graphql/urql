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
  if (node.arguments === undefined || node.arguments.length === 0) {
    return null;
  }

  const args = Object.create(null);
  let argsSize = 0;

  for (let i = 0, l = node.arguments.length; i < l; i++) {
    const arg = node.arguments[i];
    const value = valueFromASTUntyped(arg.value, vars);
    if (value !== undefined && value !== null) {
      args[getName(arg)] = value;
      argsSize++;
    }
  }

  return argsSize > 0 ? args : null;
};

/** Returns a normalized form of variables with defaulted values */
export const normalizeVariables = (
  node: OperationDefinitionNode,
  input: void | object
): Variables => {
  if (node.variableDefinitions === undefined) {
    return {};
  }

  const args: Variables = (input as Variables) || {};

  return node.variableDefinitions.reduce((vars, def) => {
    const name = getName(def.variable);
    let value = args[name];
    if (value === undefined) {
      if (def.defaultValue !== undefined) {
        value = valueFromASTUntyped(def.defaultValue, args);
      } else {
        return vars;
      }
    }

    vars[name] = value;
    return vars;
  }, Object.create(null));
};
