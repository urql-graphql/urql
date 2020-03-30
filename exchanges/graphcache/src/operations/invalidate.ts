import * as InMemoryData from '../store/data';
import { Variables, OperationRequest } from '../types';
import { Store, keyOfField } from '../store';
import { read } from './query';

export const invalidate = (store: Store, request: OperationRequest) => {
  const dependencies = InMemoryData.forkDependencies();
  read(store, request);

  dependencies.forEach(dependency => {
    if (dependency.startsWith(`${store.data.queryRootKey}.`)) {
      const fieldKey = dependency.slice(`${store.data.queryRootKey}.`.length);
      InMemoryData.writeLink(store.data.queryRootKey, fieldKey);
      InMemoryData.writeRecord(store.data.queryRootKey, fieldKey);
    } else {
      store.invalidate(dependency);
    }
  });

  InMemoryData.unforkDependencies();
};

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
    if (InMemoryData.readLink(entityKey, fieldKey)) {
      InMemoryData.writeLink(entityKey, fieldKey, undefined);
    } else {
      InMemoryData.writeRecord(entityKey, fieldKey, undefined);
    }
  }
};
