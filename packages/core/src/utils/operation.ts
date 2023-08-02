import type {
  AnyVariables,
  GraphQLRequest,
  Operation,
  OperationContext,
  OperationType,
} from '../types';

/** Creates a {@link Operation} from the given parameters.
 *
 * @param kind - The {@link OperationType} of GraphQL operation, i.e. `query`, `mutation`, or `subscription`.
 * @param request - The {@link GraphQLRequest} or {@link Operation} used as a template for the new `Operation`.
 * @param context - The {@link OperationContext} `context` data for the `Operation`.
 * @returns A new {@link Operation}.
 *
 * @remarks
 * This method is both used to create new {@link Operation | Operations} as well as copy and modify existing
 * operations. While it’s not required to use this function to copy an `Operation`, it is recommended, in case
 * additional dynamic logic is added to them in the future.
 *
 * Hint: When an {@link Operation} is passed to the `request` argument, the `context` argument does not have to be
 * a complete {@link OperationContext} and will instead be combined with passed {@link Operation.context}.
 *
 * @example
 * An example of copying an existing `Operation` to modify its `context`:
 *
 * ```ts
 * makeOperation(
 *   operation.kind,
 *   operation,
 *   { requestPolicy: 'cache-first' },
 * );
 * ```
 */
function makeOperation<
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(
  kind: OperationType,
  request: GraphQLRequest<Data, Variables>,
  context: OperationContext
): Operation<Data, Variables>;

function makeOperation<
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(
  kind: OperationType,
  request: Operation<Data, Variables>,
  context?: Partial<OperationContext>
): Operation<Data, Variables>;

function makeOperation(kind, request, context) {
  return {
    ...request,
    kind,
    context: request.context
      ? {
          ...request.context,
          ...context,
        }
      : context || request.context,
  };
}

export { makeOperation };

/** Adds additional metadata to an `Operation`'s `context.meta` property while copying it.
 * @see {@link OperationDebugMeta} for more information on the {@link OperationContext.meta} property.
 */
export const addMetadata = (
  operation: Operation,
  meta: OperationContext['meta']
) => {
  return makeOperation(operation.kind, operation, {
    meta: {
      ...operation.context.meta,
      ...meta,
    },
  });
};
