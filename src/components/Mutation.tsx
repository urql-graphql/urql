import React, { Component, FC, ReactNode } from 'react';
import { pipe, toPromise } from 'wonka';
import { Client, CombinedError, createMutation } from '../lib';
import { Consumer } from './context';

interface MutationHandlerProps {
  client: Client;
  query: string;
  variables?: object;
  children: (arg: MutationHandlerState) => ReactNode;
}

interface MutationHandlerState {
  fetching: boolean;
  data?: any;
  error?: CombinedError;
}

class MutationHandler extends Component<
  MutationHandlerProps,
  MutationHandlerState
> {
  public state = {
    fetching: false,
  };

  public render() {
    return this.props.children(this.state);
  }

  public componentDidMount() {
    this.executeMutation();
  }

  public componentDidUpdate(oldProps) {
    if (
      this.props.query === oldProps.query ||
      this.props.variables === oldProps.variables
    ) {
      return;
    }

    this.executeMutation();
  }

  private async executeMutation() {
    if (this.props.query === undefined) {
      return;
    }

    this.setState({
      fetching: true,
      error: undefined,
      data: undefined,
    });

    try {
      const data = await pipe(
        this.props.client.executeMutation(
          createMutation(this.props.query, this.props.variables)
        ),
        toPromise
      );

      this.setState({ data });
    } catch (error) {
      this.setState({
        error,
      });
    }
  }
}

type MutationProps = Exclude<MutationHandlerProps, 'client'>;

export const Mutation: FC<MutationProps> = props => (
  <Consumer>
    {client => <MutationHandler {...props} client={client} />}
  </Consumer>
);
