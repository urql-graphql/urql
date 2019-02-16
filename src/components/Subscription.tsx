import React, { Component, FC, ReactNode } from 'react';
import { pipe, subscribe } from 'wonka';
import { Client } from '../client';
import { Consumer } from '../context';
import { CombinedError, createSubscription } from '../utils';

interface SubscriptionHandlerProps {
  client: Client;
  query: string;
  variables?: object;
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
  private unsubscribe?: () => void;

  public state = {
    fetching: false,
  };

  public componentDidMount() {
    this.executeSubscription();
  }

  public componentDidUpdate(oldProps) {
    if (
      this.props.query === oldProps.query ||
      this.props.variables === oldProps.variables
    ) {
      return;
    }

    this.executeSubscription();
  }

  public componentWillUnmount() {
    if (this.unsubscribe !== undefined) {
      this.unsubscribe();
    }
  }

  public render() {
    return this.props.children(this.state);
  }

  private executeSubscription() {
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
      this.props.client.executeSubscription(
        createSubscription(this.props.query, this.props.variables)
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

type SubscriptionProps = Exclude<SubscriptionHandlerProps, 'client'>;

export const Subscription: FC<SubscriptionProps> = props => (
  <Consumer>
    {client => <SubscriptionHandler {...props} client={client} />}
  </Consumer>
);
