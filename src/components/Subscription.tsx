import { DocumentNode } from 'graphql';
import React, { Component, FC, ReactNode } from 'react';
import { pipe, subscribe } from 'wonka';
import { Client } from '../client';
import { Consumer } from '../context';
import { Omit } from '../types';
import { CombinedError, createRequest, noop } from '../utils';

interface SubscriptionHandlerProps {
  query: string | DocumentNode;
  variables?: object;
  client: Client;
  handler?: (prev: any | void, data: any) => any;
  children: (arg: SubscriptionHandlerState) => ReactNode;
}

interface SubscriptionHandlerState {
  fetching: boolean;
  data?: any;
  error?: CombinedError;
}

class SubscriptionHandler extends Component<
  SubscriptionHandlerProps,
  SubscriptionHandlerState
> {
  private unsubscribe = noop;
  private request = createRequest(this.props.query, this.props.variables);

  executeSubscription = () => {
    this.setState({ fetching: true });

    const [teardown] = pipe(
      this.props.client.executeSubscription(this.request),
      subscribe(({ data, error }) => {
        const { handler } = this.props;

        this.setState({
          fetching: false,
          data: handler !== undefined ? handler(this.state.data, data) : data,
          error,
        });
      })
    );

    this.unsubscribe = teardown;
  };

  state = {
    data: undefined,
    error: undefined,
    fetching: false,
  };

  componentDidMount() {
    this.executeSubscription();
  }

  componentDidUpdate() {
    const newRequest = createRequest(this.props.query, this.props.variables);
    if (newRequest.key !== this.request.key) {
      this.request = newRequest;
      this.executeSubscription();
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return this.props.children(this.state);
  }
}

export type SubscriptionProps = Omit<SubscriptionHandlerProps, 'client'>;

export const Subscription: FC<SubscriptionProps> = props => (
  <Consumer>
    {client => <SubscriptionHandler {...props} client={client} />}
  </Consumer>
);
