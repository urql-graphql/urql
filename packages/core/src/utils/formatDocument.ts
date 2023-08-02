import type {
  FieldNode,
  SelectionNode,
  DefinitionNode,
  DirectiveNode,
} from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';
import type { KeyedDocumentNode } from './request';
import { keyDocument } from './request';
import type { FormattedNode, TypedDocumentNode } from '../types';

const formatNode = <
  T extends SelectionNode | DefinitionNode | TypedDocumentNode<any, any>
>(
  node: T
): FormattedNode<T> => {
  if ('definitions' in node) {
    const definitions: FormattedNode<DefinitionNode>[] = [];
    for (const definition of node.definitions) {
      const newDefinition = formatNode(definition);
      definitions.push(newDefinition);
    }

    return { ...node, definitions } as FormattedNode<T>;
  }

  if ('directives' in node && node.directives && node.directives.length) {
    const directives: DirectiveNode[] = [];
    const _directives = {};
    for (const directive of node.directives) {
      let name = directive.name.value;
      if (name[0] !== '_') {
        directives.push(directive);
      } else {
        name = name.slice(1);
      }
      _directives[name] = directive;
    }
    node = { ...node, directives, _directives };
  }

  if ('selectionSet' in node) {
    const selections: FormattedNode<SelectionNode>[] = [];
    let hasTypename = node.kind === Kind.OPERATION_DEFINITION;
    if (node.selectionSet) {
      for (const selection of node.selectionSet.selections || []) {
        hasTypename =
          hasTypename ||
          (selection.kind === Kind.FIELD &&
            selection.name.value === '__typename' &&
            !selection.alias);
        const newSelection = formatNode(selection);
        selections.push(newSelection);
      }

      if (!hasTypename) {
        selections.push({
          kind: Kind.FIELD,
          name: {
            kind: Kind.NAME,
            value: '__typename',
          },
          _generated: true,
        } as FormattedNode<FieldNode>);
      }

      return {
        ...node,
        selectionSet: { ...node.selectionSet, selections },
      } as FormattedNode<T>;
    }
  }

  return node as FormattedNode<T>;
};

const formattedDocs = new Map<number, KeyedDocumentNode>();

/** Formats a GraphQL document to add `__typename` fields and process client-side directives.
 *
 * @param node - a {@link DocumentNode}.
 * @returns a {@link FormattedDocument}
 *
 * @remarks
 * Cache {@link Exchange | Exchanges} will require typename introspection to
 * recognize types in a GraphQL response. To retrieve these typenames,
 * this function is used to add the `__typename` fields to non-root
 * selection sets of a GraphQL document.
 *
 * Additionally, this utility will process directives, filter out client-side
 * directives starting with an `_` underscore, and place a `_directives` dictionary
 * on selection nodes.
 *
 * This utility also preserves the internally computed key of the
 * document as created by {@link createRequest} to avoid any
 * formatting from being duplicated.
 *
 * @see {@link https://spec.graphql.org/October2021/#sec-Type-Name-Introspection} for more information
 * on typename introspection via the `__typename` field.
 */
export const formatDocument = <T extends TypedDocumentNode<any, any>>(
  node: T
): FormattedNode<T> => {
  const query = keyDocument(node);

  let result = formattedDocs.get(query.__key);
  if (!result) {
    formattedDocs.set(
      query.__key,
      (result = formatNode(query) as KeyedDocumentNode)
    );
    // Ensure that the hash of the resulting document won't suddenly change
    // we are marking __key as non-enumerable so when external exchanges use visit
    // to manipulate a document we won't restore the previous query due to the __key
    // property.
    Object.defineProperty(result, '__key', {
      value: query.__key,
      enumerable: false,
    });
  }

  return result as FormattedNode<T>;
};
