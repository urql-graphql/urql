import { FieldNode, InlineFragmentNode, FragmentDefinitionNode } from 'graphql';

import { warn, pushDebugNode } from '../helpers/help';
import { hasField } from '../store/data';
import { Store, keyOfField } from '../store';
import { Fragments, Variables, SelectionSet, Scalar } from '../types';

import {
  SchemaPredicates,
  getTypeCondition,
  getFieldArguments,
  shouldInclude,
  isFieldNode,
  isInlineFragment,
  getSelectionSet,
  getName,
} from '../ast';

interface Context {
  store: Store;
  variables: Variables;
  fragments: Fragments;
  schemaPredicates?: SchemaPredicates;
}

const isFragmentHeuristicallyMatching = (
  node: InlineFragmentNode | FragmentDefinitionNode,
  typename: void | string,
  entityKey: string,
  ctx: Context
) => {
  if (!typename) return false;
  const typeCondition = getTypeCondition(node);
  if (typename === typeCondition) return true;

  warn(
    'Heuristic Fragment Matching: A fragment is trying to match against the `' +
      typename +
      '` type, ' +
      'but the type condition is `' +
      typeCondition +
      '`. Since GraphQL allows for interfaces `' +
      typeCondition +
      '` may be an' +
      'interface.\nA schema needs to be defined for this match to be deterministic, ' +
      'otherwise the fragment will be matched heuristically!',
    16
  );

  return !getSelectionSet(node).some(node => {
    if (!isFieldNode(node)) return false;
    const fieldKey = keyOfField(
      getName(node),
      getFieldArguments(node, ctx.variables)
    );
    return !hasField(entityKey, fieldKey);
  });
};

export class SelectionIterator {
  typename: void | string;
  entityKey: string;
  indexStack: number[];
  context: Context;
  selectionStack: SelectionSet[];

  constructor(
    typename: void | string,
    entityKey: string,
    select: SelectionSet,
    ctx: Context
  ) {
    this.typename = typename;
    this.entityKey = entityKey;
    this.context = ctx;
    this.indexStack = [0];
    this.selectionStack = [select];
  }

  next(): void | FieldNode {
    while (this.indexStack.length !== 0) {
      const index = this.indexStack[this.indexStack.length - 1]++;
      const select = this.selectionStack[this.selectionStack.length - 1];
      if (index >= select.length) {
        this.indexStack.pop();
        this.selectionStack.pop();
        continue;
      } else {
        const node = select[index];
        if (!shouldInclude(node, this.context.variables)) {
          continue;
        } else if (!isFieldNode(node)) {
          // A fragment is either referred to by FragmentSpread or inline
          const fragmentNode = !isInlineFragment(node)
            ? this.context.fragments[getName(node)]
            : node;

          if (fragmentNode !== undefined) {
            if (process.env.NODE_ENV !== 'production') {
              pushDebugNode(this.typename, fragmentNode);
            }

            const isMatching =
              this.context.schemaPredicates !== undefined
                ? this.context.schemaPredicates.isInterfaceOfType(
                    getTypeCondition(fragmentNode),
                    this.typename
                  )
                : isFragmentHeuristicallyMatching(
                    fragmentNode,
                    this.typename,
                    this.entityKey,
                    this.context
                  );

            if (isMatching) {
              this.indexStack.push(0);
              this.selectionStack.push(getSelectionSet(fragmentNode));
            }
          }

          continue;
        } else if (getName(node) === '__typename') {
          continue;
        } else {
          return node;
        }
      }
    }

    return undefined;
  }
}

// Without a typename field on Data or Data[] the result must be a scalar
// This effectively prevents us from writing Data into the store that
// doesn't have a __typename field
export const isScalar = (x: any): x is Scalar | Scalar[] => {
  if (Array.isArray(x)) {
    return x.some(isScalar);
  }

  return (
    typeof x !== 'object' ||
    (x !== null && typeof (x as any).__typename !== 'string')
  );
};
