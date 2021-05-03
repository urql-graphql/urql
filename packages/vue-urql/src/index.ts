export * from '@urql/core';

export * from './useClientHandle';
export { install, provideClient } from './useClient';

export {
  useQuery,
  UseQueryArgs,
  UseQueryResponse,
  UseQueryState,
} from './useQuery';

export {
  useSubscription,
  UseSubscriptionArgs,
  UseSubscriptionResponse,
  UseSubscriptionState,
  SubscriptionHandlerArg,
  SubscriptionHandler,
} from './useSubscription';

export {
  useMutation,
  UseMutationResponse,
  UseMutationState,
} from './useMutation';

import { install } from './useClient';

export default install;
