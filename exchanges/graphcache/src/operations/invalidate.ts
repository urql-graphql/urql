import * as InMemoryData from '../store/data';
import { Variables, OperationRequest } from '../types';
import { Store, keyOfField } from '../store';
import { read } from './query';

interface PartialFieldInfo {
  fieldKey: string;
}

export const invalidateEntity = (
  entityKey: string,
  field?: string,
  args?: Variables
) => {
  const fields: PartialFieldInfo[] = field
    ? [{ fieldKey: keyOfField(field, args) }]
    : InMemoryData.inspectFields(entityKey);

  for (let i = 0, l = fields.length; i < l; i++) {
    const { fieldKey } = fields[i];
    if (InMemoryData.readLink(entityKey, fieldKey) !== undefined) {
      InMemoryData.writeLink(entityKey, fieldKey, undefined);
    } else {
      InMemoryData.writeRecord(entityKey, fieldKey, undefined);
    }
  }
};

export const invalidate = (store: Store, request: OperationRequest) => {
  const dependencies = InMemoryData.forkDependencies();
  read(store, request);
  InMemoryData.unforkDependencies();

  for (const dependency in dependencies) {
    if (dependency.startsWith(`${store.data.queryRootKey}.`)) {
      const fieldKey = dependency.slice(`${store.data.queryRootKey}.`.length);
      InMemoryData.writeLink(store.data.queryRootKey, fieldKey);
      InMemoryData.writeRecord(store.data.queryRootKey, fieldKey);
    } else {
      invalidateEntity(dependency);
    }
  }

  InMemoryData.gc();
};
