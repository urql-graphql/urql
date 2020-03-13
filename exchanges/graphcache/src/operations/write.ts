import { FieldNode, DocumentNode, FragmentDefinitionNode } from 'graphql';

import {
  getFragments,
  getMainOperation,
  normalizeVariables,
  getFieldArguments,
  isFieldAvailableOnType,
  getSelectionSet,
  getName,
  SelectionSet,
  getFragmentTypeName,
  getFieldAlias,
} from '../ast';

import { invariant, warn, pushDebugNode } from '../helpers/help';

import { NullArray, Variables, Data, Link, OperationRequest } from '../types';

import {
  Store,
  getCurrentDependencies,
  initDataState,
  clearDataState,
  joinKeys,
  keyOfField,
} from '../store';

import * as InMemoryData from '../store/data';
import { makeDict } from '../helpers/dict';
import {
  Context,
  SelectionIterator,
  ensureData,
  makeContext,
  updateContext,
} from './shared';

export interface WriteResult {
  dependencies: Set<string>;
}

/** Writes a request given its response to the store */
export const write = (
  store: Store,
  request: OperationRequest,
  data: Data,
  key?: number
): WriteResult => {
  initDataState(store.data, key || null);
  const result = startWrite(store, request, data);
  clearDataState();
  return result;
};

export const startWrite = (
  store: Store,
  request: OperationRequest,
  data: Data
) => {
  const operation = getMainOperation(request.query);
  const result: WriteResult = { dependencies: getCurrentDependencies() };

  const select = getSelectionSet(operation);
  const operationName = store.getRootKey(operation.operation);

  const ctx = makeContext(
    store,
    normalizeVariables(operation, request.variables),
    getFragments(request.query),
    operationName,
    operationName
  );

  if (process.env.NODE_ENV !== 'production') {
    pushDebugNode(operationName, operation);
  }

  if (operationName === ctx.store.getRootKey('query')) {
    writeSelection(ctx, operationName, select, data);
  } else {
    writeRoot(ctx, operationName, select, data);
  }

  return result;
};

export const writeOptimistic = (
  store: Store,
  request: OperationRequest,
  key: number
): WriteResult => {
  initDataState(store.data, key, true);

  const operation = getMainOperation(request.query);
  const result: WriteResult = { dependencies: getCurrentDependencies() };

  const mutationRootKey = store.getRootKey('mutation');
  const operationName = store.getRootKey(operation.operation);
  invariant(
    operationName === mutationRootKey,
    'writeOptimistic(...) was called with an operation that is not a mutation.\n' +
      'This case is unsupported and should never occur.',
    10
  );

  if (process.env.NODE_ENV !== 'production') {
    pushDebugNode(operationName, operation);
  }

  const ctx = makeContext(
    store,
    normalizeVariables(operation, request.variables),
    getFragments(request.query),
    mutationRootKey,
    mutationRootKey,
    true
  );

  const data = makeDict();
  const iter = new SelectionIterator(
    operationName,
    operationName,
    getSelectionSet(operation),
    ctx
  );

  let node: FieldNode | void;
  while ((node = iter.next()) !== undefined) {
    if (node.selectionSet !== undefined) {
      const fieldName = getName(node);
      const resolver = ctx.store.optimisticMutations[fieldName];

      if (resolver !== undefined) {
        const fieldArgs = getFieldArguments(node, ctx.variables);
        const fieldKey = keyOfField(fieldName, fieldArgs);

        // We have to update the context to reflect up-to-date ResolveInfo
        updateContext(
          ctx,
          mutationRootKey,
          mutationRootKey,
          fieldKey,
          fieldName
        );

        const resolverValue = resolver(fieldArgs || makeDict(), ctx.store, ctx);
        writeField(ctx, getSelectionSet(node), ensureData(resolverValue));
        data[fieldName] = resolverValue;
        const updater = ctx.store.updates[mutationRootKey][fieldName];
        if (updater !== undefined) {
          updater(data, fieldArgs || makeDict(), ctx.store, ctx);
        }
      }
    }
  }

  clearDataState();
  return result;
};

export const writeFragment = (
  store: Store,
  query: DocumentNode,
  data: Data,
  variables?: Variables
) => {
  const fragments = getFragments(query);
  const names = Object.keys(fragments);
  const fragment = fragments[names[0]] as FragmentDefinitionNode;
  if (fragment === undefined) {
    return warn(
      'writeFragment(...) was called with an empty fragment.\n' +
        'You have to call it with at least one fragment in your GraphQL document.',
      11
    );
  }

  const typename = getFragmentTypeName(fragment);
  const writeData = { __typename: typename, ...data } as Data;
  const entityKey = store.keyOfEntity(writeData);
  if (!entityKey) {
    return warn(
      "Can't generate a key for writeFragment(...) data.\n" +
        'You have to pass an `id` or `_id` field or create a custom `keys` config for `' +
        typename +
        '`.',
      12
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    pushDebugNode(typename, fragment);
  }

  const ctx = makeContext(
    store,
    variables || {},
    fragments,
    typename,
    entityKey
  );

  writeSelection(ctx, entityKey, getSelectionSet(fragment), writeData);
};

const writeSelection = (
  ctx: Context,
  entityKey: string,
  select: SelectionSet,
  data: Data
) => {
  const isQuery = entityKey === ctx.store.getRootKey('query');
  const typename = isQuery ? entityKey : data.__typename;
  if (typeof typename !== 'string') return;

  InMemoryData.writeRecord(entityKey, '__typename', typename);

  const iter = new SelectionIterator(typename, entityKey, select, ctx);

  let node: FieldNode | void;
  while ((node = iter.next()) !== undefined) {
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, ctx.variables);
    const fieldKey = keyOfField(fieldName, fieldArgs);
    const fieldValue = data[getFieldAlias(node)];
    const key = joinKeys(entityKey, fieldKey);

    if (process.env.NODE_ENV !== 'production') {
      if (fieldValue === undefined) {
        const advice = ctx.optimistic
          ? '\nYour optimistic result may be missing a field!'
          : '';

        const expected =
          node.selectionSet === undefined
            ? 'scalar (number, boolean, etc)'
            : 'selection set';

        warn(
          'Invalid undefined: The field at `' +
            fieldKey +
            '` is `undefined`, but the GraphQL query expects a ' +
            expected +
            ' for this field.' +
            advice,
          13
        );

        continue; // Skip this field
      } else if (ctx.store.schema && typename) {
        isFieldAvailableOnType(ctx.store.schema, typename, fieldName);
      }
    }

    if (node.selectionSet === undefined) {
      // This is a leaf node, so we're setting the field's value directly
      InMemoryData.writeRecord(entityKey, fieldKey, fieldValue);
    } else {
      // Process the field and write links for the child entities that have been written
      const fieldData = ensureData(fieldValue);
      const link = writeField(ctx, getSelectionSet(node), fieldData, key);
      InMemoryData.writeLink(entityKey, fieldKey, link);
    }
  }
};

const writeField = (
  ctx: Context,
  select: SelectionSet,
  data: null | Data | NullArray<Data>,
  parentFieldKey?: string
): Link => {
  if (Array.isArray(data)) {
    const newData = new Array(data.length);
    for (let i = 0, l = data.length; i < l; i++) {
      const item = data[i];
      // Append the current index to the parentFieldKey fallback
      const indexKey = parentFieldKey
        ? joinKeys(parentFieldKey, `${i}`)
        : undefined;
      // Recursively write array data
      const links = writeField(ctx, select, item, indexKey);
      // Link cannot be expressed as a recursive type
      newData[i] = links as string | null;
    }

    return newData;
  } else if (data === null) {
    return null;
  }

  const entityKey = ctx.store.keyOfEntity(data);
  const typename = data.__typename;

  if (
    parentFieldKey &&
    ctx.store.keys[data.__typename] === undefined &&
    entityKey === null &&
    typeof typename === 'string' &&
    !typename.endsWith('Connection') &&
    !typename.endsWith('Edge') &&
    typename !== 'PageInfo'
  ) {
    warn(
      'Invalid key: The GraphQL query at the field at `' +
        parentFieldKey +
        '` has a selection set, ' +
        'but no key could be generated for the data at this field.\n' +
        'You have to request `id` or `_id` fields for all selection sets or create ' +
        'a custom `keys` config for `' +
        typename +
        '`.\n' +
        'Entities without keys will be embedded directly on the parent entity. ' +
        'If this is intentional, create a `keys` config for `' +
        typename +
        '` that always returns null.',
      15
    );
  }

  if (entityKey) {
    writeSelection(ctx, entityKey, select, data);
    return entityKey;
  } else if (!parentFieldKey) {
    writeRoot(ctx, typename, select, data);
    return null;
  } else {
    writeSelection(ctx, parentFieldKey, select, data);
    return parentFieldKey;
  }
};

// This is like writeSelection but assumes no parent entity exists
const writeRoot = (
  ctx: Context,
  typename: string,
  select: SelectionSet,
  data: Data
) => {
  const isRootField =
    typename === ctx.store.getRootKey('mutation') ||
    typename === ctx.store.getRootKey('subscription');

  const iter = new SelectionIterator(typename, typename, select, ctx);

  let node: FieldNode | void;
  while ((node = iter.next()) !== undefined) {
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, ctx.variables);
    const fieldKey = joinKeys(typename, keyOfField(fieldName, fieldArgs));
    if (node.selectionSet !== undefined) {
      const fieldValue = ensureData(data[getFieldAlias(node)]);
      writeField(ctx, getSelectionSet(node), fieldValue);
    }

    if (isRootField) {
      // We have to update the context to reflect up-to-date ResolveInfo
      updateContext(ctx, typename, typename, fieldKey, fieldName);

      // We run side-effect updates after the default, normalized updates
      // so that the data is already available in-store if necessary
      const updater = ctx.store.updates[typename][fieldName];
      if (updater !== undefined) {
        updater(data, fieldArgs || makeDict(), ctx.store, ctx);
      }
    }
  }
};
