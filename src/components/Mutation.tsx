import React, { Component, FC, ReactNode } from 'react';
import { pipe, toPromise } from 'wonka';
import { Client } from '../client';
import { Consumer } from '../context';
import { OperationResult } from '../types';
import { CombinedError, createMutation } from '../utils';

interface MutationHandlerProps {
  client: Client;
  query: string;
  children: (arg: MutationChildProps) => ReactNode;
}

interface MutationHandlerState {
  fetching: boolean;
  data?: any;
  error?: CombinedError;
}

interface MutationChildProps extends MutationHandlerState {
  executeMutation: (variables?: object) => Promise<OperationResult>;
}

class MutationHandler extends Component<
  MutationHandlerProps,
  MutationHandlerState
> {
  state = {
    fetching: false,
  };

  render() {
    return this.props.children({
      ...this.state,
      executeMutation: this.executeMutation,
    });
  }

  executeMutation = (variables?: object): Promise<OperationResult> => {
    this.setState({
      fetching: true,
      error: undefined,
      data: undefined,
    });

    const mutation = createMutation(this.props.query, variables);

    return pipe(
      this.props.client.executeMutation(mutation),
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
