import { DocumentNode } from 'graphql';
import React, { Component, ReactNode } from 'react';
import { pipe, subscribe } from 'wonka';
import { Client } from '../client';
import { Consumer } from '../context';
import { Omit, OperationContext, RequestPolicy } from '../types';
import { CombinedError, createRequest, noop } from '../utils';

interface QueryHandlerProps<T> {
  query: string | DocumentNode;
  variables?: object;
  client: Client;
  requestPolicy?: RequestPolicy;
  pause?: boolean;
  children: (arg: QueryHandlerState<T>) => ReactNode;
}

interface QueryHandlerState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
  executeQuery: (opts?: Partial<OperationContext>) => void;
}

class QueryHandler<T> extends Component<
  QueryHandlerProps<T>,
  QueryHandlerState<T>
> {
  private unsubscribe = noop;
  private request = createRequest(this.props.query, this.props.variables);

  executeQuery = (opts?: Partial<OperationContext>) => {
    this.unsubscribe();

    this.setState({ fetching: true });

    let teardown = noop;

    if (!this.props.pause) {
      [teardown] = pipe(
        this.props.client.executeQuery(this.request, {
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
    } else {
      this.setState({
        fetching: false,
      });
    }

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

  componentDidUpdate() {
    const newRequest = createRequest(this.props.query, this.props.variables);
    if (newRequest.key !== this.request.key) {
      this.request = newRequest;
      this.executeQuery();
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return this.props.children(this.state);
  }
}

export type QueryProps<T> = Omit<QueryHandlerProps<T>, 'client'>;

export function Query<T = any>(props: QueryProps<T>) {
  return (
    <Consumer>{client => <QueryHandler {...props} client={client} />}</Consumer>
  );
}
