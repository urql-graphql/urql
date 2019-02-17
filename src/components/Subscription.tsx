import React, { Component, FC, ReactNode } from 'react';
import { pipe, subscribe } from 'wonka';
import { Client } from '../client';
import { Consumer } from '../context';
import { GraphQLRequest } from '../types';
import { CombinedError, createSubscription, noop } from '../utils';

interface SubscriptionHandlerProps extends GraphQLRequest {
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

  state = {
    data: undefined,
    error: undefined,
    fetching: false,
  };

  componentDidMount() {
    this.executeSubscription();
  }

  componentDidUpdate(oldProps) {
    if (
      this.props.query === oldProps.query ||
      this.props.variables === oldProps.variables
    ) {
      return;
    }

    this.executeSubscription();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return this.props.children(this.state);
  }

  executeSubscription = () => {
    this.setState({ fetching: true });

    const [teardown] = pipe(
      this.props.client.executeSubscription(
        createSubscription(this.props.query, this.props.variables)
      ),
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
}

type SubscriptionProps = Exclude<SubscriptionHandlerProps, 'client'>;

export const Subscription: FC<SubscriptionProps> = props => (
  <Consumer>
    {client => <SubscriptionHandler {...props} client={client} />}
  </Consumer>
);
