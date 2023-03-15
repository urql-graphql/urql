import {
  AnyVariables,
  GraphQLRequest,
  Operation,
  OperationContext,
  OperationType,
} from '../types';

/** Creates a {@link Operation} from the given parameters.
 *
 * @param kind - The {@link OperationType} of GraphQL operation, i.e. `query`, `mutation`, or `subscription`.
 * @param request - The {@link GraphQLRequest} used as a template for the `Operation`.
 * @param context - The {@link OperationContext} `context` data for the `Operation`.
 * @returns An {@link Operation}.
 *
 * @remarks
 * This method is both used to create new {@link Operation | Operations} as well as copy and modify existing
 * operations. While it’s not required to use this function to copy an `Operation`, it is recommended, in case
 * additional dynamic logic is added to them in the future.
 *
 * @example
 * An example of copying an existing `Operation` to modify its `context`:
 *
 * ```ts
 * makeOperation(
 *   operation.kind,
 *   operation,
 *   { ...operation.context, requestPolicy: 'cache-first' },
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
  context?: OperationContext
): Operation<Data, Variables>;

function makeOperation(kind, request, context) {
  if (!context) context = request.context;
  return {
    ...request,
    kind,
    context,
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
    ...operation.context,
    meta: {
      ...operation.context.meta,
      ...meta,
    },
  });
};
