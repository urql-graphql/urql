import * as InMemoryData from '../store/data';
import { OperationRequest } from '../types';
import { Store } from '../store';
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
  InMemoryData.gc(store.data);
};
