import React, { Component, FC, ReactNode } from 'react';
import { pipe, toPromise } from 'wonka';
import { Client } from '../client';
import { Consumer } from '../context';
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
  executeMutation: (variables: object) => void;
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

  executeMutation = (variables: object) => {
    if (this.props.query === undefined) {
      return;
    }

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
      .then(({ data, error }) => {
        this.setState({ fetching: false, data, error });
      })
      .catch(error => {
        this.setState({ fetching: false, data: undefined, error });
      });
  };
}

type MutationProps = Exclude<MutationHandlerProps, 'client'>;

export const Mutation: FC<MutationProps> = props => (
  <Consumer>
    {client => <MutationHandler {...props} client={client} />}
  </Consumer>
);
