import { DocumentNode, FragmentDefinitionNode } from 'graphql';

import {
  getFieldAlias,
  getFragments,
  getMainOperation,
  getSelectionSet,
  normalizeVariables,
  getFragmentTypeName,
  getName,
  getFieldArguments,
} from '../ast';

import {
  NullArray,
  Fragments,
  Variables,
  Data,
  Link,
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

import { invariant, warning } from '../helpers/help';
import { SelectionIterator, isScalar } from './shared';
import { joinKeys, keyOfField } from '../helpers';
import { SchemaPredicates } from '../ast/schemaPredicates';

export interface WriteResult {
  dependencies: Set<string>;
}

interface Context {
  parentTypeName: string;
  parentKey: string;
  parentFieldKey: string;
  fieldName: string;
  result: WriteResult;
  store: Store;
  variables: Variables;
  fragments: Fragments;
  optimistic?: boolean;
  schemaPredicates?: SchemaPredicates;
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

  const select = getSelectionSet(operation);
  const operationName = store.getRootKey(operation.operation);

  const ctx: Context = {
    parentTypeName: operationName,
    parentKey: operationName,
    parentFieldKey: '',
    fieldName: '',
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    result,
    store,
    schemaPredicates: store.schemaPredicates,
  };

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
  optimisticKey: number
): WriteResult => {
  initStoreState(optimisticKey);

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

  const ctx: Context = {
    parentTypeName: mutationRootKey,
    parentKey: mutationRootKey,
    parentFieldKey: '',
    fieldName: '',
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    result,
    store,
    schemaPredicates: store.schemaPredicates,
    optimistic: true,
  };

  const data = Object.create(null);
  const iter = new SelectionIterator(
    operationName,
    operationName,
    getSelectionSet(operation),
    ctx
  );

  let node;
  while ((node = iter.next()) !== undefined) {
    if (node.selectionSet !== undefined) {
      const fieldName = getName(node);
      const resolver = ctx.store.optimisticMutations[fieldName];

      if (resolver !== undefined) {
        // We have to update the context to reflect up-to-date ResolveInfo
        ctx.fieldName = fieldName;

        const fieldArgs = getFieldArguments(node, ctx.variables);
        const resolverValue = resolver(
          fieldArgs || Object.create(null),
          ctx.store,
          ctx
        );

        if (!isScalar(resolverValue)) {
          writeRootField(ctx, resolverValue, getSelectionSet(node));
        }

        data[fieldName] = resolverValue;
        const updater = ctx.store.updates[mutationRootKey][fieldName];
        if (updater !== undefined) {
          updater(data, fieldArgs || Object.create(null), ctx.store, ctx);
        }
      }
    }
  }

  clearStoreState();
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
    return warning(
      false,
      'writeFragment(...) was called with an empty fragment.\n' +
        'You have to call it with at least one fragment in your GraphQL document.',
      11
    );
  }

  const typename = getFragmentTypeName(fragment);
  const writeData = { __typename: typename, ...data } as Data;
  const entityKey = store.keyOfEntity(writeData);
  if (!entityKey) {
    return warning(
      false,
      "Can't generate a key for writeFragment(...) data.\n" +
        'You have to pass an `id` or `_id` field or create a custom `keys` config for `' +
        typename +
        '`.',
      12
    );
  }

  const ctx: Context = {
    parentTypeName: typename,
    parentKey: entityKey,
    parentFieldKey: '',
    fieldName: '',
    variables: variables || {},
    fragments,
    result: { dependencies: getCurrentDependencies() },
    store,
    schemaPredicates: store.schemaPredicates,
  };

  writeSelection(ctx, entityKey, getSelectionSet(fragment), writeData);
};

const writeSelection = (
  ctx: Context,
  entityKey: string,
  select: SelectionSet,
  data: Data
) => {
  const { store } = ctx;
  const isQuery = entityKey === ctx.store.getRootKey('query');
  const typename = data.__typename;
  if (!isQuery) addDependency(entityKey);

  store.writeField(isQuery ? entityKey : typename, entityKey, '__typename');

  const iter = new SelectionIterator(typename, entityKey, select, ctx);

  let node;
  while ((node = iter.next()) !== undefined) {
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, ctx.variables);
    const fieldKey = joinKeys(entityKey, keyOfField(fieldName, fieldArgs));
    const fieldValue = data[getFieldAlias(node)];

    if (isQuery) addDependency(fieldKey);

    if (process.env.NODE_ENV !== 'production') {
      if (fieldValue === undefined) {
        const advice = ctx.optimistic
          ? '\nYour optimistic result may be missing a field!'
          : '';

        const expected =
          node.selectionSet === undefined
            ? 'scalar (number, boolean, etc)'
            : 'selection set';

        warning(
          false,
          'Invalid undefined: The field at `' +
            fieldKey +
            '` is `undefined`, but the GraphQL query expects a ' +
            expected +
            ' for this field.' +
            advice,
          13
        );

        continue; // Skip this field
      } else if (ctx.schemaPredicates && typename) {
        ctx.schemaPredicates.isFieldAvailableOnType(typename, fieldName);
      }
    }

    if (node.selectionSet === undefined) {
      // This is a leaf node, so we're setting the field's value directly
      store.writeRecord(fieldValue, fieldKey);
    } else if (!isScalar(fieldValue)) {
      // Process the field and write links for the child entities that have been written
      const link = writeField(ctx, fieldKey, getSelectionSet(node), fieldValue);

      store.writeConnection(
        joinKeys(entityKey, fieldName),
        fieldKey,
        fieldArgs
      );

      store.writeLink(link, fieldKey);
      store.removeRecord(fieldKey);
    } else {
      warning(
        false,
        'Invalid value: The field at `' +
          fieldKey +
          '` is a scalar (number, boolean, etc)' +
          ', but the GraphQL query expects a selection set for this field.\n' +
          'The value will still be cached, however this may lead to undefined behavior!',
        14
      );

      // This is a rare case for invalid entities
      store.writeRecord(fieldValue, fieldKey);
    }
  }
};

const writeField = (
  ctx: Context,
  parentFieldKey: string,
  select: SelectionSet,
  data: null | Data | NullArray<Data>
): Link => {
  if (Array.isArray(data)) {
    const newData = new Array(data.length);
    for (let i = 0, l = data.length; i < l; i++) {
      const item = data[i];
      // Append the current index to the parentFieldKey fallback
      const indexKey = joinKeys(parentFieldKey, `${i}`);
      // Recursively write array data
      const links = writeField(ctx, indexKey, select, item);
      // Link cannot be expressed as a recursive type
      newData[i] = links as string | null;
    }

    return newData;
  } else if (data === null) {
    return null;
  }

  const entityKey = ctx.store.keyOfEntity(data);
  const key = entityKey !== null ? entityKey : parentFieldKey;

  if (
    typeof data.__typename !== 'string' ||
    (ctx.store.keys[data.__typename] === undefined && entityKey === null)
  ) {
    const typename = data.__typename;

    warning(
      typename.endsWith('Connection') ||
        typename.endsWith('Edge') ||
        typename === 'PageInfo',
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
  const isRootField =
    typename === ctx.store.getRootKey('mutation') ||
    typename === ctx.store.getRootKey('subscription');

  const iter = new SelectionIterator(typename, typename, select, ctx);

  let node;
  while ((node = iter.next()) !== undefined) {
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, ctx.variables);
    const fieldValue = data[getFieldAlias(node)];

    if (
      node.selectionSet !== undefined &&
      fieldValue !== null &&
      !isScalar(fieldValue)
    ) {
      writeRootField(ctx, fieldValue, getSelectionSet(node));
    }

    if (isRootField) {
      // We have to update the context to reflect up-to-date ResolveInfo
      ctx.parentTypeName = typename;
      ctx.parentKey = typename;
      ctx.parentFieldKey = joinKeys(typename, keyOfField(fieldName, fieldArgs));
      ctx.fieldName = fieldName;

      // We run side-effect updates after the default, normalized updates
      // so that the data is already available in-store if necessary
      const updater = ctx.store.updates[typename][fieldName];
      if (updater !== undefined) {
        updater(data, fieldArgs || Object.create(null), ctx.store, ctx);
      }
    }
  }
};

// This is like writeField but doesn't fall back to a generated key
const writeRootField = (
  ctx: Context,
  data: null | Data | NullArray<Data>,
  select: SelectionSet
) => {
  if (Array.isArray(data)) {
    const newData = new Array(data.length);
    for (let i = 0, l = data.length; i < l; i++)
      newData[i] = writeRootField(ctx, data[i], select);
    return newData;
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
