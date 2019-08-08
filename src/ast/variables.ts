import { FieldNode, ValueNode, OperationDefinitionNode } from 'graphql';

import { getName } from './node';
import { Variables } from '../types';

/** Evaluates a given ValueNode to a JSON value taking vars into account */
export const evaluateValueNode = (node: ValueNode, vars: Variables) => {
  switch (node.kind) {
    case 'NullValue':
      return null;
    case 'IntValue':
      return parseInt(node.value, 10);
    case 'FloatValue':
      return parseFloat(node.value);
    case 'ListValue':
      return node.values.map(v => evaluateValueNode(v, vars));
    case 'ObjectValue':
      return node.fields.reduce((obj, field) => {
        obj[getName(field)] = evaluateValueNode(field.value, vars);
        return obj;
      }, Object.create(null));
    case 'Variable':
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

  return node.arguments.reduce((args, arg) => {
    args[getName(arg)] = evaluateValueNode(arg.value, vars);
    return args;
  }, Object.create(null));
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
