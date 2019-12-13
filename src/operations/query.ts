import { FieldNode, DocumentNode, FragmentDefinitionNode } from 'graphql';

import {
  getFragments,
  getMainOperation,
  getSelectionSet,
  normalizeVariables,
  getName,
  getFieldArguments,
  getFieldAlias,
  getFragmentTypeName,
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
  getCurrentDependencies,
  initDataState,
  clearDataState,
  makeDict,
  joinKeys,
  keyOfField,
} from '../store';

import * as InMemoryData from '../store/data';
import { warn, pushDebugNode } from '../helpers/help';
import { SelectionIterator, isScalar } from './shared';
import { SchemaPredicates } from '../ast';

export interface QueryResult {
  dependencies: Set<string>;
  partial: boolean;
  data: null | Data;
}

interface Context {
  parentTypeName: string;
  parentKey: string;
  parentFieldKey: string;
  fieldName: string;
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
  initDataState(store.data, 0);
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
  const rootKey = store.getRootKey(operation.operation);
  const rootSelect = getSelectionSet(operation);

  const ctx: Context = {
    parentTypeName: rootKey,
    parentKey: rootKey,
    parentFieldKey: '',
    fieldName: '',
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    partial: false,
    store,
    schemaPredicates: store.schemaPredicates,
  };

  if (process.env.NODE_ENV !== 'production') {
    pushDebugNode(rootKey, operation);
  }

  let data = input || makeDict();
  data =
    rootKey !== ctx.store.getRootKey('query')
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

  const data = makeDict();
  data.__typename = originalData.__typename;

  const iter = new SelectionIterator(entityKey, entityKey, select, ctx);

  let node: FieldNode | void;
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
    const fieldValue = readSelection(ctx, entityKey, select, makeDict());
    return fieldValue === undefined ? null : fieldValue;
  } else {
    return readRoot(ctx, originalData.__typename, select, originalData);
  }
};

export const readFragment = (
  store: Store,
  query: DocumentNode,
  entity: Data | string,
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

  const ctx: Context = {
    parentTypeName: typename,
    parentKey: entityKey,
    parentFieldKey: '',
    fieldName: '',
    variables: variables || {},
    fragments,
    partial: false,
    store,
    schemaPredicates: store.schemaPredicates,
  };

  return (
    readSelection(ctx, entityKey, getSelectionSet(fragment), makeDict()) || null
  );
};

const readSelection = (
  ctx: Context,
  entityKey: string,
  select: SelectionSet,
  data: Data
): Data | undefined => {
  const { store, schemaPredicates } = ctx;
  const isQuery = entityKey === store.getRootKey('query');

  // Get the __typename field for a given entity to check that it exists
  const typename = !isQuery
    ? InMemoryData.readRecord(entityKey, '__typename')
    : entityKey;
  if (typeof typename !== 'string') {
    return undefined;
  }

  data.__typename = typename;
  const iter = new SelectionIterator(typename, entityKey, select, ctx);

  let node: FieldNode | void;
  let hasFields = false;
  let hasPartials = false;
  while ((node = iter.next()) !== undefined) {
    // Derive the needed data from our node.
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, ctx.variables);
    const fieldAlias = getFieldAlias(node);
    const fieldKey = keyOfField(fieldName, fieldArgs);
    const fieldValue = InMemoryData.readRecord(entityKey, fieldKey);
    const key = joinKeys(entityKey, fieldKey);

    if (process.env.NODE_ENV !== 'production' && schemaPredicates && typename) {
      schemaPredicates.isFieldAvailableOnType(typename, fieldName);
    }

    // We temporarily store the data field in here, but undefined
    // means that the value is missing from the cache
    let dataFieldValue: void | DataField;

    const resolvers = store.resolvers[typename];
    if (resolvers !== undefined && typeof resolvers[fieldName] === 'function') {
      // We have to update the information in context to reflect the info
      // that the resolver will receive
      ctx.parentTypeName = typename;
      ctx.parentKey = entityKey;
      ctx.parentFieldKey = key;
      ctx.fieldName = fieldName;

      // We have a resolver for this field.
      // Prepare the actual fieldValue, so that the resolver can use it
      if (fieldValue !== undefined) {
        data[fieldAlias] = fieldValue;
      }

      const resolverValue: DataField | undefined = resolvers[fieldName](
        data,
        fieldArgs || makeDict(),
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
          (data[fieldAlias] as Data) || makeDict(),
          resolverValue
        );
      } else {
        // Otherwise we set the resolverValue, and normalise it to null when there's
        // no schema data to check with whether this field is nullable
        dataFieldValue =
          resolverValue === undefined && schemaPredicates === undefined
            ? null
            : resolverValue;
      }
    } else if (node.selectionSet === undefined) {
      // The field is a scalar and can be retrieved directly
      dataFieldValue = fieldValue;
    } else {
      // We have a selection set which means that we'll be checking for links
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

const readResolverResult = (
  ctx: Context,
  key: string,
  select: SelectionSet,
  data: Data,
  result: Data
): Data | undefined => {
  const { store, schemaPredicates } = ctx;
  const entityKey = store.keyOfEntity(result) || key;
  const resolvedTypename = result.__typename;
  const typename =
    InMemoryData.readRecord(entityKey, '__typename') || resolvedTypename;

  if (
    typeof typename !== 'string' ||
    (resolvedTypename && typename !== resolvedTypename)
  ) {
    // TODO: This may be an invalid error for resolvers that return interfaces
    warn(
      'Invalid resolver data: The resolver at `' +
        entityKey +
        '` returned an ' +
        'invalid typename that could not be reconciled with the cache.',
      8
    );

    return undefined;
  }

  // The following closely mirrors readSelection, but differs only slightly for the
  // sake of resolving from an existing resolver result
  data.__typename = typename;
  const iter = new SelectionIterator(typename, entityKey, select, ctx);

  let node: FieldNode | void;
  let hasFields = false;
  let hasPartials = false;
  while ((node = iter.next()) !== undefined) {
    // Derive the needed data from our node.
    const fieldName = getName(node);
    const fieldAlias = getFieldAlias(node);
    const fieldKey = keyOfField(
      fieldName,
      getFieldArguments(node, ctx.variables)
    );
    const key = joinKeys(entityKey, fieldKey);
    const fieldValue = InMemoryData.readRecord(entityKey, fieldKey);
    const resultValue = result[fieldName];

    if (process.env.NODE_ENV !== 'production' && schemaPredicates && typename) {
      schemaPredicates.isFieldAvailableOnType(typename, fieldName);
    }

    // We temporarily store the data field in here, but undefined
    // means that the value is missing from the cache
    let dataFieldValue: void | DataField;
    if (resultValue !== undefined && node.selectionSet === undefined) {
      // The field is a scalar and can be retrieved directly from the result
      dataFieldValue = resultValue;
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
  return !hasFields ? undefined : data;
};

const resolveResolverResult = (
  ctx: Context,
  typename: string,
  fieldName: string,
  key: string,
  select: SelectionSet,
  prevData: void | Data | Data[],
  result: void | DataField
): DataField | undefined => {
  if (Array.isArray(result)) {
    const { schemaPredicates } = ctx;
    // Check whether values of the list may be null; for resolvers we assume
    // that they can be, since it's user-provided data
    const isListNullable =
      schemaPredicates === undefined ||
      schemaPredicates.isListNullable(typename, fieldName);
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
        prevData !== undefined ? prevData[i] : undefined,
        result[i]
      );

      if (childResult === undefined && !isListNullable) {
        return undefined;
      } else {
        data[i] = childResult !== undefined ? childResult : null;
      }
    }

    return data;
  } else if (result === null || result === undefined) {
    return null;
  } else if (isDataOrKey(result)) {
    const data = prevData === undefined ? makeDict() : prevData;
    return typeof result === 'string'
      ? readSelection(ctx, result, select, data)
      : readResolverResult(ctx, key, select, data, result);
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
  prevData: void | Data | Data[]
): DataField | undefined => {
  if (Array.isArray(link)) {
    const { schemaPredicates } = ctx;
    const isListNullable =
      schemaPredicates !== undefined &&
      schemaPredicates.isListNullable(typename, fieldName);
    const newLink = new Array(link.length);
    for (let i = 0, l = link.length; i < l; i++) {
      const childLink = resolveLink(
        ctx,
        link[i],
        typename,
        fieldName,
        select,
        prevData !== undefined ? prevData[i] : undefined
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
    return readSelection(
      ctx,
      link,
      select,
      prevData === undefined ? makeDict() : prevData
    );
  }
};

const isDataOrKey = (x: any): x is string | Data =>
  typeof x === 'string' ||
  (typeof x === 'object' && typeof (x as any).__typename === 'string');
