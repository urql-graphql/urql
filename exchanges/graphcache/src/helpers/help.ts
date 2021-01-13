// These are guards that are used throughout the codebase to warn or error on
// unexpected behaviour or conditions.
// Every warning and error comes with a number that uniquely identifies them.
// You can read more about the messages themselves in `docs/graphcache/errors.md`

import { Kind, ExecutableDefinitionNode, InlineFragmentNode } from 'graphql';

export type ErrorCode =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26;

type DebugNode = ExecutableDefinitionNode | InlineFragmentNode;

// URL unfurls to https://formidable.com/open-source/urql/docs/graphcache/errors/
const helpUrl = '\nhttps://bit.ly/2XbVrpR#';
const cache = new Set<string>();

export const currentDebugStack: string[] = [];

export const popDebugNode = () => currentDebugStack.pop();

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
    currentDebugStack.push(identifier);
  }
};

const getDebugOutput = (): string =>
  currentDebugStack.length
    ? '\n(Caused At: ' + currentDebugStack.join(', ') + ')'
    : '';

export function invariant(
  condition: any,
  message: string,
  code: ErrorCode
): asserts condition {
  if (!condition) {
    let errorMessage = message || 'Minfied Error #' + code + '\n';
    if (process.env.NODE_ENV !== 'production') {
      errorMessage += getDebugOutput();
    }

    const error = new Error(errorMessage + helpUrl + code);
    error.name = 'Graphcache Error';
    throw error;
  }
}

export function warn(message: string, code: ErrorCode) {
  if (!cache.has(message)) {
    console.warn(message + getDebugOutput() + helpUrl + code);
    cache.add(message);
  }
}
