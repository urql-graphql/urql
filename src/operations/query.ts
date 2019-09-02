import warning from 'warning';

import {
  getFragments,
  getMainOperation,
  getSelectionSet,
  normalizeVariables,
  getName,
  getFieldArguments,
  getFieldAlias,
  getOperationName,
} from '../ast';

import {
  Fragments,
  Variables,
  Data,
  DataField,
  Link,
  SelectionSet,
  Completeness,
  OperationRequest,
  NullArray,
} from '../types';

import {
  Store,
  addDependency,
  getCurrentDependencies,
  initStoreState,
  clearStoreState,
} from '../store';

import { SelectionIterator, isScalar } from './shared';
import { joinKeys, keyOfField } from '../helpers';

export interface QueryResult {
  completeness: Completeness;
  dependencies: Set<string>;
  data: null | Data;
}

interface Context {
  result: QueryResult;
  store: Store;
  variables: Variables;
  fragments: Fragments;
}

/** Reads a request entirely from the store */
export const query = (store: Store, request: OperationRequest): QueryResult => {
  initStoreState(0);

  const result = startQuery(store, request);
  clearStoreState();
  return result;
};

export const startQuery = (store: Store, request: OperationRequest) => {
  const operation = getMainOperation(request.query);
  const root: Data = Object.create(null);
  const result: QueryResult = {
    completeness: 'FULL',
    dependencies: getCurrentDependencies(),
    data: root,
  };

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    result,
    store,
  };

  result.data = readSelection(ctx, 'Query', getSelectionSet(operation), root);

  return result;
};

export const readOperation = (
  store: Store,
  request: OperationRequest,
  data: Data
) => {
  initStoreState(0);

  const operation = getMainOperation(request.query);

  const result: QueryResult = {
    completeness: 'FULL',
    dependencies: getCurrentDependencies(),
    data: null,
  };

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    result,
    store,
  };

  result.data = readRoot(
    ctx,
    getOperationName(operation),
    getSelectionSet(operation),
    data
  );

  clearStoreState();
  return result;
};

export const readRoot = (
  ctx: Context,
  entityKey: string,
  select: SelectionSet,
  originalData: Data
): Data => {
  if (typeof originalData.__typename !== 'string') {
    return originalData;
  }

  const data = Object.create(null);
  data.__typename = originalData.__typename;

  const iter = new SelectionIterator(entityKey, entityKey, select, ctx);

  let node;
  while ((node = iter.next()) !== undefined) {
    const fieldAlias = getFieldAlias(node);
    const fieldValue = originalData[fieldAlias];

    if (
      node.selectionSet !== undefined &&
      fieldValue !== null &&
      !isScalar(fieldValue)
    ) {
      data[fieldAlias] = readRootField(ctx, getSelectionSet(node), fieldValue);
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
    const data: Data = Object.create(null);
    return readSelection(ctx, entityKey, select, data);
  } else {
    const typename = originalData.__typename;
    return readRoot(ctx, typename, select, originalData);
  }
};

const readSelection = (
  ctx: Context,
  entityKey: string,
  select: SelectionSet,
  data: Data
): Data | null => {
  const isQuery = entityKey === 'Query';
  if (!isQuery) addDependency(entityKey);

  const { store, variables } = ctx;

  // Get the __typename field for a given entity to check that it exists
  const typename = isQuery ? 'Query' : store.getField(entityKey, '__typename');
  if (typeof typename !== 'string') {
    ctx.result.completeness = 'EMPTY';
    return null;
  }

  data.__typename = typename;

  const iter = new SelectionIterator(typename, entityKey, select, ctx);

  let node;
  while ((node = iter.next()) !== undefined) {
    // Derive the needed data from our node.
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, variables);
    const fieldAlias = getFieldAlias(node);
    const fieldKey = joinKeys(entityKey, keyOfField(fieldName, fieldArgs));
    const fieldValue = store.getRecord(fieldKey);

    if (isQuery) addDependency(fieldKey);

    const resolvers = store.resolvers[typename];
    if (resolvers !== undefined && resolvers.hasOwnProperty(fieldName)) {
      // We have a resolver for this field.
      if (fieldValue !== undefined) {
        data[fieldAlias] = fieldValue;
      }
      const resolverValue = resolvers[fieldName](
        data,
        fieldArgs || {},
        store,
        ctx
      );

      if (node.selectionSet === undefined) {
        // If it doesn't have a selection set we have resolved a property.
        // We assume that a resolver for scalar values implies that this
        // field is always present, so completeness won't be set to EMPTY here
        data[fieldAlias] = resolverValue !== undefined ? resolverValue : null;
      } else {
        // When it has a selection set we are resolving an entity with a
        // subselection. This can either be a list or an object.
        const fieldSelect = getSelectionSet(node);

        data[fieldAlias] = resolveResolverResult(
          ctx,
          resolverValue,
          fieldKey,
          fieldSelect,
          data[fieldAlias] as Data | Data[]
        );
      }
    } else if (node.selectionSet === undefined) {
      // The field is a scalar and can be retrieved directly
      if (fieldValue === undefined) {
        // Cache Incomplete: A missing field means it wasn't cached
        ctx.result.completeness = 'EMPTY';
        data[fieldAlias] = null;
      } else {
        // Not dealing with undefined means it's a cached field
        data[fieldAlias] = fieldValue;
      }
    } else {
      // null values mean that a field might be linked to other entities
      const fieldSelect = getSelectionSet(node);
      const link = store.getLink(fieldKey);

      // Cache Incomplete: A missing link for a field means it's not cached
      if (link === undefined) {
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          // The entity on the field was invalid and can still be recovered
          data[fieldAlias] = fieldValue;
        } else {
          ctx.result.completeness = 'EMPTY';
          data[fieldAlias] = null;
        }
      } else {
        const prevData = data[fieldAlias] as Data;
        data[fieldAlias] = resolveLink(ctx, link, fieldSelect, prevData);
      }
    }
  }

  return data;
};

const resolveResolverResult = (
  ctx: Context,
  result: DataField,
  key: string,
  select: SelectionSet,
  prevData: void | Data | Data[]
) => {
  // When we are dealing with a list we have to call this method again.
  if (Array.isArray(result)) {
    // @ts-ignore: Link cannot be expressed as a recursive type
    return result.map((childResult, index) => {
      const data = prevData !== undefined ? prevData[index] : undefined;
      const indexKey = joinKeys(key, `${index}`);
      return resolveResolverResult(ctx, childResult, indexKey, select, data);
    });
  } else if (result === null) {
    return null;
  } else if (isDataOrKey(result)) {
    // We don't need to read the entity after exiting a resolver
    // we can just go on and read the selection further.
    const data = prevData === undefined ? Object.create(null) : prevData;
    const childKey =
      (typeof result === 'string' ? result : ctx.store.keyOfEntity(result)) ||
      key;
    const selectionResult = readSelection(ctx, childKey, select, data);

    if (selectionResult !== null && typeof result === 'object') {
      for (key in result) {
        if (key !== '__typename' && result.hasOwnProperty(key)) {
          selectionResult[key] = result[key];
        }
      }
    }

    return selectionResult;
  }

  warning(
    false,
    'Invalid resolver value: The resolver at `%s` returned a scalar (number, boolean, etc)' +
      ', but the GraphQL query expects a selection set for this field.\n' +
      'If necessary, use Cache.resolve() to resolve a link or entity from the cache.',
    key
  );

  ctx.result.completeness = 'EMPTY';
  return null;
};

const resolveLink = (
  ctx: Context,
  link: Link | Link[],
  select: SelectionSet,
  prevData: void | Data | Data[]
): null | Data | Data[] => {
  if (Array.isArray(link)) {
    const newLink = new Array(link.length);
    for (let i = 0, l = link.length; i < l; i++) {
      const data = prevData !== undefined ? prevData[i] : undefined;
      newLink[i] = resolveLink(ctx, link[i], select, data);
    }

    return newLink;
  } else if (link === null) {
    return null;
  } else {
    const data = prevData === undefined ? Object.create(null) : prevData;
    return readSelection(ctx, link, select, data);
  }
};

const isDataOrKey = (x: any): x is string | Data =>
  typeof x === 'string' ||
  (typeof x === 'object' &&
    x !== null &&
    typeof (x as any).__typename === 'string');
