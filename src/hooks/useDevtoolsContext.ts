import * as React from 'react';
import { OperationContext } from '../types';

const {
  ReactCurrentOwner: CurrentOwner,
} = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

// Is the Fiber a FunctionComponent, ClassComponent, or IndeterminateComponent
const isComponentFiber = (fiber: void | { tag: number }) =>
  fiber && (fiber.tag === 0 || fiber.tag === 1 || fiber.tag === 2);

// Is the component one of ours (just a heuristic to avoid circular dependencies or flags)
const isInternalComponent = (Component: { name: string }) =>
  Component.name === 'Query' ||
  Component.name === 'Mutation' ||
  Component.name === 'Subscription';

const useDevtoolsContextImpl = (): Partial<OperationContext> => {
  return React.useMemo(() => {
    let source = 'Component';

    // Check whether the CurrentOwner is set
    const owner = CurrentOwner.current;
    if (owner !== null && isComponentFiber(owner)) {
      let Component = owner.type;

      // If this is one of our own components then check the parent
      if (
        isInternalComponent(Component) &&
        isComponentFiber(owner._debugOwner)
      ) {
        Component = owner._debugOwner.type;
      }

      // Get the Component's name if it has one
      if (typeof Component === 'function') {
        source = Component.displayName || Component.name || source;
      }
    }

    return { meta: { source } };
  }, []);
};

/** Creates additional context values for serving metadata to devtools. */
export const useDevtoolsContext: () => Partial<OperationContext> | undefined =
  // NOTE: We check for CurrentOwner in case it'll be unexpectedly changed in React's source
  process.env.NODE_ENV !== 'production' && !!CurrentOwner
    ? useDevtoolsContextImpl
    : () => undefined;
