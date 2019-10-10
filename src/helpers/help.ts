// These are guards that are used throughout the codebase to warn or error on
// unexpected behaviour or conditions.
// Every warning and error comes with a number that uniquely identifies them.
// You can read more about the messages themselves in `docs/help.md`

import { Kind, ExecutableDefinitionNode, InlineFragmentNode } from 'graphql';
import { Ref } from '../types';

type DebugNode = ExecutableDefinitionNode | InlineFragmentNode;

const helpUrl =
  '\nhttps://github.com/FormidableLabs/urql-exchange-graphcache/blob/master/docs/help.md#';
const cache = new Set<string>();

export const currentDebugStack: Ref<string[]> = { current: [] };

export const pushDebugNode = (typename: void | string, node: DebugNode) => {
  let identifier = '';
  if (node.kind === Kind.INLINE_FRAGMENT) {
    identifier = typename
      ? `Inline Fragment on "${typename}"`
      : 'Inline Fragment';
  } else if (node.kind === Kind.OPERATION_DEFINITION) {
    const name = node.name ? `"${node.name.value}"` : 'Unnamed';
    identifier = `${name} ${node.operation}`;
  } else if (node.kind === Kind.FRAGMENT_DEFINITION) {
    identifier = `"${node.name.value}" Fragment`;
  }

  if (identifier) {
    currentDebugStack.current.push(identifier);
  }
};

const getDebugOutput = (): string =>
  currentDebugStack.current.length
    ? '\n(Caused At: ' + currentDebugStack.current.join(', ') + ')'
    : '';

export const invariant = (clause: any, message: string, code: number) => {
  if (!clause) {
    let errorMessage = message || 'Minfied Error #' + code + '\n';
    if (process.env.NODE_ENV !== 'production') {
      errorMessage += getDebugOutput();
    }

    const error = new Error(errorMessage + helpUrl + code);
    error.name = 'Graphcache Error';
    throw error;
  }
};

export const warn = (message: string, code: number) => {
  if (!cache.has(message)) {
    console.warn(message + getDebugOutput() + helpUrl + code);
    cache.add(message);
  }
};
