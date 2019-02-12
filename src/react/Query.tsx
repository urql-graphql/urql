import React, { Component, FC, ReactNode } from 'react';
import { pipe, subscribe } from 'wonka';
import { Client } from '../client';
import { Consumer } from '../context';
import { CombinedError, createQuery } from '../lib';

interface QueryHandlerProps {
  client: Client;
  query: string;
  variables: object;
  children: (arg: QueryHandlerState) => ReactNode;
}

interface QueryHandlerState {
  fetching: boolean;
  data?: any;
  error?: CombinedError;
}

class QueryHandler extends Component<QueryHandlerProps, QueryHandlerState> {
  private unsubscribe?: () => void;

  public state = {
    fetching: false,
  };

  public componentDidMount() {
    this.executeQuery();
  }

  public componentDidUpdate(oldProps) {
    if (
      this.props.query === oldProps.query &&
      this.props.variables === oldProps.variables
    ) {
      return;
    }

    this.executeQuery();
  }

  public componentWillUnmount() {
    if (this.unsubscribe !== undefined) {
      this.unsubscribe();
    }
  }

  public render() {
    return this.props.children(this.state);
  }

  private executeQuery() {
    if (this.unsubscribe !== undefined) {
      this.unsubscribe();
    }

    if (this.props.query === undefined) {
      return;
    }

    this.setState({
      fetching: true,
    });

    const [unsubscribe] = pipe(
      this.props.client.executeQuery(
        createQuery(this.props.query, this.props.variables)
      ),
      subscribe(({ data, error }) => {
        this.setState({
          fetching: false,
          data,
          error,
        });
      })
    );

    this.unsubscribe = unsubscribe;
  }
}

type QueryProps = Exclude<QueryHandlerProps, 'client'>;

export const Query: FC<QueryProps> = props => (
  <Consumer>{client => <QueryHandler {...props} client={client} />}</Consumer>
);
