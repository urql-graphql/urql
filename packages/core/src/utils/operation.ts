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

export const makeOperation = (
  kind: OperationType,
  request: GraphQLRequest,
  context: OperationContext
): Operation => ({
  key: request.key,
  query: request.query,
  variables: request.variables,
  kind,
  context,

  get operationName(): OperationType {
    deprecationWarning(DEPRECATED.operationName);

    return this.kind;
  },
});
