import { Operation, OperationResult } from 'urql';

declare module '@storybook/addons' {
  type UrqlParameterResponse = Pick<OperationResult, 'data' | 'error'>;

  export interface Parameters {
    urql: (Operation) => UrqlParameterResponse | Promise<UrqlParameterResponse>;
  }
}
