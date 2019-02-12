import React, { Component, FC, ReactNode } from 'react';
import { pipe, toPromise } from 'wonka';
import { Client } from '../client';
import { Consumer } from '../context';
import { CombinedError, createMutation } from '../lib';

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
  executeMutation: (variables: object) => void;
}

class MutationHandler extends Component<
  MutationHandlerProps,
  MutationHandlerState
> {
  public state = {
    fetching: false,
  };

  public render() {
    return this.props.children({
      ...this.state,
      executeMutation: this.executeMutation,
    });
  }

  private executeMutation = async (variables: object) => {
    if (this.props.query === undefined) {
      return;
    }

    this.setState({
      fetching: true,
      error: undefined,
      data: undefined,
    });

    try {
      const { data, error } = await pipe(
        this.props.client.executeMutation(
          createMutation(this.props.query, variables)
        ),
        toPromise
      );

      this.setState({ fetching: false, data, error });
    } catch (error) {
      this.setState({
        ...this.state,
        fetching: false,
        error,
      });
    }
  };
}

type MutationProps = Exclude<MutationHandlerProps, 'client'>;

export const Mutation: FC<MutationProps> = props => (
  <Consumer>
    {client => <MutationHandler {...props} client={client} />}
  </Consumer>
);
