import { ValueNode } from 'graphql';
import { getName } from './node';
import { VarsMap } from './types';

/** Evaluates a given ValueNode to a JSON value taking vars into account */
export const evaluateValueNode = (node: ValueNode, vars: VarsMap) => {
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
      }, {});
    case 'Variable':
      const varValue = vars[getName(node)];
      return varValue !== undefined ? varValue : null;
    default:
      return node.value;
  }
};
