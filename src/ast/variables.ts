import { FieldNode, ValueNode, OperationDefinitionNode, Kind } from 'graphql';

import { getName } from './node';
import { Variables } from '../types';

/** Evaluates a given ValueNode to a JSON value taking vars into account */
export const evaluateValueNode = (node: ValueNode, vars: Variables) => {
  switch (node.kind) {
    case Kind.NULL:
      return null;
    case Kind.INT:
      return parseInt(node.value, 10);
    case Kind.FLOAT:
      return parseFloat(node.value);
    case Kind.LIST:
      const values = new Array(node.values.length);
      for (let i = 0, l = node.values.length; i < l; i++)
        values[i] = evaluateValueNode(node.values[i], vars);
      return values;
    case Kind.OBJECT:
      const fields = Object.create(null);
      for (let i = 0, l = node.fields.length; i < l; i++) {
        const field = node.fields[i];
        fields[getName(field)] = evaluateValueNode(field.value, vars);
      }

      return fields;
    case Kind.VARIABLE:
      const varValue = vars[getName(node)];
      return varValue !== undefined ? varValue : null;
    default:
      return node.value;
  }
};

/** Evaluates a fields arguments taking vars into account */
export const getFieldArguments = (
  node: FieldNode,
  vars: Variables
): null | Variables => {
  if (node.arguments === undefined || node.arguments.length === 0) {
    return null;
  }

  const args = Object.create(null);
  for (let i = 0, l = node.arguments.length; i < l; i++) {
    const arg = node.arguments[i];
    args[getName(arg)] = evaluateValueNode(arg.value, vars);
  }

  return args;
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
        value = evaluateValueNode(def.defaultValue, args);
      } else {
        return vars;
      }
    }

    vars[name] = value;
    return vars;
  }, Object.create(null));
};
