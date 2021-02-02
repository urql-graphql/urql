import {
  GraphQLRequest,
  Operation,
  OperationContext,
  OperationType,
} from '../types';

function makeOperation<Data = any, Variables = object>(
  kind: OperationType,
  request: GraphQLRequest<Data, Variables>,
  context: OperationContext
): Operation<Data, Variables>;

function makeOperation<Data = any, Variables = object>(
  kind: OperationType,
  request: Operation<Data, Variables>,
  context?: OperationContext
): Operation<Data, Variables>;

function makeOperation(kind, request, context) {
  if (!context) context = request.context;

  return {
    key: request.key,
    query: request.query,
    variables: request.variables,
    kind,
    context,
  };
}

export { makeOperation };

/** Spreads the provided metadata to the source operation's meta property in context.  */
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
