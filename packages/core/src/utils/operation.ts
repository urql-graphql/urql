import {
  GraphQLRequest,
  Operation,
  OperationContext,
  OperationType,
} from '../types';
import { Warning, deprecationWarning } from './deprecation';

// TODO: Remove when the deprecated `operationName` property is removed
const DEPRECATED: Record<string, Warning> = {
  operationName: {
    key: 'Operation.operationName',
    message:
      'The "Operation.operationName" property has been deprecated and will be removed in a future release of urql. Use "Operation.kind" instead.',
  },
};

function makeOperation(
  kind: OperationType,
  request: GraphQLRequest,
  context: OperationContext
): Operation;
function makeOperation(
  kind: OperationType,
  request: Operation,
  context?: OperationContext
): Operation;

function makeOperation(kind, request, context) {
  if (!context) context = request.context;

  return {
    key: request.key,
    query: request.query,
    variables: request.variables,
    kind,
    context,

    get operationName(): OperationType {
      deprecationWarning(DEPRECATED.operationName);

      return this.kind;
    },
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
