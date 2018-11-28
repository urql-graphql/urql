import { Component, ReactNode } from 'react';
import {
  Client,
  Query,
  Mutation,
  ClientInstance,
  StreamUpdate,
} from '../types';
import { CombinedError } from '../lib';

export interface ClientProps {
  client: Client;
  children: (obj: object) => ReactNode;
  query?: Query;
  mutation?: {
    [key: string]: Mutation;
  };
}

interface ClientState {
  client: ClientInstance;
  fetching: boolean;
  error: Error | CombinedError | CombinedError[];
  data: object | object[] | ClientState;
  mutations: {
    [key: string]: (vals: any) => void;
  };
}

export class UrqlClient extends Component<ClientProps, ClientState> {
  constructor(props: ClientProps) {
    super(props);

    this.state = {
      client: props.client.createInstance({
        onChange: result => this.onStreamUpdate(result),
      }),
      data: null,
      error: null,
      fetching: false,
      mutations: null,
    };

    this.createMutatorFunctions();
  }

  public componentDidUpdate(prevProps) {
    if (prevProps.mutation !== this.props.mutation) {
      this.createMutatorFunctions();
    }

    if (prevProps.query !== this.props.query) {
      this.state.client.executeQuery(this.props.query);
    }
  }

  public componentWillUnmount() {
    this.state.client.unsubscribe();
  }

  public render() {
    if (typeof this.props.children !== 'function') {
      return null;
    }

    return this.props.children({
      fetching: this.state.fetching,
      error: this.state.error,
      data: this.state.data,
      mutations: this.state.mutations,
    });
  }

  private createMutatorFunctions() {
    if (this.props.mutation === undefined) {
      return;
    }

    let mutations = {};

    Object.keys(this.props.mutation).forEach(key => {
      mutations = {
        ...mutations,
        [key]: (variables: any) =>
          this.state.client.executeMutation({
            ...this.props.mutation[key],
            variables,
          }),
      };
    });

    this.setState({ mutations });
  }

  private onStreamUpdate(updated: StreamUpdate) {
    this.setState({
      fetching: updated.fetching,
      error: updated.error,
      data: updated.data,
    });
  }
}
