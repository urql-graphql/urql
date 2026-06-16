import type {
  DefinitionNode,
  FieldNode,
  FragmentDefinitionNode,
  InlineFragmentNode,
} from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

// NOTE: `@urql/exchange-graphcache` has its own AST helpers in
// `ast/traversal.ts` (`getFragments`, `shouldInclude`, `isDeferred`, …). Those
// are variable-aware (they evaluate `@include/@skip/@defer(if:)` arguments),
// whereas these are presence-only. Unifying them is possible follow-up work but
// would change behaviour/signatures, so the two are intentionally kept separate.

/** A mapping from fragment names to their {@link FragmentDefinitionNode}.
 *
 * @internal
 */
export type FragmentMap = Record<string, FragmentDefinitionNode>;

type DirectedNode = {
  directives?: readonly { name: { value: string } }[];
  _directives?: Record<string, unknown>;
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
export const hasDirective = (node: DirectedNode, name: string): boolean => {
  const directives = node._directives;
  return !!(
    (directives && directives[name]) ||
    (node.directives && node.directives.some(x => x.name.value === name))
  );
};

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

/** Heuristically determines whether a fragment applies to a piece of `data`.
 *
 * @remarks
 * When the fragment’s type condition can’t be matched against `data.__typename`
 * directly, this falls back to checking that every non-optional, non-deferred
 * field the fragment selects is already present on `data`.
 *
 * @internal
 */
export const isHeuristicFragmentMatch = (
  fragment: InlineFragmentNode | FragmentDefinitionNode,
  data: any,
  fragments: FragmentMap
): boolean => {
  if (
    !fragment.typeCondition ||
    fragment.typeCondition.name.value === data.__typename
  ) {
    return true;
  }

  return fragment.selectionSet.selections.every(selection => {
    if (selection.kind === Kind.FIELD) {
      const couldBeExcluded =
        isOptionalSelection(selection) || hasDirective(selection, 'defer');
      return data[getFieldKey(selection)] !== undefined && !couldBeExcluded;
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      return isHeuristicFragmentMatch(selection, data, fragments);
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const fragment = fragments[selection.name.value];
      return !!fragment && isHeuristicFragmentMatch(fragment, data, fragments);
    }

    return true;
  });
};
