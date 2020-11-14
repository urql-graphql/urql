import { App } from 'vue';

export * from '@urql/core';
export * from './useClient';
export * from './useQuery';
export * from './useMutation';
export * from './useSubscription';
import { install } from './useClient';

export default install;
