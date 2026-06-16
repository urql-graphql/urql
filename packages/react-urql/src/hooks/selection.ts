import type {
  DefinitionNode,
  FieldNode,
  FragmentDefinitionNode,
  InlineFragmentNode,
} from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

export type FragmentMap = Record<string, FragmentDefinitionNode>;

type DirectedNode = {
  directives?: readonly { name: { value: string } }[];
  _directives?: Record<string, unknown>;
};

export const getFragments = (
  definitions: readonly DefinitionNode[]
): FragmentMap =>
  definitions.reduce<FragmentMap>((acc, definition) => {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      acc[definition.name.value] = definition;
    }
    return acc;
  }, {});

export const hasDirective = (node: DirectedNode, name: string): boolean => {
  const directives = node._directives;
  return !!(
    (directives && directives[name]) ||
    (node.directives && node.directives.some(x => x.name.value === name))
  );
};

export const isOptionalSelection = (node: DirectedNode): boolean =>
  hasDirective(node, 'include') || hasDirective(node, 'skip');

export const getFieldKey = (selection: FieldNode): string =>
  selection.alias ? selection.alias.value : selection.name.value;

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
