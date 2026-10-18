import type {
  ArgumentNode,
  DefinitionNode,
  FieldNode,
  FragmentDefinitionNode,
} from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

/** A mapping from fragment names to their {@link FragmentDefinitionNode}.
 *
 * @internal
 */
export type FragmentMap = Record<string, FragmentDefinitionNode>;

type Directive = {
  name: { value: string };
  arguments?: readonly ArgumentNode[];
};

type DirectedNode = {
  directives?: readonly Directive[];
  _directives?: Record<string, Directive>;
};

const getDirective = (
  node: DirectedNode,
  name: string
): Directive | undefined => {
  if (node._directives && node._directives[name]) {
    return node._directives[name];
  }

  return node.directives && node.directives.find(x => x.name.value === name);
};

/** Builds a {@link FragmentMap} from a document’s definitions.
 *
 * @internal
 */
export const getFragments = (
  definitions: readonly DefinitionNode[]
): FragmentMap =>
  definitions.reduce<FragmentMap>((acc, definition) => {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      acc[definition.name.value] = definition;
    }
    return acc;
  }, {});

/** Returns whether a node carries a directive by `name`.
 *
 * @remarks
 * This checks for the directive’s presence only and does not evaluate any
 * arguments (e.g. `@include(if:)`). It reads both the formatted `_directives`
 * record and the raw `directives` AST list.
 *
 * @internal
 */
export const hasDirective = (node: DirectedNode, name: string): boolean =>
  !!getDirective(node, name);

/** Returns whether a node is conditionally included via `@include`/`@skip`.
 *
 * @internal
 */
export const isOptionalSelection = (node: DirectedNode): boolean =>
  hasDirective(node, 'include') || hasDirective(node, 'skip');

/** Returns the response key (alias or name) for a field selection.
 *
 * @internal
 */
export const getFieldKey = (selection: FieldNode): string =>
  selection.alias ? selection.alias.value : selection.name.value;
