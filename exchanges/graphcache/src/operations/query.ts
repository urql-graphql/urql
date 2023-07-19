import { formatDocument, FormattedNode, CombinedError } from '@urql/core';

import {
  FieldNode,
  DocumentNode,
  FragmentDefinitionNode,
} from '@0no-co/graphql.web';

import {
  getSelectionSet,
  getName,
  SelectionSet,
  getFragmentTypeName,
  getFieldAlias,
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
  Dependencies,
} from '../types';

import { joinKeys, keyOfField } from '../store/keys';
import { Store } from '../store/store';
import * as InMemoryData from '../store/data';
import { warn, pushDebugNode, popDebugNode } from '../helpers/help';

import {
  Context,
  makeSelectionIterator,
  ensureData,
  makeContext,
  updateContext,
  getFieldError,
  deferRef,
} from './shared';

import {
  isFieldAvailableOnType,
  isFieldNullable,
  isListNullable,
} from '../ast';

export interface QueryResult {
  dependencies: Dependencies;
  partial: boolean;
  hasNext: boolean;
  data: null | Data;
}

/** Reads a GraphQL query from the cache.
 * @internal
 */
export const __initAnd_query = (
  store: Store,
  request: OperationRequest,
  data?: Data | null | undefined,
  error?: CombinedError | undefined,
  key?: number
): QueryResult => {
  InMemoryData.initDataState('read', store.data, key);
  const result = _query(store, request, data, error);
  InMemoryData.clearDataState();
  return result;
};

/** Reads a GraphQL query from the cache.
 * @internal
 */
export const _query = (
  store: Store,
  request: OperationRequest,
  input?: Data | null | undefined,
  error?: CombinedError | undefined
): QueryResult => {
  const query = formatDocument(request.query);
  const operation = getMainOperation(query);
  const rootKey = store.rootFields[operation.operation];
  const rootSelect = getSelectionSet(operation);

  const ctx = makeContext(
    store,
    normalizeVariables(operation, request.variables),
    getFragments(query),
    rootKey,
    rootKey,
    error
  );

  if (process.env.NODE_ENV !== 'production') {
    pushDebugNode(rootKey, operation);
  }

  // NOTE: This may reuse "previous result data" as indicated by the
  // `originalData` argument in readRoot(). This behaviour isn't used
  // for readSelection() however, which always produces results from
  // scratch
  const data =
    rootKey !== ctx.store.rootFields['query']
      ? readRoot(ctx, rootKey, rootSelect, input || InMemoryData.makeData())
      : readSelection(
          ctx,
          rootKey,
          rootSelect,
          input || InMemoryData.makeData()
        );

  if (process.env.NODE_ENV !== 'production') {
    popDebugNode();
    InMemoryData.getCurrentDependencies();
  }

  return {
    dependencies: InMemoryData.currentDependencies!,
    partial: ctx.partial || !data,
    hasNext: ctx.hasNext,
    data: data || null,
  };
};

const readRoot = (
  ctx: Context,
  entityKey: string,
  select: FormattedNode<SelectionSet>,
  input: Data
): Data => {
  const typename = ctx.store.rootNames[entityKey]
    ? entityKey
    : input.__typename;
  if (typeof typename !== 'string') {
    return input;
  }

  const iterate = makeSelectionIterator(
    entityKey,
    entityKey,
    deferRef,
    select,
    ctx
  );

  let node: FormattedNode<FieldNode> | void;
  let hasChanged = InMemoryData.currentForeignData;
  const output = InMemoryData.makeData(input);
  while ((node = iterate())) {
    const fieldAlias = getFieldAlias(node);
    const fieldValue = input[fieldAlias];
    // Add the current alias to the walked path before processing the field's value
    ctx.__internal.path.push(fieldAlias);
    // We temporarily store the data field in here, but undefined
    // means that the value is missing from the cache
    let dataFieldValue: void | DataField;
    if (node.selectionSet && fieldValue !== null) {
      dataFieldValue = readRootField(
        ctx,
        getSelectionSet(node),
        ensureData(fieldValue)
      );
    } else {
      dataFieldValue = fieldValue;
    }

    // Check for any referential changes in the field's value
    hasChanged = hasChanged || dataFieldValue !== fieldValue;
    if (dataFieldValue !== undefined) output[fieldAlias] = dataFieldValue!;

    // After processing the field, remove the current alias from the path again
    ctx.__internal.path.pop();
  }

  return hasChanged ? output : input;
};

const readRootField = (
  ctx: Context,
  select: FormattedNode<SelectionSet>,
  originalData: Link<Data>
): Link<Data> => {
  if (Array.isArray(originalData)) {
    const newData = new Array(originalData.length);
    let hasChanged = InMemoryData.currentForeignData;
    for (let i = 0, l = originalData.length; i < l; i++) {
      // Add the current index to the walked path before reading the field's value
      ctx.__internal.path.push(i);
      // Recursively read the root field's value
      newData[i] = readRootField(ctx, select, originalData[i]);
      hasChanged = hasChanged || newData[i] !== originalData[i];
      // After processing the field, remove the current index from the path
      ctx.__internal.path.pop();
    }

    return hasChanged ? newData : originalData;
  } else if (originalData === null) {
    return null;
  }

  // Write entity to key that falls back to the given parentFieldKey
  const entityKey = ctx.store.keyOfEntity(originalData);
  if (entityKey !== null) {
    // We assume that since this is used for result data this can never be undefined,
    // since the result data has already been written to the cache
    return readSelection(ctx, entityKey, select, originalData) || null;
  } else {
    return readRoot(ctx, originalData.__typename, select, originalData);
  }
};

export const _queryFragment = (
  store: Store,
  query: FormattedNode<DocumentNode>,
  entity: Partial<Data> | string,
  variables?: Variables,
  fragmentName?: string
): Data | null => {
  const fragments = getFragments(query);

  let fragment: FormattedNode<FragmentDefinitionNode>;
  if (fragmentName) {
    fragment = fragments[fragmentName]!;
    if (!fragment) {
      warn(
        'readFragment(...) was called with a fragment name that does not exist.\n' +
          'You provided ' +
          fragmentName +
          ' but could only find ' +
          Object.keys(fragments).join(', ') +
          '.',
        6
      );

      return null;
    }
  } else {
    const names = Object.keys(fragments);
    fragment = fragments[names[0]]!;
    if (!fragment) {
      warn(
        'readFragment(...) was called with an empty fragment.\n' +
          'You have to call it with at least one fragment in your GraphQL document.',
        6
      );

      return null;
    }
  }

  const typename = getFragmentTypeName(fragment);
  if (typeof entity !== 'string' && !entity.__typename)
    entity.__typename = typename;
  const entityKey = store.keyOfEntity(entity as Data);
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
    entityKey,
    undefined
  );

  const result =
    readSelection(
      ctx,
      entityKey,
      getSelectionSet(fragment),
      InMemoryData.makeData()
    ) || null;

  if (process.env.NODE_ENV !== 'production') {
    popDebugNode();
  }

  return result;
};

const readSelection = (
  ctx: Context,
  key: string,
  select: FormattedNode<SelectionSet>,
  input: Data,
  result?: Data
): Data | undefined => {
  const { store } = ctx;
  const isQuery = key === store.rootFields.query;

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

  const resolvers = store.resolvers[typename];
  const iterate = makeSelectionIterator(
    typename,
    entityKey,
    deferRef,
    select,
    ctx
  );

  let hasFields = false;
  let hasPartials = false;
  let hasNext = false;
  let hasChanged = InMemoryData.currentForeignData;
  let node: FormattedNode<FieldNode> | void;
  const output = InMemoryData.makeData(input);
  while ((node = iterate()) !== undefined) {
    const fieldDirectives = Object.keys(node._directives || {}).map(x => x);
    const storeDirective = fieldDirectives.find(x => store.directives[x]);

    // Derive the needed data from our node.
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, ctx.variables);
    const fieldAlias = getFieldAlias(node);
    const fieldKey = keyOfField(fieldName, fieldArgs);
    const key = joinKeys(entityKey, fieldKey);
    const fieldValue = InMemoryData.readRecord(entityKey, fieldKey);
    const resultValue = result ? result[fieldName] : undefined;

    if (process.env.NODE_ENV !== 'production' && store.schema && typename) {
      isFieldAvailableOnType(store.schema, typename, fieldName);
    }

    // Add the current alias to the walked path before processing the field's value
    ctx.__internal.path.push(fieldAlias);
    // We temporarily store the data field in here, but undefined
    // means that the value is missing from the cache
    let dataFieldValue: void | DataField;

    if (fieldName === '__typename') {
      // We directly assign the typename as it's already available
      dataFieldValue = typename;
    } else if (resultValue !== undefined && node.selectionSet === undefined) {
      // The field is a scalar and can be retrieved directly from the result
      dataFieldValue = resultValue;
    } else if (
      InMemoryData.currentOperation === 'read' &&
      ((resolvers && resolvers[fieldName]) || storeDirective)
    ) {
      // We have to update the information in context to reflect the info
      // that the resolver will receive
      updateContext(ctx, output, typename, entityKey, key, fieldName);

      // We have a resolver for this field.
      // Prepare the actual fieldValue, so that the resolver can use it
      if (fieldValue !== undefined) {
        output[fieldAlias] = fieldValue;
      }

      if (resolvers && resolvers[fieldName] && storeDirective) {
        warn(
          `A resolver and directive is being used at "${typename}.${fieldName}", only the directive will apply.`,
          28
        );
      }

      if (resolvers && resolvers[fieldName]) {
        dataFieldValue = resolvers[fieldName]!(
          output,
          fieldArgs || ({} as Variables),
          store,
          ctx
        );
      } else if (storeDirective) {
        const fieldDirective = node._directives![storeDirective];
        const directiveArguments =
          getFieldArguments(fieldDirective, ctx.variables) || {};
        dataFieldValue = store.directives[storeDirective]!(directiveArguments)(
          output,
          fieldArgs || ({} as Variables),
          store,
          ctx
        );
      }

      if (node.selectionSet) {
        // When it has a selection set we are resolving an entity with a
        // subselection. This can either be a list or an object.
        dataFieldValue = resolveResolverResult(
          ctx,
          typename,
          fieldName,
          key,
          getSelectionSet(node),
          (output[fieldAlias] !== undefined
            ? output[fieldAlias]
            : input[fieldAlias]) as Data,
          dataFieldValue,
          InMemoryData.ownsData(input)
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
    } else if (!node.selectionSet) {
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
        (output[fieldAlias] !== undefined
          ? output[fieldAlias]
          : input[fieldAlias]) as Data,
        resultValue,
        InMemoryData.ownsData(input)
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
          (output[fieldAlias] !== undefined
            ? output[fieldAlias]
            : input[fieldAlias]) as Data,
          InMemoryData.ownsData(input)
        );
      } else if (typeof fieldValue === 'object' && fieldValue !== null) {
        // The entity on the field was invalid but can still be recovered
        dataFieldValue = fieldValue;
      }
    }

    // Now that dataFieldValue has been retrieved it'll be set on data
    // If it's uncached (undefined) but nullable we can continue assembling
    // a partial query result
    if (dataFieldValue === undefined && deferRef) {
      // The field is undelivered and uncached, but is included in a deferred fragment
      hasNext = true;
    } else if (
      dataFieldValue === undefined &&
      ((store.schema && isFieldNullable(store.schema, typename, fieldName)) ||
        !!getFieldError(ctx))
    ) {
      // The field is uncached or has errored, so it'll be set to null and skipped
      hasPartials = true;
      dataFieldValue = null;
    } else if (dataFieldValue === undefined) {
      // If the field isn't deferred or partial then we have to abort
      ctx.__internal.path.pop();
      return undefined;
    } else {
      // Otherwise continue as usual
      hasFields = hasFields || fieldName !== '__typename';
    }

    // After processing the field, remove the current alias from the path again
    ctx.__internal.path.pop();
    // Check for any referential changes in the field's value
    hasChanged = hasChanged || dataFieldValue !== input[fieldAlias];
    if (dataFieldValue !== undefined) output[fieldAlias] = dataFieldValue;
  }

  ctx.partial = ctx.partial || hasPartials;
  ctx.hasNext = ctx.hasNext || hasNext;
  return isQuery && hasPartials && !hasFields
    ? undefined
    : hasChanged
    ? output
    : input;
};

const resolveResolverResult = (
  ctx: Context,
  typename: string,
  fieldName: string,
  key: string,
  select: FormattedNode<SelectionSet>,
  prevData: void | null | Data | Data[],
  result: void | DataField,
  isOwnedData: boolean
): DataField | void => {
  if (Array.isArray(result)) {
    const { store } = ctx;
    // Check whether values of the list may be null; for resolvers we assume
    // that they can be, since it's user-provided data
    const _isListNullable = store.schema
      ? isListNullable(store.schema, typename, fieldName)
      : false;
    const data = InMemoryData.makeData(prevData, true);
    let hasChanged =
      InMemoryData.currentForeignData ||
      !Array.isArray(prevData) ||
      result.length !== prevData.length;
    for (let i = 0, l = result.length; i < l; i++) {
      // Add the current index to the walked path before reading the field's value
      ctx.__internal.path.push(i);
      // Recursively read resolver result
      const childResult = resolveResolverResult(
        ctx,
        typename,
        fieldName,
        joinKeys(key, `${i}`),
        select,
        prevData != null ? prevData[i] : undefined,
        result[i],
        isOwnedData
      );
      // After processing the field, remove the current index from the path
      ctx.__internal.path.pop();
      // Check the result for cache-missed values
      if (childResult === undefined && !_isListNullable) {
        return undefined;
      } else {
        ctx.partial =
          ctx.partial || (childResult === undefined && _isListNullable);
        data[i] = childResult != null ? childResult : null;
        hasChanged = hasChanged || data[i] !== prevData![i];
      }
    }

    return hasChanged ? data : prevData;
  } else if (result === null || result === undefined) {
    return result;
  } else if (!isOwnedData && prevData === null) {
    return null;
  } else if (isDataOrKey(result)) {
    const data = (prevData || InMemoryData.makeData(prevData)) as Data;
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
  select: FormattedNode<SelectionSet>,
  prevData: void | null | Data | Data[],
  isOwnedData: boolean
): DataField | undefined => {
  if (Array.isArray(link)) {
    const { store } = ctx;
    const _isListNullable = store.schema
      ? isListNullable(store.schema, typename, fieldName)
      : false;
    const newLink = InMemoryData.makeData(prevData, true);
    let hasChanged =
      InMemoryData.currentForeignData ||
      !Array.isArray(prevData) ||
      link.length !== prevData.length;
    for (let i = 0, l = link.length; i < l; i++) {
      // Add the current index to the walked path before reading the field's value
      ctx.__internal.path.push(i);
      // Recursively read the link
      const childLink = resolveLink(
        ctx,
        link[i],
        typename,
        fieldName,
        select,
        prevData != null ? prevData[i] : undefined,
        isOwnedData
      );
      // After processing the field, remove the current index from the path
      ctx.__internal.path.pop();
      // Check the result for cache-missed values
      if (childLink === undefined && !_isListNullable) {
        return undefined;
      } else {
        ctx.partial =
          ctx.partial || (childLink === undefined && _isListNullable);
        newLink[i] = childLink || null;
        hasChanged = hasChanged || newLink[i] !== prevData![i];
      }
    }

    return hasChanged ? newLink : (prevData as Data[]);
  } else if (link === null || (prevData === null && isOwnedData)) {
    return null;
  }

  return readSelection(
    ctx,
    link,
    select,
    (prevData || InMemoryData.makeData(prevData)) as Data
  );
};

const isDataOrKey = (x: any): x is string | Data =>
  typeof x === 'string' ||
  (typeof x === 'object' && typeof (x as any).__typename === 'string');
