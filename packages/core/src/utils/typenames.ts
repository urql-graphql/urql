import {
  DocumentNode,
  FieldNode,
  InlineFragmentNode,
  SelectionSetNode,
  SelectionNode,
  Kind,
  visit,
} from 'graphql';

interface EntityLike {
  [key: string]: EntityLike | EntityLike[] | any;
  __typename: string | null | void;
}

const collectTypes = (obj: EntityLike | EntityLike[], types: string[] = []) => {
  if (Array.isArray(obj)) {
    obj.forEach(inner => {
      collectTypes(inner, types);
    });
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (key === '__typename' && typeof obj[key] === 'string') {
        types.push(obj[key] as string);
      } else {
        collectTypes(obj[key], types);
      }
    }
  }

  return types;
};

export const collectTypesFromResponse = (response: object) =>
  collectTypes(response as EntityLike).filter((v, i, a) => a.indexOf(v) === i);

const hasTypenameField = (set: SelectionSetNode) => {
  return set.selections.some(node => {
    return node.kind === Kind.FIELD && node.name.value === '__typename';
  });
};

const formatNode = (node: FieldNode | InlineFragmentNode) => {
  if (node.selectionSet && !hasTypenameField(node.selectionSet)) {
    // NOTE: It's fine to mutate here as long as we return the node,
    // which will instruct visit() to clone the AST upwards
    (node.selectionSet.selections as SelectionNode[]).push({
      kind: Kind.FIELD,
      name: {
        kind: Kind.NAME,
        value: '__typename',
      },
    });

    return node;
  }
};

export const formatDocument = (node: DocumentNode) => {
  return visit(node, {
    Field: formatNode,
    InlineFragment: formatNode,
  });
};
