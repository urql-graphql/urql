import { FieldNode, DocumentNode, FragmentDefinitionNode } from 'graphql';

import {
  getSelectionSet,
  getName,
  SelectionSet,
  getFragmentTypeName,
  getFieldAlias,
} from '../ast';

import {
  getFragments,
  getMainOperation,
  normalizeVariables,
  getFieldArguments,
} from '../ast';

import {
  Variables,
  Data,
  DataField,
  Link,
  OperationRequest,
  NullArray,
  Dependencies,
} from '../types';

import {
  Store,
  getCurrentOperation,
  getCurrentDependencies,
  initDataState,
  clearDataState,
  joinKeys,
  keyOfField,
} from '../store';

import * as InMemoryData from '../store/data';
import { warn, pushDebugNode, popDebugNode } from '../helpers/help';

import {
  Context,
  makeSelectionIterator,
  ensureData,
  makeContext,
  updateContext,
} from './shared';

import {
  isFieldAvailableOnType,
  isFieldNullable,
  isListNullable,
} from '../ast';

export interface QueryResult {
  dependencies: Dependencies;
  partial: boolean;
  data: null | Data;
}

export const query = (
  store: Store,
  request: OperationRequest,
  data?: Data
): QueryResult => {
  initDataState('read', store.data, null);
  const result = read(store, request, data);
  clearDataState();
  return result;
};

export const read = (
  store: Store,
  request: OperationRequest,
  input?: Data
): QueryResult => {
  const operation = getMainOperation(request.query);
  const rootKey = store.rootFields[operation.operation];
  const rootSelect = getSelectionSet(operation);

  const ctx = makeContext(
    store,
    normalizeVariables(operation, request.variables),
    getFragments(request.query),
    rootKey,
    rootKey
  );

  if (process.env.NODE_ENV !== 'production') {
    pushDebugNode(rootKey, operation);
  }

  let data: Data | undefined = input || ({} as Data);
  data =
    rootKey !== ctx.store.rootFields['query']
      ? readRoot(ctx, rootKey, rootSelect, data)
      : readSelection(ctx, rootKey, rootSelect, data);

  if (process.env.NODE_ENV !== 'production') {
    popDebugNode();
  }

  return {
    dependencies: getCurrentDependencies(),
    partial: data === undefined ? false : ctx.partial,
    data: data === undefined ? null : data,
  };
};

const readRoot = (
  ctx: Context,
  entityKey: string,
  select: SelectionSet,
  originalData: Data
): Data => {
  if (typeof originalData.__typename !== 'string') {
    return originalData;
  }

  const iter = makeSelectionIterator(entityKey, entityKey, select, ctx);
  const data = {} as Data;
  data.__typename = originalData.__typename;

  let node: FieldNode | void;
  while ((node = iter.next()) !== undefined) {
    const fieldAlias = getFieldAlias(node);
    const fieldValue = originalData[fieldAlias];
    if (node.selectionSet !== undefined && fieldValue !== null) {
      const fieldData = ensureData(fieldValue);
      data[fieldAlias] = readRootField(ctx, getSelectionSet(node), fieldData);
    } else {
      data[fieldAlias] = fieldValue;
    }
  }

  return data;
};

const readRootField = (
  ctx: Context,
  select: SelectionSet,
  originalData: null | Data | NullArray<Data>
): Data | NullArray<Data> | null => {
  if (Array.isArray(originalData)) {
    const newData = new Array(originalData.length);
    for (let i = 0, l = originalData.length; i < l; i++)
      newData[i] = readRootField(ctx, select, originalData[i]);
    return newData;
  } else if (originalData === null) {
    return null;
  }

  // Write entity to key that falls back to the given parentFieldKey
  const entityKey = ctx.store.keyOfEntity(originalData);
  if (entityKey !== null) {
    // We assume that since this is used for result data this can never be undefined,
    // since the result data has already been written to the cache
    const fieldValue = readSelection(ctx, entityKey, select, {} as Data);
    return fieldValue === undefined ? null : fieldValue;
  } else {
    return readRoot(ctx, originalData.__typename, select, originalData);
  }
};

export const readFragment = (
  store: Store,
  query: DocumentNode,
  entity: Partial<Data> | string,
  variables?: Variables
): Data | null => {
  const fragments = getFragments(query);
  const names = Object.keys(fragments);
  const fragment = fragments[names[0]] as FragmentDefinitionNode;
  if (fragment === undefined) {
    warn(
      'readFragment(...) was called with an empty fragment.\n' +
        'You have to call it with at least one fragment in your GraphQL document.',
      6
    );

    return null;
  }

  const typename = getFragmentTypeName(fragment);
  if (typeof entity !== 'string' && !entity.__typename) {
    entity.__typename = typename;
  }

  const entityKey =
    typeof entity !== 'string'
      ? store.keyOfEntity({ __typename: typename, ...entity } as Data)
      : entity;

  if (!entityKey) {
    warn(
      "Can't generate a key for readFragment(...).\n" +
        'You have to pass an `id` or `_id` field or create a custom `keys` config for `' +
        typename +
        '`.',
      7
    );

    return null;
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

  const result =
    readSelection(ctx, entityKey, getSelectionSet(fragment), {} as Data) ||
    null;

  if (process.env.NODE_ENV !== 'production') {
    popDebugNode();
  }

  return result;
};

const readSelection = (
  ctx: Context,
  key: string,
  select: SelectionSet,
  data: Data,
  result?: Data
): Data | undefined => {
  const { store } = ctx;
  const isQuery = key === store.rootFields['query'];

  const entityKey = (result && store.keyOfEntity(result)) || key;
  if (!isQuery && !!ctx.store.rootNames[entityKey]) {
    warn(
      'Invalid root traversal: A selection was being read on `' +
        entityKey +
        '` which is an uncached root type.\n' +
        'The `' +
        ctx.store.rootFields.mutation +
        '` and `' +
        ctx.store.rootFields.subscription +
        '` types are special ' +
        'Operation Root Types and cannot be read back from the cache.',
      25
    );
  }

  const typename = !isQuery
    ? InMemoryData.readRecord(entityKey, '__typename') ||
      (result && result.__typename)
    : key;

  if (typeof typename !== 'string') {
    return;
  } else if (result && typename !== result.__typename) {
    warn(
      'Invalid resolver data: The resolver at `' +
        entityKey +
        '` returned an ' +
        'invalid typename that could not be reconciled with the cache.',
      8
    );

    return;
  }

  // The following closely mirrors readSelection, but differs only slightly for the
  // sake of resolving from an existing resolver result
  data.__typename = typename;
  const iter = makeSelectionIterator(typename, entityKey, select, ctx);

  let node: FieldNode | void;
  let hasFields = false;
  let hasPartials = false;
  while ((node = iter.next()) !== undefined) {
    // Derive the needed data from our node.
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, ctx.variables);
    const fieldAlias = getFieldAlias(node);
    const fieldKey = keyOfField(fieldName, fieldArgs);
    const key = joinKeys(entityKey, fieldKey);
    const fieldValue = InMemoryData.readRecord(entityKey, fieldKey);
    const resultValue = result ? result[fieldName] : undefined;
    const resolvers = store.resolvers[typename];

    if (process.env.NODE_ENV !== 'production' && store.schema && typename) {
      isFieldAvailableOnType(store.schema, typename, fieldName);
    }

    // We temporarily store the data field in here, but undefined
    // means that the value is missing from the cache
    let dataFieldValue: void | DataField;

    if (resultValue !== undefined && node.selectionSet === undefined) {
      // The field is a scalar and can be retrieved directly from the result
      dataFieldValue = resultValue;
    } else if (
      getCurrentOperation() === 'read' &&
      resolvers &&
      typeof resolvers[fieldName] === 'function'
    ) {
      // We have to update the information in context to reflect the info
      // that the resolver will receive
      updateContext(ctx, typename, entityKey, key, fieldName);

      // We have a resolver for this field.
      // Prepare the actual fieldValue, so that the resolver can use it
      if (fieldValue !== undefined) {
        data[fieldAlias] = fieldValue;
      }

      dataFieldValue = resolvers[fieldName](
        data,
        fieldArgs || ({} as Data),
        store,
        ctx
      );

      if (node.selectionSet !== undefined) {
        // When it has a selection set we are resolving an entity with a
        // subselection. This can either be a list or an object.
        dataFieldValue = resolveResolverResult(
          ctx,
          typename,
          fieldName,
          key,
          getSelectionSet(node),
          (data[fieldAlias] || {}) as Data,
          dataFieldValue
        );
      }

      if (
        store.schema &&
        dataFieldValue === null &&
        !isFieldNullable(store.schema, typename, fieldName)
      ) {
        // Special case for when null is not a valid value for the
        // current field
        return undefined;
      }
    } else if (node.selectionSet === undefined) {
      // The field is a scalar but isn't on the result, so it's retrieved from the cache
      dataFieldValue = fieldValue;
    } else if (resultValue !== undefined) {
      // We start walking the nested resolver result here
      dataFieldValue = resolveResolverResult(
        ctx,
        typename,
        fieldName,
        key,
        getSelectionSet(node),
        data[fieldAlias] as Data,
        resultValue
      );
    } else {
      // Otherwise we attempt to get the missing field from the cache
      const link = InMemoryData.readLink(entityKey, fieldKey);

      if (link !== undefined) {
        dataFieldValue = resolveLink(
          ctx,
          link,
          typename,
          fieldName,
          getSelectionSet(node),
          data[fieldAlias] as Data
        );
      } else if (typeof fieldValue === 'object' && fieldValue !== null) {
        // The entity on the field was invalid but can still be recovered
        dataFieldValue = fieldValue;
      }
    }

    // Now that dataFieldValue has been retrieved it'll be set on data
    // If it's uncached (undefined) but nullable we can continue assembling
    // a partial query result
    if (
      dataFieldValue === undefined &&
      store.schema &&
      isFieldNullable(store.schema, typename, fieldName)
    ) {
      // The field is uncached but we have a schema that says it's nullable
      // Set the field to null and continue
      hasPartials = true;
      data[fieldAlias] = null;
    } else if (dataFieldValue === undefined) {
      // The field is uncached and not nullable; return undefined
      return undefined;
    } else {
      // Otherwise continue as usual
      hasFields = true;
      data[fieldAlias] = dataFieldValue;
    }
  }

  if (hasPartials) ctx.partial = true;
  return isQuery && hasPartials && !hasFields ? undefined : data;
};

const resolveResolverResult = (
  ctx: Context,
  typename: string,
  fieldName: string,
  key: string,
  select: SelectionSet,
  prevData: void | null | Data | Data[],
  result: void | DataField
): DataField | void => {
  if (Array.isArray(result)) {
    const { store } = ctx;
    // Check whether values of the list may be null; for resolvers we assume
    // that they can be, since it's user-provided data
    const _isListNullable =
      !store.schema || isListNullable(store.schema, typename, fieldName);
    const data = new Array(result.length);
    for (let i = 0, l = result.length; i < l; i++) {
      // Recursively read resolver result
      const childResult = resolveResolverResult(
        ctx,
        typename,
        fieldName,
        joinKeys(key, `${i}`),
        select,
        // Get the inner previous data from prevData
        prevData != null ? prevData[i] : undefined,
        result[i]
      );

      if (childResult === undefined && !_isListNullable) {
        return undefined;
      } else {
        data[i] = childResult !== undefined ? childResult : null;
      }
    }

    return data;
  } else if (result === null || result === undefined) {
    return result;
  } else if (prevData === null) {
    // If we've previously set this piece of data to be null,
    // we skip it and return null immediately
    return null;
  } else if (isDataOrKey(result)) {
    const data = (prevData || {}) as Data;
    return typeof result === 'string'
      ? readSelection(ctx, result, select, data)
      : readSelection(ctx, key, select, data, result);
  } else {
    warn(
      'Invalid resolver value: The field at `' +
        key +
        '` is a scalar (number, boolean, etc)' +
        ', but the GraphQL query expects a selection set for this field.',
      9
    );

    return undefined;
  }
};

const resolveLink = (
  ctx: Context,
  link: Link | Link[],
  typename: string,
  fieldName: string,
  select: SelectionSet,
  prevData: void | null | Data | Data[]
): DataField | undefined => {
  if (Array.isArray(link)) {
    const { store } = ctx;
    const _isListNullable =
      store.schema && isListNullable(store.schema, typename, fieldName);
    const newLink = new Array(link.length);
    for (let i = 0, l = link.length; i < l; i++) {
      const childLink = resolveLink(
        ctx,
        link[i],
        typename,
        fieldName,
        select,
        prevData != null ? prevData[i] : undefined
      );
      if (childLink === undefined && !_isListNullable) {
        return undefined;
      } else {
        newLink[i] = childLink !== undefined ? childLink : null;
      }
    }

    return newLink;
  } else if (link === null || prevData === null) {
    // If the link is set to null or we previously set this piece of data to be null,
    // we skip it and return null immediately
    return null;
  } else {
    return readSelection(ctx, link, select, (prevData || {}) as Data);
  }
};

const isDataOrKey = (x: any): x is string | Data =>
  typeof x === 'string' ||
  (typeof x === 'object' && typeof (x as any).__typename === 'string');
