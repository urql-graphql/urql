// Re-export everything from @urql/core
export * from '@urql/core';

// Context exports
export { type UseClient, type UseQuery, type UrqlContext } from './context';
export { useClient, useQuery, Provider } from './context';

// Query exports
export { createQuery } from './createQuery';

// Mutation exports
export { type CreateMutationAction } from './createMutation';
export { createMutation } from './createMutation';

// Subscription exports
export {
  type CreateSubscriptionArgs,
  type CreateSubscriptionState,
  type CreateSubscriptionExecute,
  type CreateSubscriptionResult,
  type SubscriptionHandler,
} from './createSubscription';
export { createSubscription } from './createSubscription';

// Utility exports
export { type MaybeAccessor } from './utils';
