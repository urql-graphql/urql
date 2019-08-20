import {
  forEachFieldNode,
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

import { joinKeys, keyOfEntity, keyOfField } from '../helpers';
import { DocumentNode, FragmentDefinitionNode } from 'graphql';

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

  const operation = getMainOperation(request.query);
  const result: WriteResult = { dependencies: getCurrentDependencies() };

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    result,
    store,
  };

  const select = getSelectionSet(operation);
  if (operation.operation === 'query') {
    writeSelection(ctx, 'Query', select, data);
  } else {
    writeRoot(ctx, select, data);
  }

  clearStoreState();
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

  if (operation.operation === 'mutation') {
    const select = getSelectionSet(operation);

    // TODO: This is very similar to writeRoot & writeRootField
    forEachFieldNode(select, ctx.fragments, ctx.variables, node => {
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
  if (process.env.NODE_ENV !== 'production' && fragment === undefined) {
    throw new Error('At least one fragment must be passed to writeFragment.');
  }

  const select = getSelectionSet(fragment);
  const fieldName = getFragmentTypeName(fragment);
  const writeData = { ...data, __typename: fieldName } as Data;

  const entityKey = keyOfEntity(writeData) as string;
  if (process.env.NODE_ENV !== 'production' && !entityKey) {
    throw new Error(
      `You have to pass an "id" or "_id" with your writeFragment data.`
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
  const isQuery = entityKey === 'Query';
  if (!isQuery) addDependency(entityKey);

  const { store, fragments, variables } = ctx;
  store.writeField(data.__typename, entityKey, '__typename');
  forEachFieldNode(select, fragments, variables, node => {
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

  const entityKey = keyOfEntity(data);
  const key = entityKey !== null ? entityKey : parentFieldKey;
  writeSelection(ctx, key, select, data);
  return key;
};

// This is like writeSelection but assumes no parent entity exists
const writeRoot = (ctx: Context, select: SelectionSet, data: Data) => {
  const { fragments, variables } = ctx;
  forEachFieldNode(select, fragments, variables, node => {
    const fieldName = getName(node);
    const fieldAlias = getFieldAlias(node);
    const fieldArgs = getFieldArguments(node, variables);
    const fieldValue = data[fieldAlias];

    if (ctx.store.updates[fieldName]) {
      // TODO: Should this really always replace the default logic?
      // If it does, there's no way for the user to write everything else to the store
      // It should probably run after the default writeRootField
      return ctx.store.updates[fieldName](
        data,
        fieldArgs || {},
        ctx.store,
        ctx
      );
    }

    if (
      node.selectionSet !== undefined &&
      fieldValue !== null &&
      !isScalar(fieldValue)
    ) {
      const { selections: fieldSelect } = node.selectionSet;
      writeRootField(ctx, fieldValue, fieldSelect);
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
  const entityKey = keyOfEntity(data);
  if (entityKey !== null) {
    writeSelection(ctx, entityKey, select, data);
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
