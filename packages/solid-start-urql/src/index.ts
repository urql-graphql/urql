// Re-export everything from @urql/core
export * from '@urql/core';

// Context exports
export { type UseClient } from './context';
export { useClient, Provider } from './context';

// Query exports
export { createQuery } from './createQuery';

// Mutation exports
export {
  type CreateMutationState,
  type CreateMutationExecute,
  type CreateMutationResult,
} from './createMutation';
export { createMutation } from './createMutation';

// Subscription exports - re-exported from @urql/solid (no SolidStart-specific changes needed)
export {
  type CreateSubscriptionArgs,
  type CreateSubscriptionState,
  type CreateSubscriptionExecute,
  type CreateSubscriptionResult,
  type SubscriptionHandler,
  createSubscription,
} from '@urql/solid';

// Utility exports
export { type MaybeAccessor } from './utils';
