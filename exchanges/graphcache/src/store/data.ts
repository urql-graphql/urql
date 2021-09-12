import { stringifyVariables } from '@urql/core';

import {
  Link,
  EntityField,
  FieldInfo,
  StorageAdapter,
  SerializedEntries,
  Dependencies,
  OperationType,
  Data,
} from '../types';

import {
  serializeKeys,
  deserializeKeyInfo,
  fieldInfoOfKey,
  joinKeys,
} from './keys';

import { makeDict } from '../helpers/dict';
import { invariant, currentDebugStack } from '../helpers/help';

type Dict<T> = Record<string, T>;
type KeyMap<T> = Map<string, T>;
type OptimisticMap<T> = Record<number, T>;

interface NodeMap<T> {
  optimistic: OptimisticMap<KeyMap<Dict<T | undefined>>>;
  base: KeyMap<Dict<T>>;
}

export interface InMemoryData {
  /** Flag for whether deferred tasks have been scheduled yet */
  defer: boolean;
  /** A list of entities that have been flagged for gargabe collection since no references to them are left */
  gc: Set<string>;
  /** A list of entity+field keys that will be persisted */
  persist: Set<string>;
  /** The API's "Query" typename which is needed to filter dependencies */
  queryRootKey: string;
  /** Number of references to each entity (except "Query") */
  refCount: Dict<number>;
  /** Number of references to each entity on optimistic layers */
  refLock: OptimisticMap<Dict<number>>;
  /** A map of entity fields (key-value entries per entity) */
  records: NodeMap<EntityField>;
  /** A map of entity links which are connections from one entity to another (key-value entries per entity) */
  links: NodeMap<Link>;
  /** A set of Query operation keys that are in-flight and deferred/streamed */
  deferredKeys: Set<number>;
  /** A set of Query operation keys that are in-flight and awaiting a result */
  commutativeKeys: Set<number>;
  /** The order of optimistic layers */
  optimisticOrder: number[];
  /** This may be a persistence adapter that will receive changes in a batch */
  storage: StorageAdapter | null;
}

let currentOwnership: null | Set<Data> = null;
let currentDataMapping: null | Map<Data, Data> = null;
let currentOperation: null | OperationType = null;
let currentData: null | InMemoryData = null;
let currentDependencies: null | Dependencies = null;
let currentOptimisticKey: null | number = null;
let currentOptimistic = false;

const makeNodeMap = <T>(): NodeMap<T> => ({
  optimistic: makeDict(),
  base: new Map(),
});

/** Creates a new data object unless it's been created in this data run */
export const makeData = (data?: Data): Data => {
  let newData: Data;
  if (data) {
    if (currentOwnership!.has(data)) return data;
    newData = currentDataMapping!.get(data) || ({ ...data } as Data);
    currentDataMapping!.set(data, newData);
  } else {
    newData = {} as Data;
  }

  currentOwnership!.add(newData);
  return newData;
};

export const ownsData = (data?: Data): boolean =>
  !!data && currentOwnership!.has(data);

/** Before reading or writing the global state needs to be initialised */
export const initDataState = (
  operationType: OperationType,
  data: InMemoryData,
  layerKey?: number | null,
  isOptimistic?: boolean
) => {
  currentOwnership = new Set();
  currentDataMapping = new Map();
  currentOperation = operationType;
  currentData = data;
  currentDependencies = makeDict();
  currentOptimistic = !!isOptimistic;
  if (process.env.NODE_ENV !== 'production') {
    currentDebugStack.length = 0;
  }

  if (!layerKey) {
    currentOptimisticKey = null;
  } else if (isOptimistic || data.optimisticOrder.length > 0) {
    // If this operation isn't optimistic and we see it for the first time,
    // then it must've been optimistic in the past, so we can proactively
    // clear the optimistic data before writing
    if (!isOptimistic && !data.commutativeKeys.has(layerKey)) {
      reserveLayer(data, layerKey);
    } else if (isOptimistic) {
      // NOTE: This optimally shouldn't happen as it implies that an optimistic
      // write is being performed after a concrete write.
      data.commutativeKeys.delete(layerKey);
    }

    // An optimistic update of a mutation may force an optimistic layer,
    // or this Query update may be applied optimistically since it's part
    // of a commutative chain
    currentOptimisticKey = layerKey;
    createLayer(data, layerKey);
  } else {
    // Otherwise we don't create an optimistic layer and clear the
    // operation's one if it already exists
    currentOptimisticKey = null;
    deleteLayer(data, layerKey);
  }
};

/** Reset the data state after read/write is complete */
export const clearDataState = () => {
  // NOTE: This is only called to check for the invariant to pass
  if (process.env.NODE_ENV !== 'production') {
    getCurrentDependencies();
  }

  const data = currentData!;
  const layerKey = currentOptimisticKey;
  currentOptimistic = false;
  currentOptimisticKey = null;

  // Determine whether the current operation has been a commutative layer
  if (layerKey && data.optimisticOrder.indexOf(layerKey) > -1) {
    // Squash all layers in reverse order (low priority upwards) that have
    // been written already
    let i = data.optimisticOrder.length;
    while (
      --i >= 0 &&
      data.refLock[data.optimisticOrder[i]] &&
      data.commutativeKeys.has(data.optimisticOrder[i]) &&
      !data.deferredKeys.has(data.optimisticOrder[i])
    ) {
      squashLayer(data.optimisticOrder[i]);
    }
  }

  currentOwnership = null;
  currentDataMapping = null;
  currentOperation = null;
  currentData = null;
  currentDependencies = null;
  if (process.env.NODE_ENV !== 'production') {
    currentDebugStack.length = 0;
  }

  // Schedule deferred tasks if we haven't already
  if (process.env.NODE_ENV !== 'test' && !data.defer) {
    data.defer = true;
    Promise.resolve().then(() => {
      initDataState('read', data, null);
      gc();
      persistData();
      clearDataState();
      data.defer = false;
    });
  }
};

/** Initialises then resets the data state, which may squash this layer if necessary */
export const noopDataState = (
  data: InMemoryData,
  layerKey: number | null,
  isOptimistic?: boolean
) => {
  if (layerKey && !isOptimistic) data.deferredKeys.delete(layerKey);
  initDataState('read', data, layerKey, isOptimistic);
  clearDataState();
};

export const getCurrentOperation = (): OperationType => {
  invariant(
    currentOperation !== null,
    'Invalid Cache call: The cache may only be accessed or mutated during' +
      'operations like write or query, or as part of its resolvers, updaters, ' +
      'or optimistic configs.',
    2
  );

  return currentOperation;
};

/** As we're writing, we keep around all the records and links we've read or have written to */
export const getCurrentDependencies = (): Dependencies => {
  invariant(
    currentDependencies !== null,
    'Invalid Cache call: The cache may only be accessed or mutated during' +
      'operations like write or query, or as part of its resolvers, updaters, ' +
      'or optimistic configs.',
    2
  );

  return currentDependencies;
};

export const make = (queryRootKey: string): InMemoryData => ({
  defer: false,
  gc: new Set(),
  persist: new Set(),
  queryRootKey,
  refCount: makeDict(),
  refLock: makeDict(),
  links: makeNodeMap(),
  records: makeNodeMap(),
  deferredKeys: new Set(),
  commutativeKeys: new Set(),
  optimisticOrder: [],
  storage: null,
});

/** Adds a node value to a NodeMap (taking optimistic values into account */
const setNode = <T>(
  map: NodeMap<T>,
  entityKey: string,
  fieldKey: string,
  value: T
) => {
  // Optimistic values are written to a map in the optimistic dict
  // All other values are written to the base map
  const keymap: KeyMap<Dict<T | undefined>> = currentOptimisticKey
    ? map.optimistic[currentOptimisticKey]
    : map.base;

  // On the map itself we get or create the entity as a dict
  let entity = keymap.get(entityKey) as Dict<T | undefined>;
  if (entity === undefined) {
    keymap.set(entityKey, (entity = makeDict()));
  }

  // If we're setting undefined we delete the node's entry
  // On optimistic layers we actually set undefined so it can
  // override the base value
  if (value === undefined && !currentOptimisticKey) {
    delete entity[fieldKey];
  } else {
    entity[fieldKey] = value;
  }
};

/** Gets a node value from a NodeMap (taking optimistic values into account */
const getNode = <T>(
  map: NodeMap<T>,
  entityKey: string,
  fieldKey: string
): T | undefined => {
  let node: Dict<T | undefined> | undefined;
  // A read may be initialised to skip layers until its own, which is useful for
  // reading back written data. It won't skip over optimistic layers however
  let skip =
    !currentOptimistic &&
    currentOperation === 'read' &&
    currentOptimisticKey &&
    currentData!.commutativeKeys.has(currentOptimisticKey);
  // This first iterates over optimistic layers (in order)
  for (let i = 0, l = currentData!.optimisticOrder.length; i < l; i++) {
    const layerKey = currentData!.optimisticOrder[i];
    const optimistic = map.optimistic[layerKey];
    // If we're reading starting from a specific layer, we skip until a match
    skip = skip && layerKey !== currentOptimisticKey;
    // If the node and node value exists it is returned, including undefined
    if (
      optimistic &&
      (!skip || !currentData!.commutativeKeys.has(layerKey)) &&
      (!currentOptimistic ||
        currentOperation === 'write' ||
        currentData!.commutativeKeys.has(layerKey)) &&
      (node = optimistic.get(entityKey)) !== undefined &&
      fieldKey in node
    ) {
      return node[fieldKey];
    }
  }

  // Otherwise we read the non-optimistic base value
  node = map.base.get(entityKey);
  return node !== undefined ? node[fieldKey] : undefined;
};

/** Adjusts the reference count of an entity on a refCount dict by "by" and updates the gc */
const updateRCForEntity = (
  gc: void | Set<string>,
  refCount: Dict<number>,
  entityKey: string,
  by: number
): void => {
  // Retrieve the reference count
  const count = refCount[entityKey] !== undefined ? refCount[entityKey] : 0;
  // Adjust it by the "by" value
  const newCount = (refCount[entityKey] = (count + by) | 0);
  // Add it to the garbage collection batch if it needs to be deleted or remove it
  // from the batch if it needs to be kept
  if (gc !== undefined) {
    if (newCount <= 0) gc.add(entityKey);
    else if (count <= 0 && newCount > 0) gc.delete(entityKey);
  }
};

/** Adjusts the reference counts of all entities of a link on a refCount dict by "by" and updates the gc */
const updateRCForLink = (
  gc: void | Set<string>,
  refCount: Dict<number>,
  link: Link | undefined,
  by: number
): void => {
  if (typeof link === 'string') {
    updateRCForEntity(gc, refCount, link, by);
  } else if (Array.isArray(link)) {
    for (let i = 0, l = link.length; i < l; i++) {
      if (Array.isArray(link[i])) {
        updateRCForLink(gc, refCount, link[i], by);
      } else if (link[i]) {
        updateRCForEntity(gc, refCount, link[i] as string, by);
      }
    }
  }
};

/** Writes all parsed FieldInfo objects of a given node dict to a given array if it hasn't been seen */
const extractNodeFields = <T>(
  fieldInfos: FieldInfo[],
  seenFieldKeys: Set<string>,
  node: Dict<T> | undefined
): void => {
  if (node !== undefined) {
    for (const fieldKey in node) {
      if (!seenFieldKeys.has(fieldKey)) {
        // If the node hasn't been seen the serialized fieldKey is turnt back into
        // a rich FieldInfo object that also contains the field's name and arguments
        fieldInfos.push(fieldInfoOfKey(fieldKey));
        seenFieldKeys.add(fieldKey);
      }
    }
  }
};

/** Writes all parsed FieldInfo objects of all nodes in a NodeMap to a given array */
const extractNodeMapFields = <T>(
  fieldInfos: FieldInfo[],
  seenFieldKeys: Set<string>,
  entityKey: string,
  map: NodeMap<T>
) => {
  // Extracts FieldInfo for the entity in the base map
  extractNodeFields(fieldInfos, seenFieldKeys, map.base.get(entityKey));

  // Then extracts FieldInfo for the entity from the optimistic maps
  for (let i = 0, l = currentData!.optimisticOrder.length; i < l; i++) {
    const optimistic = map.optimistic[currentData!.optimisticOrder[i]];
    if (optimistic !== undefined) {
      extractNodeFields(fieldInfos, seenFieldKeys, optimistic.get(entityKey));
    }
  }
};

/** Garbage collects all entities that have been marked as having no references */
export const gc = () => {
  // Iterate over all entities that have been marked for deletion
  // Entities have been marked for deletion in `updateRCForEntity` if
  // their reference count dropped to 0
  currentData!.gc.forEach((entityKey: string, _, batch: Set<string>) => {
    // Check first whether the reference count is still 0
    const rc = currentData!.refCount[entityKey] || 0;
    if (rc > 0) {
      batch.delete(entityKey);
      return;
    }

    // Each optimistic layer may also still contain some references to marked entities
    for (const layerKey in currentData!.refLock) {
      const refCount = currentData!.refLock[layerKey];
      const locks = refCount[entityKey] || 0;
      // If the optimistic layer has any references to the entity, don't GC it,
      // otherwise delete the reference count from the optimistic layer
      if (locks > 0) return;
      delete refCount[entityKey];
    }

    // Delete the reference count, and delete the entity from the GC batch
    delete currentData!.refCount[entityKey];
    batch.delete(entityKey);
    currentData!.records.base.delete(entityKey);
    const linkNode = currentData!.links.base.get(entityKey);
    if (linkNode) {
      currentData!.links.base.delete(entityKey);
      for (const fieldKey in linkNode) {
        updateRCForLink(batch, currentData!.refCount, linkNode[fieldKey], -1);
      }
    }
  });
};

const updateDependencies = (entityKey: string, fieldKey?: string) => {
  if (fieldKey !== '__typename') {
    if (entityKey !== currentData!.queryRootKey) {
      currentDependencies![entityKey] = true;
    } else if (fieldKey !== undefined) {
      currentDependencies![joinKeys(entityKey, fieldKey)] = true;
    }
  }
};

const updatePersist = (entityKey: string, fieldKey: string) => {
  if (!currentOptimistic && currentData!.storage) {
    currentData!.persist.add(serializeKeys(entityKey, fieldKey));
  }
};

/** Reads an entity's field (a "record") from data */
export const readRecord = (
  entityKey: string,
  fieldKey: string
): EntityField => {
  updateDependencies(entityKey, fieldKey);
  return getNode(currentData!.records, entityKey, fieldKey);
};

/** Reads an entity's link from data */
export const readLink = (
  entityKey: string,
  fieldKey: string
): Link | undefined => {
  updateDependencies(entityKey, fieldKey);
  return getNode(currentData!.links, entityKey, fieldKey);
};

/** Writes an entity's field (a "record") to data */
export const writeRecord = (
  entityKey: string,
  fieldKey: string,
  value?: EntityField
) => {
  updateDependencies(entityKey, fieldKey);
  updatePersist(entityKey, fieldKey);
  setNode(currentData!.records, entityKey, fieldKey, value);
};

export const hasField = (entityKey: string, fieldKey: string): boolean =>
  readRecord(entityKey, fieldKey) !== undefined ||
  readLink(entityKey, fieldKey) !== undefined;

/** Writes an entity's link to data */
export const writeLink = (
  entityKey: string,
  fieldKey: string,
  link?: Link | undefined
) => {
  const data = currentData!;
  // Retrieve the reference counting dict or the optimistic reference locking dict
  let refCount: Dict<number>;
  // Retrive the link NodeMap from either an optimistic or the base layer
  let links: KeyMap<Dict<Link | undefined>> | undefined;
  // Set the GC batch if we're not optimistically updating
  let gc: void | Set<string>;
  if (currentOptimisticKey) {
    // The refLock counters are also reference counters, but they prevent
    // garbage collection instead of being used to trigger it
    refCount =
      data.refLock[currentOptimisticKey] ||
      (data.refLock[currentOptimisticKey] = makeDict());
    links = data.links.optimistic[currentOptimisticKey];
  } else {
    refCount = data.refCount;
    links = data.links.base;
    gc = data.gc;
  }

  // Retrieve the previous link for this field
  const prevLinkNode = links && links.get(entityKey);
  const prevLink = prevLinkNode && prevLinkNode[fieldKey];

  // Update persistence batch and dependencies
  updateDependencies(entityKey, fieldKey);
  updatePersist(entityKey, fieldKey);
  // Update the link
  setNode(data.links, entityKey, fieldKey, link);
  // First decrease the reference count for the previous link
  updateRCForLink(gc, refCount, prevLink, -1);
  // Then increase the reference count for the new link
  updateRCForLink(gc, refCount, link, 1);
};

/** Reserves an optimistic layer and preorders it */
export const reserveLayer = (
  data: InMemoryData,
  layerKey: number,
  hasNext?: boolean
) => {
  const index = data.optimisticOrder.indexOf(layerKey);
  if (index === -1) {
    // The new layer needs to be reserved in front of all other commutative
    // keys but after all non-commutative keys (which are added by `forceUpdate`)
    data.optimisticOrder.unshift(layerKey);
  } else if (!data.commutativeKeys.has(layerKey)) {
    // Protect optimistic layers from being turned into non-optimistic layers
    // while preserving optimistic data
    clearLayer(data, layerKey);
    // If the layer was an optimistic layer prior to this call, it'll be converted
    // to a new non-optimistic layer and shifted ahead
    data.optimisticOrder.splice(index, 1);
    data.optimisticOrder.unshift(layerKey);
  }

  if (hasNext) {
    data.deferredKeys.add(layerKey);
  } else {
    data.deferredKeys.delete(layerKey);
  }

  data.commutativeKeys.add(layerKey);
};

/** Creates an optimistic layer of links and records */
const createLayer = (data: InMemoryData, layerKey: number) => {
  if (data.optimisticOrder.indexOf(layerKey) === -1) {
    data.optimisticOrder.unshift(layerKey);
  }

  if (!data.refLock[layerKey]) {
    data.refLock[layerKey] = makeDict();
    data.links.optimistic[layerKey] = new Map();
    data.records.optimistic[layerKey] = new Map();
  }
};

/** Clears all links and records of an optimistic layer */
const clearLayer = (data: InMemoryData, layerKey: number) => {
  if (data.refLock[layerKey]) {
    delete data.refLock[layerKey];
    delete data.records.optimistic[layerKey];
    delete data.links.optimistic[layerKey];
    data.deferredKeys.delete(layerKey);
  }
};

/** Deletes links and records of an optimistic layer, and the layer itself */
const deleteLayer = (data: InMemoryData, layerKey: number) => {
  const index = data.optimisticOrder.indexOf(layerKey);
  if (index > -1) {
    data.optimisticOrder.splice(index, 1);
    data.commutativeKeys.delete(layerKey);
  }

  clearLayer(data, layerKey);
};

/** Merges an optimistic layer of links and records into the base data */
const squashLayer = (layerKey: number) => {
  // Hide current dependencies from squashing operations
  const previousDependencies = currentDependencies;
  currentDependencies = makeDict();

  const links = currentData!.links.optimistic[layerKey];
  if (links) {
    links.forEach((keyMap, entityKey) => {
      for (const fieldKey in keyMap)
        writeLink(entityKey, fieldKey, keyMap[fieldKey]);
    });
  }

  const records = currentData!.records.optimistic[layerKey];
  if (records) {
    records.forEach((keyMap, entityKey) => {
      for (const fieldKey in keyMap)
        writeRecord(entityKey, fieldKey, keyMap[fieldKey]);
    });
  }

  currentDependencies = previousDependencies;
  deleteLayer(currentData!, layerKey);
};

/** Return an array of FieldInfo (info on all the fields and their arguments) for a given entity */
export const inspectFields = (entityKey: string): FieldInfo[] => {
  const { links, records } = currentData!;
  const fieldInfos: FieldInfo[] = [];
  const seenFieldKeys: Set<string> = new Set();
  // Update dependencies
  updateDependencies(entityKey);
  // Extract FieldInfos to the fieldInfos array for links and records
  // This also deduplicates by keeping track of fieldKeys in the seenFieldKeys Set
  extractNodeMapFields(fieldInfos, seenFieldKeys, entityKey, links);
  extractNodeMapFields(fieldInfos, seenFieldKeys, entityKey, records);
  return fieldInfos;
};

export const persistData = () => {
  if (currentData!.storage) {
    currentOptimistic = true;
    currentOperation = 'read';
    const entries: SerializedEntries = makeDict();
    currentData!.persist.forEach(key => {
      const { entityKey, fieldKey } = deserializeKeyInfo(key);
      let x: void | Link | EntityField;
      if ((x = readLink(entityKey, fieldKey)) !== undefined) {
        entries[key] = `:${stringifyVariables(x)}`;
      } else if ((x = readRecord(entityKey, fieldKey)) !== undefined) {
        entries[key] = stringifyVariables(x);
      } else {
        entries[key] = undefined;
      }
    });

    currentOptimistic = false;
    currentData!.storage.writeData(entries);
    currentData!.persist.clear();
  }
};

export const hydrateData = (
  data: InMemoryData,
  storage: StorageAdapter,
  entries: SerializedEntries
) => {
  initDataState('write', data, null);

  for (const key in entries) {
    const value = entries[key];
    if (value !== undefined) {
      const { entityKey, fieldKey } = deserializeKeyInfo(key);
      if (value[0] === ':') {
        writeLink(entityKey, fieldKey, JSON.parse(value.slice(1)));
      } else {
        writeRecord(entityKey, fieldKey, JSON.parse(value));
      }
    }
  }

  clearDataState();
  data.storage = storage;
};
