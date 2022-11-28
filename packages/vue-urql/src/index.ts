export * from '@urql/core';

export * from './useClientHandle';
export { install, provideClient } from './useClient';

export { useQuery } from './useQuery';

export type { UseQueryArgs, UseQueryResponse, UseQueryState } from './useQuery';

export { useSubscription } from './useSubscription';

export type {
  UseSubscriptionArgs,
  UseSubscriptionResponse,
  UseSubscriptionState,
  SubscriptionHandlerArg,
  SubscriptionHandler,
} from './useSubscription';

export { useMutation } from './useMutation';

export type { UseMutationResponse, UseMutationState } from './useMutation';

import { install } from './useClient';

export default install;
