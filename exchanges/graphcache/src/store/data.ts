import {
  Link,
  EntityField,
  FieldInfo,
  StorageAdapter,
  SerializedEntries,
} from '../types';

import { makeDict } from '../helpers/dict';
import { invariant, currentDebugStack } from '../helpers/help';
import { fieldInfoOfKey, joinKeys, prefixKey } from './keys';
import { defer } from './timing';

type Dict<T> = Record<string, T>;
type KeyMap<T> = Map<string, T>;
type OptimisticMap<T> = Record<number, T>;

interface NodeMap<T> {
  optimistic: OptimisticMap<KeyMap<Dict<T | undefined>>>;
  base: KeyMap<Dict<T>>;
}

export interface InMemoryData {
  /** Ensure persistence is never scheduled twice at a time */
  persistenceScheduled: boolean;
  /** Batches changes to the data layer that'll be written to `storage` */
  persistenceBatch: SerializedEntries;
  /** Ensure garbage collection is never scheduled twice at a time */
  gcScheduled: boolean;
  /** A list of entities that have been flagged for gargabe collection since no references to them are left */
  gcBatch: Set<string>;
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
  /** A set of Query operation keys that are in-flight and awaiting a result */
  commutativeKeys: Set<number>;
  /** The order of optimistic layers */
  optimisticOrder: number[];
  /** This may be a persistence adapter that will receive changes in a batch */
  storage: StorageAdapter | null;
}

let currentData: null | InMemoryData = null;
let currentDependencies: null | Set<string> = null;
let currentOptimisticKey: null | number = null;

const makeNodeMap = <T>(): NodeMap<T> => ({
  optimistic: makeDict(),
  base: new Map(),
});

/** Before reading or writing the global state needs to be initialised */
export const initDataState = (
  data: InMemoryData,
  layerKey: number | null,
  forceOptimistic?: boolean
) => {
  currentData = data;
  currentDependencies = new Set();
  if (process.env.NODE_ENV !== 'production') {
    currentDebugStack.length = 0;
  }

  if (!layerKey) {
    currentOptimisticKey = null;
  } else if (
    forceOptimistic ||
    (data.commutativeKeys.size > 1 && data.commutativeKeys.has(layerKey))
  ) {
    // An optimistic update of a mutation may force an optimistic layer,
    // or this Query update may be applied optimistically since it's part
    // of a commutate chain
    currentOptimisticKey = layerKey;
    createLayer(data, layerKey);
  } else {
    // Otherwise we don't create an optimistic layer and clear the
    // operation's one if it already exists
    currentOptimisticKey = null;
    clearLayer(data, layerKey);
  }
};

/** Reset the data state after read/write is complete */
export const clearDataState = () => {
  const data = currentData!;
  const optimisticKey = currentOptimisticKey;
  currentOptimisticKey = null;

  if (optimisticKey && data.commutativeKeys.has(optimisticKey)) {
    const commutativeIndex =
      data.optimisticOrder.length - data.commutativeKeys.size;
    const blockingKey = data.optimisticOrder[data.optimisticOrder.length - 1];
    // If this is a Query operation that is in the list of commutative keys
    // and is the "first" one and hence blocking all others, we squash all
    // results and empty the list of commutative keys
    if (blockingKey === optimisticKey) {
      const squash: number[] = [];
      const orderSize = data.optimisticOrder.length;
      // Collect all completed, commutative layers until and excluding the first
      // pending one that overrides the others
      for (let i = commutativeIndex; i < orderSize; i++) {
        const layerKey = data.optimisticOrder[i];
        if (!data.refLock[layerKey]) break;
        squash.unshift(layerKey);
      }

      // Apply all completed, commutative layers
      for (let i = 0, l = squash.length; i < l; i++) {
        squashLayer(squash[i]);
      }
    }
  }

  currentData = null;
  currentDependencies = null;
  if (process.env.NODE_ENV !== 'production') {
    currentDebugStack.length = 0;
  }

  if (!data.gcScheduled && data.gcBatch.size > 0) {
    data.gcScheduled = true;
    defer(() => {
      gc(data);
    });
  }

  if (data.storage && !data.persistenceScheduled) {
    data.persistenceScheduled = true;
    defer(() => {
      data.storage!.write(data.persistenceBatch);
      data.persistenceScheduled = false;
      data.persistenceBatch = makeDict();
    });
  }
};

/** As we're writing, we keep around all the records and links we've read or have written to */
export const getCurrentDependencies = (): Set<string> => {
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
  persistenceScheduled: false,
  persistenceBatch: makeDict(),
  gcScheduled: false,
  queryRootKey,
  gcBatch: new Set(),
  refCount: makeDict(),
  refLock: makeDict(),
  links: makeNodeMap(),
  records: makeNodeMap(),
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

  // This first iterates over optimistic layers (in order)
  for (let i = 0, l = currentData!.optimisticOrder.length; i < l; i++) {
    const optimistic = map.optimistic[currentData!.optimisticOrder[i]];
    // If the node and node value exists it is returned, including undefined
    if (
      optimistic &&
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

/** Adjusts the reference count of an entity on a refCount dict by "by" and updates the gcBatch */
const updateRCForEntity = (
  gcBatch: void | Set<string>,
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
  if (gcBatch !== undefined) {
    if (newCount <= 0) gcBatch.add(entityKey);
    else if (count <= 0 && newCount > 0) gcBatch.delete(entityKey);
  }
};

/** Adjusts the reference counts of all entities of a link on a refCount dict by "by" and updates the gcBatch */
const updateRCForLink = (
  gcBatch: void | Set<string>,
  refCount: Dict<number>,
  link: Link | undefined,
  by: number
): void => {
  if (typeof link === 'string') {
    updateRCForEntity(gcBatch, refCount, link, by);
  } else if (Array.isArray(link)) {
    for (let i = 0, l = link.length; i < l; i++) {
      const entityKey = link[i];
      if (entityKey) {
        updateRCForEntity(gcBatch, refCount, entityKey, by);
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
    extractNodeFields(fieldInfos, seenFieldKeys, optimistic.get(entityKey));
  }
};

/** Garbage collects all entities that have been marked as having no references */
export const gc = (data: InMemoryData) => {
  // Reset gcScheduled flag
  data.gcScheduled = false;
  // Iterate over all entities that have been marked for deletion
  // Entities have been marked for deletion in `updateRCForEntity` if
  // their reference count dropped to 0
  data.gcBatch.forEach(entityKey => {
    // Check first whether the reference count is still 0
    const rc = data.refCount[entityKey] || 0;
    if (rc <= 0) {
      // Each optimistic layer may also still contain some references to marked entities
      for (const optimisticKey in data.refLock) {
        const refCount = data.refLock[optimisticKey];
        const locks = refCount[entityKey] || 0;
        // If the optimistic layer has any references to the entity, don't GC it,
        // otherwise delete the reference count from the optimistic layer
        if (locks > 0) return;
        delete refCount[entityKey];
      }

      // All conditions are met: The entity can be deleted

      // Delete the reference count, and delete the entity from the GC batch
      delete data.refCount[entityKey];
      data.gcBatch.delete(entityKey);

      // Delete the record and for each of its fields, delete them on the persistence
      // layer if one is present
      // No optimistic data needs to be deleted, as the entity is not being referenced by
      // anything and optimistic layers will eventually be deleted anyway
      const recordsNode = data.records.base.get(entityKey);
      if (recordsNode !== undefined) {
        data.records.base.delete(entityKey);
        if (data.storage) {
          for (const fieldKey in recordsNode) {
            const key = prefixKey('r', joinKeys(entityKey, fieldKey));
            data.persistenceBatch[key] = undefined;
          }
        }
      }

      // Delete all the entity's links, but also update the reference count
      // for those links (which can lead to an unrolled recursive GC of the children)
      const linkNode = data.links.base.get(entityKey);
      if (linkNode !== undefined) {
        data.links.base.delete(entityKey);
        for (const fieldKey in linkNode) {
          // Delete all links from the persistence layer if one is present
          if (data.storage) {
            const key = prefixKey('l', joinKeys(entityKey, fieldKey));
            data.persistenceBatch[key] = undefined;
          }

          updateRCForLink(data.gcBatch, data.refCount, linkNode[fieldKey], -1);
        }
      }
    } else {
      data.gcBatch.delete(entityKey);
    }
  });
};

const updateDependencies = (entityKey: string, fieldKey?: string) => {
  if (fieldKey !== '__typename') {
    if (entityKey !== currentData!.queryRootKey) {
      currentDependencies!.add(entityKey);
    } else if (fieldKey !== undefined) {
      currentDependencies!.add(joinKeys(entityKey, fieldKey));
    }
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
  value: EntityField
) => {
  updateDependencies(entityKey, fieldKey);
  setNode(currentData!.records, entityKey, fieldKey, value);
  if (currentData!.storage && !currentOptimisticKey) {
    const key = prefixKey('r', joinKeys(entityKey, fieldKey));
    currentData!.persistenceBatch[key] = value;
  }
};

export const hasField = (entityKey: string, fieldKey: string): boolean =>
  readRecord(entityKey, fieldKey) !== undefined ||
  readLink(entityKey, fieldKey) !== undefined;

/** Writes an entity's link to data */
export const writeLink = (
  entityKey: string,
  fieldKey: string,
  link: Link | undefined
) => {
  const data = currentData!;
  // Retrieve the reference counting dict or the optimistic reference locking dict
  let refCount: Dict<number>;
  // Retrive the link NodeMap from either an optimistic or the base layer
  let links: KeyMap<Dict<Link | undefined>> | undefined;
  // Set the GC batch if we're not optimistically updating
  let gcBatch: void | Set<string>;
  if (currentOptimisticKey) {
    // The refLock counters are also reference counters, but they prevent
    // garbage collection instead of being used to trigger it
    refCount =
      data.refLock[currentOptimisticKey] ||
      (data.refLock[currentOptimisticKey] = makeDict());
    links = data.links.optimistic[currentOptimisticKey];
  } else {
    if (data.storage) {
      const key = prefixKey('l', joinKeys(entityKey, fieldKey));
      data.persistenceBatch[key] = link;
    }
    refCount = data.refCount;
    links = data.links.base;
    gcBatch = data.gcBatch;
  }

  // Retrieve the previous link for this field
  const prevLinkNode = links !== undefined ? links.get(entityKey) : undefined;
  const prevLink = prevLinkNode !== undefined ? prevLinkNode[fieldKey] : null;

  // Update dependencies
  updateDependencies(entityKey, fieldKey);
  // Update the link
  setNode(data.links, entityKey, fieldKey, link);
  // First decrease the reference count for the previous link
  updateRCForLink(gcBatch, refCount, prevLink, -1);
  // Then increase the reference count for the new link
  updateRCForLink(gcBatch, refCount, link, 1);
};

/** Reserves an optimistic layer and preorders it */
export const reserveLayer = (data: InMemoryData, layerKey: number) => {
  if (!data.commutativeKeys.has(layerKey)) {
    // The new layer needs to be reserved in front of all other commutative
    // keys but after all non-commutative keys (which are added by `forceUpdate`)
    data.optimisticOrder.splice(
      data.optimisticOrder.length - data.commutativeKeys.size,
      0,
      layerKey
    );
    data.commutativeKeys.add(layerKey);
  }
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

/** Removes an optimistic layer of links and records */
export const clearLayer = (data: InMemoryData, layerKey: number) => {
  const index = data.optimisticOrder.indexOf(layerKey);
  if (index > -1) {
    data.optimisticOrder.splice(index, 1);
    data.commutativeKeys.delete(layerKey);
  }

  if (data.refLock[layerKey]) {
    delete data.refLock[layerKey];
    delete data.records.optimistic[layerKey];
    delete data.links.optimistic[layerKey];
  }
};

/** Merges an optimistic layer of links and records into the base data */
const squashLayer = (layerKey: number) => {
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

  clearLayer(currentData!, layerKey);
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

export const hydrateData = (
  data: InMemoryData,
  storage: StorageAdapter,
  entries: SerializedEntries
) => {
  initDataState(data, null);
  for (const key in entries) {
    const dotIndex = key.indexOf('.');
    const entityKey = key.slice(2, dotIndex);
    const fieldKey = key.slice(dotIndex + 1);
    switch (key.charCodeAt(0)) {
      case 108:
        writeLink(entityKey, fieldKey, entries[key] as Link);
        break;
      case 114:
        writeRecord(entityKey, fieldKey, entries[key]);
        break;
    }
  }
  clearDataState();
  data.storage = storage;
};
