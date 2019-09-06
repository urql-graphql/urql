import { warning } from '../helpers/warning';
import {
  getFragments,
  getMainOperation,
  getSelectionSet,
  normalizeVariables,
  getName,
  getFieldArguments,
  getFieldAlias,
} from '../ast';

import {
  Fragments,
  Variables,
  Data,
  DataField,
  Link,
  SelectionSet,
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
import { SchemaPredicates } from '../ast/schemaPredicates';

export interface QueryResult {
  dependencies: Set<string>;
  partial: boolean;
  data: null | Data;
}

interface Context {
  partial: boolean;
  store: Store;
  variables: Variables;
  fragments: Fragments;
  schemaPredicates?: SchemaPredicates;
}

export const query = (
  store: Store,
  request: OperationRequest,
  data?: Data
): QueryResult => {
  initStoreState(0);
  const result = read(store, request, data);
  clearStoreState();
  return result;
};

export const read = (
  store: Store,
  request: OperationRequest,
  input?: Data
): QueryResult => {
  const operation = getMainOperation(request.query);
  const rootKey = store.getRootKey(operation.operation);
  const rootSelect = getSelectionSet(operation);

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    partial: false,
    store,
    schemaPredicates: store.schemaPredicates,
  };

  let data = input || Object.create(null);
  data =
    rootKey !== 'Query'
      ? readRoot(ctx, rootKey, rootSelect, data)
      : readSelection(ctx, rootKey, rootSelect, data);

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
    // We assume that since this is used for result data this can never be undefined,
    // since the result data has already been written to the cache
    const newData = Object.create(null);
    const fieldValue = readSelection(ctx, entityKey, select, newData);
    return fieldValue === undefined ? null : fieldValue;
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
): Data | undefined => {
  const { store, variables, schemaPredicates } = ctx;
  const isQuery = entityKey === store.getRootKey('query');
  if (!isQuery) addDependency(entityKey);

  // Get the __typename field for a given entity to check that it exists
  const typename = isQuery
    ? entityKey
    : store.getField(entityKey, '__typename');
  if (typeof typename !== 'string') {
    return undefined;
  }

  data.__typename = typename;
  const iter = new SelectionIterator(typename, entityKey, select, ctx);

  let node;
  let hasFields = false;
  let hasPartials = false;
  while ((node = iter.next()) !== undefined) {
    // Derive the needed data from our node.
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, variables);
    const fieldAlias = getFieldAlias(node);
    const fieldKey = joinKeys(entityKey, keyOfField(fieldName, fieldArgs));
    const fieldValue = store.getRecord(fieldKey);

    if (isQuery) addDependency(fieldKey);

    if (process.env.NODE_ENV !== 'production' && schemaPredicates) {
      schemaPredicates.isFieldAvailableOnType(typename, fieldName);
    }

    // We temporarily store the data field in here, but undefined
    // means that the value is missing from the cache
    let dataFieldValue: void | DataField;

    const resolvers = store.resolvers[typename];
    if (resolvers !== undefined && typeof resolvers[fieldName] === 'function') {
      // We have a resolver for this field.
      // Prepare the actual fieldValue, so that the resolver can use it
      if (fieldValue !== undefined) {
        data[fieldAlias] = fieldValue;
      }

      let resolverValue: DataField | undefined = resolvers[fieldName](
        data,
        fieldArgs || {},
        store,
        ctx
      );

      if (node.selectionSet !== undefined) {
        // When it has a selection set we are resolving an entity with a
        // subselection. This can either be a list or an object.
        resolverValue = resolveResolverResult(
          ctx,
          resolverValue,
          typename,
          fieldName,
          fieldKey,
          getSelectionSet(node),
          data[fieldAlias] as Data | Data[]
        );
      }

      // When we have a schema we check for a user's resolver whether the field is nullable
      // Otherwise we trust the resolver and assume that it is
      const isNull = resolverValue === undefined || resolverValue === null;
      if (isNull && schemaPredicates !== undefined) {
        dataFieldValue = undefined;
      } else {
        dataFieldValue = isNull ? null : resolverValue;
      }
    } else if (node.selectionSet === undefined) {
      // The field is a scalar and can be retrieved directly
      dataFieldValue = fieldValue;
    } else {
      // We have a selection set which means that we'll be checking for links
      const fieldSelect = getSelectionSet(node);
      const link = store.getLink(fieldKey);

      if (link !== undefined) {
        const prevData = data[fieldAlias] as Data;
        dataFieldValue = resolveLink(
          ctx,
          link,
          typename,
          fieldName,
          fieldSelect,
          prevData
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
      schemaPredicates !== undefined &&
      schemaPredicates.isFieldNullable(typename, fieldName)
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
  result: DataField,
  typename: string,
  fieldName: string,
  key: string,
  select: SelectionSet,
  prevData: void | Data | Data[]
): DataField | undefined => {
  // When we are dealing with a list we have to call this method again.
  if (Array.isArray(result)) {
    const { schemaPredicates } = ctx;
    const isListNullable =
      schemaPredicates !== undefined &&
      schemaPredicates.isListNullable(typename, fieldName);
    const newResult = new Array(result.length);
    for (let i = 0, l = result.length; i < l; i++) {
      const data = prevData !== undefined ? prevData[i] : undefined;
      const childKey = joinKeys(key, `${i}`);
      const childResult = resolveResolverResult(
        ctx,
        result[i],
        typename,
        fieldName,
        childKey,
        select,
        data
      );
      if (childResult === undefined && !isListNullable) {
        return undefined;
      } else {
        result[i] = childResult !== undefined ? childResult : null;
      }
    }

    return newResult;
  } else if (result === null) {
    return null;
  } else if (isDataOrKey(result)) {
    // We don't need to read the entity after exiting a resolver
    // we can just go on and read the selection further.
    const data = prevData === undefined ? Object.create(null) : prevData;
    const childKey =
      (typeof result === 'string' ? result : ctx.store.keyOfEntity(result)) ||
      key;
    // TODO: Copy over fields from result but check against schema whether that's safe
    return readSelection(ctx, childKey, select, data);
  }

  warning(
    false,
    'Invalid resolver value: The resolver at `' +
      key +
      '` returned a scalar (number, boolean, etc)' +
      ', but the GraphQL query expects a selection set for this field.\n' +
      'If necessary, use Cache.resolve() to resolve a link or entity from the cache.'
  );

  return undefined;
};

const resolveLink = (
  ctx: Context,
  link: Link | Link[],
  typename: string,
  fieldName: string,
  select: SelectionSet,
  prevData: void | Data | Data[]
): DataField | undefined => {
  if (Array.isArray(link)) {
    const { schemaPredicates } = ctx;
    const isListNullable =
      schemaPredicates !== undefined &&
      schemaPredicates.isListNullable(typename, fieldName);
    const newLink = new Array(link.length);
    for (let i = 0, l = link.length; i < l; i++) {
      const innerPrevData = prevData !== undefined ? prevData[i] : undefined;
      const childLink = resolveLink(
        ctx,
        link[i],
        typename,
        fieldName,
        select,
        innerPrevData
      );
      if (childLink === undefined && !isListNullable) {
        return undefined;
      } else {
        newLink[i] = childLink !== undefined ? childLink : null;
      }
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
