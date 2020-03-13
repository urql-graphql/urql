import {
  FieldNode,
  OperationDefinitionNode,
  valueFromASTUntyped,
} from 'graphql';

import { getName } from './node';

import { makeDict } from '../helpers/dict';
import { Variables } from '../types';

/** Evaluates a fields arguments taking vars into account */
export const getFieldArguments = (
  node: FieldNode,
  vars: Variables
): null | Variables => {
  const args = makeDict();
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

/** Returns a normalized form of variables with defaulted values */
export const normalizeVariables = (
  node: OperationDefinitionNode,
  input: void | object
): Variables => {
  const args: Variables = (input as Variables) || {};
  const vars = makeDict();
  if (node.variableDefinitions) {
    for (let i = 0, l = node.variableDefinitions.length; i < l; i++) {
      const def = node.variableDefinitions[i];
      const name = getName(def.variable);
      let value = args[name];
      if (value === undefined && def.defaultValue) {
        value = valueFromASTUntyped(def.defaultValue, args);
      }

      vars[name] = value;
    }
  }

  return vars;
};
