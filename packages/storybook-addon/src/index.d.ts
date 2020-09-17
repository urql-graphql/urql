import { Operation, OperationResult } from '@urql/core';

declare module '@storybook/addons' {
  type UrqlParameterResponse = Pick<OperationResult, 'data' | 'error'>;

  export interface Parameters {
    urql: (
      o: Operation
    ) => UrqlParameterResponse | Promise<UrqlParameterResponse>;
  }
}
