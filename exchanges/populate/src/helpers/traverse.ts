import type {
  SelectionNode,
  ASTNode,
  DefinitionNode,
  GraphQLSchema,
  GraphQLFieldMap,
  FragmentDefinitionNode,
  FragmentSpreadNode,
} from 'graphql';
import { Kind, isAbstractType } from 'graphql';
import { unwrapType, getName } from './node';

export function traverse(
  node: ASTNode,
  enter?: (n: ASTNode) => ASTNode | void,
  exit?: (n: ASTNode) => ASTNode | void
): any {
  if (enter) {
    node = enter(node) || node;
  }

  switch (node.kind) {
    case Kind.DOCUMENT: {
      node = {
        ...node,
        definitions: node.definitions.map(
          n => traverse(n, enter, exit) as DefinitionNode
        ),
      };
      break;
    }
    case Kind.OPERATION_DEFINITION:
    case Kind.FIELD:
    case Kind.FRAGMENT_DEFINITION: {
      if (node.selectionSet) {
        node = {
          ...node,
          selectionSet: {
            ...node.selectionSet,
            selections: node.selectionSet.selections.map(
              n => traverse(n, enter, exit) as SelectionNode
            ),
          },
        };
      }
      break;
    }
  }

  if (exit) {
    node = exit(node) || node;
  }

  return node;
}

export function resolveFields(
  schema: GraphQLSchema,
  visits: string[]
): GraphQLFieldMap<any, any> {
  let currentFields = schema.getQueryType()!.getFields();

  for (let i = 0; i < visits.length; i++) {
    const t = unwrapType(currentFields[visits[i]].type);

    if (isAbstractType(t)) {
      currentFields = {};
      schema.getPossibleTypes(t).forEach(implementedType => {
        currentFields = {
          ...currentFields,
          // @ts-ignore TODO: proper casting
          ...schema.getType(implementedType.name)!.toConfig().fields,
        };
      });
    } else {
      // @ts-ignore TODO: proper casting
      currentFields = schema.getType(t!.name)!.toConfig().fields;
    }
  }

  return currentFields;
}

/** Get fragment names referenced by node. */
export function getUsedFragmentNames(node: FragmentDefinitionNode) {
  const names: string[] = [];

  traverse(node, n => {
    if (n.kind === Kind.FRAGMENT_SPREAD) {
      names.push(getName(n as FragmentSpreadNode));
    }
  });

  return names;
}
