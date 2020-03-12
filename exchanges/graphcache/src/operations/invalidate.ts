import * as InMemoryData from '../store/data';
import { OperationRequest } from '../types';
import { Store } from '../store';
import { read } from './query';

export const invalidate = (store: Store, request: OperationRequest) => {
  const dependencies = InMemoryData.forkDependencies();
  read(store, request);

  const queryKey = store.data.queryRootKey;
  const queryField = `${queryKey}.`;

  dependencies.forEach(dependency => {
    if (dependency.startsWith(queryField)) {
      const fieldKey = dependency.slice(queryField.length);
      InMemoryData.writeLink(queryKey, fieldKey, undefined);
      InMemoryData.writeRecord(queryKey, fieldKey, undefined);
    } else {
      store.invalidate(dependency);
    }
  });

  InMemoryData.unforkDependencies();
  InMemoryData.gc(store.data);
};
