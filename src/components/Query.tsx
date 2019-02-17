import React, { Component, FC, ReactNode } from 'react';
import { pipe, subscribe } from 'wonka';
import { Client } from '../client';
import { Consumer } from '../context';
import { GraphQLRequest, OperationContext, RequestPolicy } from '../types';
import { CombinedError, createQuery, noop } from '../utils';

interface QueryHandlerProps extends GraphQLRequest {
  client: Client;
  requestPolicy?: RequestPolicy;
  children: (arg: QueryHandlerState) => ReactNode;
}

interface QueryHandlerState {
  fetching: boolean;
  data?: any;
  error?: CombinedError;
  executeQuery: (opts?: Partial<OperationContext>) => void;
}

class QueryHandler extends Component<QueryHandlerProps, QueryHandlerState> {
  private unsubscribe = noop;

  executeQuery = (opts?: Partial<OperationContext>) => {
    this.unsubscribe();

    this.setState({ fetching: true });

    const request = createQuery(this.props.query, this.props.variables);

    const [teardown] = pipe(
      this.props.client.executeQuery(request, {
        requestPolicy: this.props.requestPolicy,
        ...opts,
      }),
      subscribe(({ data, error }) => {
        this.setState({
          fetching: false,
          data,
          error,
        });
      })
    );

    this.unsubscribe = teardown;
  };

  state = {
    executeQuery: this.executeQuery,
    data: undefined,
    error: undefined,
    fetching: false,
  };

  componentDidMount() {
    this.executeQuery();
  }

  componentDidUpdate(oldProps) {
    if (
      this.props.query === oldProps.query &&
      this.props.variables === oldProps.variables
    ) {
      return;
    }

    this.executeQuery();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return this.props.children(this.state);
  }
}

type QueryProps = Exclude<QueryHandlerProps, 'client'>;

export const Query: FC<QueryProps> = props => (
  <Consumer>{client => <QueryHandler {...props} client={client} />}</Consumer>
);
