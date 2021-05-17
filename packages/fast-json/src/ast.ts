import {
  SelectionNode,
  DocumentNode,
  OperationDefinitionNode,
  FragmentDefinitionNode,
  IntrospectionTypeRef,
  NamedTypeNode,
  valueFromASTUntyped,
  Kind,
} from 'graphql';

import { SchemaTypes, SchemaObject, SchemaUnion, isSubtype } from './schema';

export const getMainOperation = (
  doc: DocumentNode
): OperationDefinitionNode | undefined => {
  for (let i = 0; i < doc.definitions.length; i++)
    if (doc.definitions[i].kind === Kind.OPERATION_DEFINITION)
      return doc.definitions[i] as OperationDefinitionNode;
};

export const getFragments = (
  doc: DocumentNode
): Record<string, FragmentDefinitionNode> => {
  const fragments: Record<string, FragmentDefinitionNode> = {};
  for (let i = 0; i < doc.definitions.length; i++) {
    const node = doc.definitions[i];
    if (node.kind === Kind.FRAGMENT_DEFINITION) {
      fragments[node.name.value] = node;
    }
  }

  return fragments;
};

export const shouldInclude = (
  node: SelectionNode,
  vars: Record<string, any>
): boolean => {
  const { directives } = node;
  if (!directives) return true;

  // Finds any @include or @skip directive that forces the node to be skipped
  for (let i = 0, l = directives.length; i < l; i++) {
    const directive = directives[i];
    const name = directive.name.value;

    if (
      (name === 'include' || name === 'skip') &&
      directive.arguments &&
      directive.arguments[0] &&
      directive.arguments[0].name.value === 'if'
    ) {
      // Return whether this directive forces us to skip
      // `@include(if: false)` or `@skip(if: true)`
      const value = valueFromASTUntyped(directive.arguments[0].value, vars);
      return name === 'include' ? !!value : !value;
    }
  }

  return true;
};

export const normalizeVariables = (
  doc: DocumentNode,
  input: void | Record<string, any>
): Record<string, any> => {
  const node = getMainOperation(doc);
  const vars = {};
  if (!input || !node) return vars;

  if (node.variableDefinitions) {
    for (let i = 0, l = node.variableDefinitions.length; i < l; i++) {
      const def = node.variableDefinitions[i];
      const name = def.variable.name.value;
      vars[name] =
        input[name] === undefined && def.defaultValue
          ? valueFromASTUntyped(def.defaultValue, input)
          : input[name];
    }
  }

  for (const key in input) {
    if (!(key in vars)) vars[key] = input[key];
  }

  return vars;
};

const getFieldTypeRef = (
  type: SchemaObject | SchemaUnion,
  name: string
): IntrospectionTypeRef => {
  if (name === '__typename') {
    return {
      kind: 'NON_NULL',
      ofType: {
        kind: 'SCALAR',
        name: 'String',
      },
    };
  } else if (type.kind === 'UNION' || !type.fields[name]) {
    return {
      kind: 'SCALAR',
      name: 'Any',
    };
  }

  return type.fields[name]!.type;
};

const unwrapType = (type: IntrospectionTypeRef) => {
  while (type.kind === 'LIST' || type.kind === 'NON_NULL') type = type.ofType;
  return type.name;
};

export type AliasFieldMap = {
  [alias: string]: Field;
};

export type TypeFieldMap = {
  [type: string]: AliasFieldMap;
};

export type Ref = IntrospectionTypeRef;

export interface Field {
  type: string;
  ref: Ref;
  selection?: TypeFieldMap;
}

export const collectDocumentFields = (
  types: SchemaTypes,
  doc: DocumentNode
): Field | null => {
  const operation = getMainOperation(doc);
  const fragments = getFragments(doc);
  if (!operation) return null;

  const getTypeCondition = (
    typeNode: NamedTypeNode | undefined,
    typename: string
  ): string => {
    const typeCondition = typeNode ? typeNode.name.value : typename;
    return typeCondition === typename ||
      isSubtype(types, typename, typeCondition)
      ? typename
      : typeCondition;
  };

  const walkSelection = (
    map: TypeFieldMap,
    typename: string,
    select: readonly SelectionNode[]
  ) => {
    for (let i = 0, l = select.length; i < l; i++) {
      const node = select[i];
      if (node.kind === Kind.FRAGMENT_SPREAD) {
        const fragment = fragments[node.name.value];
        if (fragment) {
          const condition = getTypeCondition(fragment.typeCondition, typename);
          walkSelection(map, condition, fragment.selectionSet.selections);
        }
      } else if (node.kind === Kind.INLINE_FRAGMENT) {
        const condition = getTypeCondition(node.typeCondition, typename);
        walkSelection(map, condition, node.selectionSet.selections);
      } else {
        let typemap = map[typename];
        if (!typemap) {
          typemap = map[typename] = {};
          for (const relatedType in map) {
            if (isSubtype(types, typename, relatedType))
              Object.assign(typemap, map[relatedType]);
          }
        }

        const parentType = types[typename]! as SchemaObject;
        const fieldTypeRef = getFieldTypeRef(parentType, node.name.value);
        const fieldType = unwrapType(fieldTypeRef);
        const alias = node.alias ? node.alias.value : node.name.value;
        const fieldmap =
          typemap[alias] ||
          (typemap[alias] = { type: fieldType, ref: fieldTypeRef });
        if (node.selectionSet) {
          const childmap = fieldmap.selection || (fieldmap.selection = {});
          walkSelection(childmap, fieldType, node.selectionSet.selections);
        }
      }
    }

    if (map[typename]) {
      for (const relatedType in map) {
        if (relatedType !== typename && isSubtype(types, relatedType, typename))
          Object.assign(map[relatedType], map[typename]);
      }
    }
  };

  const rootMap: TypeFieldMap = {};
  const rootType = types[operation.operation]!.name;
  walkSelection(rootMap, rootType, operation.selectionSet.selections);

  return {
    type: rootType,
    ref: { kind: 'OBJECT', name: rootType },
    selection: rootMap,
  };
};
