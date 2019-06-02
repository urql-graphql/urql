import { DocumentNode } from 'graphql';
import React, { Component, FC, ReactNode } from 'react';
import { pipe, subscribe } from 'wonka';
import { Client } from '../client';
import { Consumer } from '../context';
import { Omit, OperationContext, RequestPolicy } from '../types';
import { CombinedError, createRequest, noop } from '../utils';

interface QueryHandlerProps {
  query: string | DocumentNode;
  variables?: object;
  client: Client;
  requestPolicy?: RequestPolicy;
  pause?: boolean;
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

  constructor(props) {
    super(props);
    this.state = {
      executeQuery: this.executeQuery,
      data: undefined,
      error: undefined,
      fetching: props.pause !== true,
    };
  }

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

export type QueryProps = Omit<QueryHandlerProps, 'client'>;

export const Query: FC<QueryProps> = props => (
  <Consumer>{client => <QueryHandler {...props} client={client} />}</Consumer>
);
