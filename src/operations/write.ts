import warning from 'warning';
import { DocumentNode, FragmentDefinitionNode } from 'graphql';

import {
  getFieldAlias,
  getFragments,
  getMainOperation,
  getSelectionSet,
  normalizeVariables,
  getFragmentTypeName,
  getName,
  getOperationName,
  getFieldArguments,
} from '../ast';

import {
  NullArray,
  Fragments,
  Variables,
  Data,
  Link,
  Scalar,
  SelectionSet,
  OperationRequest,
} from '../types';

import {
  Store,
  addDependency,
  getCurrentDependencies,
  initStoreState,
  clearStoreState,
} from '../store';

import { forEachFieldNode } from './shared';
import { joinKeys, keyOfField } from '../helpers';

export interface WriteResult {
  dependencies: Set<string>;
}

interface Context {
  result: WriteResult;
  store: Store;
  variables: Variables;
  fragments: Fragments;
}

/** Writes a request given its response to the store */
export const write = (
  store: Store,
  request: OperationRequest,
  data: Data
): WriteResult => {
  initStoreState(0);

  const result = startWrite(store, request, data);

  clearStoreState();

  return result;
};

export const startWrite = (
  store: Store,
  request: OperationRequest,
  data: Data
) => {
  const operation = getMainOperation(request.query);
  const result: WriteResult = { dependencies: getCurrentDependencies() };

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    result,
    store,
  };

  const select = getSelectionSet(operation);
  const operationName = getOperationName(operation);

  if (operationName === 'Query') {
    writeSelection(ctx, operationName, select, data);
  } else {
    writeRoot(ctx, operationName, select, data);
  }

  return result;
};

export const writeOptimistic = (
  store: Store,
  request: OperationRequest,
  optimisticKey: number
): WriteResult => {
  initStoreState(optimisticKey);

  const operation = getMainOperation(request.query);
  const result: WriteResult = { dependencies: getCurrentDependencies() };

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    result,
    store,
  };

  const operationName = getOperationName(operation);
  if (operationName === 'Mutation') {
    const select = getSelectionSet(operation);
    forEachFieldNode(operationName, operationName, select, ctx, node => {
      if (node.selectionSet !== undefined) {
        const fieldName = getName(node);
        const resolver = ctx.store.optimisticMutations[fieldName];
        if (resolver !== undefined) {
          const fieldArgs = getFieldArguments(node, ctx.variables);
          const fieldSelect = getSelectionSet(node);
          const resolverValue = resolver(fieldArgs || {}, ctx.store, ctx);
          if (!isScalar(resolverValue)) {
            writeRootField(ctx, resolverValue, fieldSelect);
          }
        }
      }
    });
  }

  clearStoreState();
  return result;
};

export const writeFragment = (
  store: Store,
  query: DocumentNode,
  data: Data
) => {
  const fragments = getFragments(query);
  const names = Object.keys(fragments);
  const fragment = fragments[names[0]] as FragmentDefinitionNode;
  if (fragment === undefined) {
    return warning(
      false,
      'writeFragment(...) was called with an empty fragment.\n' +
        'You have to call it with at least one fragment in your GraphQL document.'
    );
  }

  const select = getSelectionSet(fragment);
  const typeName = getFragmentTypeName(fragment);
  const writeData = { ...data, __typename: typeName } as Data;

  const entityKey = store.keyOfEntity(writeData) as string;
  if (!entityKey) {
    return warning(
      false,
      "Can't generate a key for writeFragment(...) data.\n" +
        'You have to pass an `id` or `_id` field or create a custom `keys` config for `%s`.',
      typeName
    );
  }

  const ctx: Context = {
    variables: {}, // TODO: Should we support variables?
    fragments,
    result: { dependencies: getCurrentDependencies() },
    store,
  };

  writeSelection(ctx, entityKey, select, writeData);
};

const writeSelection = (
  ctx: Context,
  entityKey: string,
  select: SelectionSet,
  data: Data
) => {
  const { store, variables } = ctx;
  const isQuery = entityKey === 'Query';
  const typename = data.__typename;
  if (!isQuery) addDependency(entityKey);

  store.writeField(isQuery ? entityKey : typename, entityKey, '__typename');

  forEachFieldNode(typename, entityKey, select, ctx, node => {
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, variables);
    const fieldKey = joinKeys(entityKey, keyOfField(fieldName, fieldArgs));
    const fieldValue = data[getFieldAlias(node)];

    if (isQuery) addDependency(fieldKey);
    if (node.selectionSet === undefined) {
      // This is a leaf node, so we're setting the field's value directly
      store.writeRecord(fieldValue, fieldKey);
    } else if (!isScalar(fieldValue)) {
      // Process the field and write links for the child entities that have been written
      const { selections: fieldSelect } = node.selectionSet;
      const link = writeField(ctx, fieldKey, fieldSelect, fieldValue);
      store.writeLink(link, fieldKey);
      store.removeRecord(fieldKey);
    } else {
      warning(
        false,
        'Invalid value: The field at `%s` is a scalar (number, boolean, etc)' +
          ', but the GraphQL query expects a selection set for this field.\n' +
          'The value will still be cached, however this may lead to undefined behavior!',
        fieldKey
      );

      // This is a rare case for invalid entities
      store.writeRecord(fieldValue, fieldKey);
    }
  });
};

const writeField = (
  ctx: Context,
  parentFieldKey: string,
  select: SelectionSet,
  data: null | Data | NullArray<Data>
): Link => {
  if (Array.isArray(data)) {
    return data.map((item, index) => {
      // Append the current index to the parentFieldKey fallback
      const indexKey = joinKeys(parentFieldKey, `${index}`);
      // Recursively write array data
      const links = writeField(ctx, indexKey, select, item);
      // Link cannot be expressed as a recursive type
      return links as string | null;
    });
  } else if (data === null) {
    return null;
  }

  const entityKey = ctx.store.keyOfEntity(data);
  const key = entityKey !== null ? entityKey : parentFieldKey;

  warning(
    typeof data.__typename !== 'string' ||
      ctx.store.keys[data.__typename] !== undefined ||
      entityKey !== null,
    'Invalid key: The GraphQL query at the field at `%s` has a selection set, ' +
      'but no key could be generated for the data at this field.\n' +
      'You have to request `id` or `_id` fields for all selection sets or create ' +
      'a custom `keys` config for `%s`.\n' +
      'Entities without keys will be embedded directly on the parent entity. ' +
      'If this is intentional, create a `keys` config for `%s` that always returns null.',
    parentFieldKey,
    data.__typename,
    data.__typename
  );

  writeSelection(ctx, key, select, data);
  return key;
};

// This is like writeSelection but assumes no parent entity exists
const writeRoot = (
  ctx: Context,
  typename: string,
  select: SelectionSet,
  data: Data
) => {
  forEachFieldNode(typename, typename, select, ctx, node => {
    const fieldName = getName(node);
    const fieldAlias = getFieldAlias(node);
    const fieldArgs = getFieldArguments(node, ctx.variables);
    const fieldValue = data[fieldAlias];

    if (
      node.selectionSet !== undefined &&
      fieldValue !== null &&
      !isScalar(fieldValue)
    ) {
      const { selections: fieldSelect } = node.selectionSet;
      writeRootField(ctx, fieldValue, fieldSelect);
    }

    if (typename === 'Mutation' || typename === 'Subscription') {
      // We run side-effect updates after the default, normalized updates
      // so that the data is already available in-store if necessary
      const updater = ctx.store.updates[typename][fieldName];
      if (updater !== undefined) {
        updater(data, fieldArgs || {}, ctx.store, ctx);
      }
    }
  });
};

// This is like writeField but doesn't fall back to a generated key
const writeRootField = (
  ctx: Context,
  data: null | Data | NullArray<Data>,
  select: SelectionSet
) => {
  if (Array.isArray(data)) {
    return data.map(item => writeRootField(ctx, item, select));
  } else if (data === null) {
    return;
  }

  // Write entity to key that falls back to the given parentFieldKey
  const entityKey = ctx.store.keyOfEntity(data);
  if (entityKey !== null) {
    writeSelection(ctx, entityKey, select, data);
  } else {
    const typename = data.__typename;
    writeRoot(ctx, typename, select, data);
  }
};

// Without a typename field on Data or Data[] the result must be a scalar
// This effectively prevents us from writing Data into the store that
// doesn't have a __typename field
const isScalar = (x: any): x is Scalar | Scalar[] => {
  if (Array.isArray(x)) {
    return x.some(isScalar);
  }

  return (
    typeof x !== 'object' ||
    (x !== null && typeof (x as any).__typename !== 'string')
  );
};
