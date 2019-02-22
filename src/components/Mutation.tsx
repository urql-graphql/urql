import React, { Component, FC, ReactNode } from 'react';
import { pipe, toPromise } from 'wonka';
import { Client } from '../client';
import { Consumer } from '../context';
import { GraphQLRequest, OperationResult } from '../types';
import { CombinedError, createRequest } from '../utils';

interface MutationHandlerProps {
  client: Client;
  query: GraphQLRequest['query'];
  children: (arg: MutationChildProps) => ReactNode;
}

interface MutationHandlerState {
  fetching: boolean;
  data?: any;
  error?: CombinedError;
}

interface MutationChildProps extends MutationHandlerState {
  executeMutation: <T = any, V = object>(
    variables?: V
  ) => Promise<OperationResult<T>>;
}

class MutationHandler extends Component<
  MutationHandlerProps,
  MutationHandlerState
> {
  state = {
    fetching: false,
    data: undefined,
    error: undefined,
  };

  render() {
    return this.props.children({
      ...this.state,
      executeMutation: this.executeMutation,
    });
  }

  executeMutation: MutationChildProps['executeMutation'] = variables => {
    this.setState({
      fetching: true,
      error: undefined,
      data: undefined,
    });

    const request = createRequest(this.props.query, variables as any);

    return pipe(
      this.props.client.executeMutation(request),
      toPromise
    )
      .then(result => {
        const { data, error } = result;
        this.setState({ fetching: false, data, error });
        return result;
      })
      .catch(networkError => {
        const error = new CombinedError({ networkError });
        this.setState({ fetching: false, data: undefined, error });
        return { data: undefined, error } as OperationResult;
      });
  };
}

type MutationProps = Exclude<MutationHandlerProps, 'client'>;

export const Mutation: FC<MutationProps> = props => (
  <Consumer>
    {client => <MutationHandler {...props} client={client} />}
  </Consumer>
);
