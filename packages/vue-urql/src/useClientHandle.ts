import { DocumentNode } from 'graphql';
import { Client, TypedDocumentNode } from '@urql/core';
import {
  WatchStopHandle,
  getCurrentInstance,
  onMounted,
  onBeforeUnmount,
} from 'vue';

import { useClient } from './useClient';

import { callUseQuery, UseQueryArgs, UseQueryResponse } from './useQuery';

import { callUseMutation, UseMutationResponse } from './useMutation';

import {
  callUseSubscription,
  UseSubscriptionArgs,
  SubscriptionHandlerArg,
  UseSubscriptionResponse,
} from './useSubscription';

export interface ClientHandle {
  client: Client;

  useQuery<T = any, V = object>(
    args: UseQueryArgs<T, V>
  ): UseQueryResponse<T, V>;

  useSubscription<T = any, R = T, V = object>(
    args: UseSubscriptionArgs<T, V>,
    handler?: SubscriptionHandlerArg<T, R>
  ): UseSubscriptionResponse<T, R, V>;

  useMutation<T = any, V = any>(
    query: TypedDocumentNode<T, V> | DocumentNode | string
  ): UseMutationResponse<T, V>;
}

export function useClientHandle(): ClientHandle {
  const client = useClient();
  const stops: WatchStopHandle[] = [];

  onBeforeUnmount(() => {
    let stop: WatchStopHandle | void;
    while ((stop = stops.shift())) stop();
  });

  const handle: ClientHandle = {
    client: client.value,

    useQuery<T = any, V = object>(
      args: UseQueryArgs<T, V>
    ): UseQueryResponse<T, V> {
      return callUseQuery(args, client, stops);
    },

    useSubscription<T = any, R = T, V = object>(
      args: UseSubscriptionArgs<T, V>,
      handler?: SubscriptionHandlerArg<T, R>
    ): UseSubscriptionResponse<T, R, V> {
      return callUseSubscription(args, handler, client, stops);
    },

    useMutation<T = any, V = any>(
      query: TypedDocumentNode<T, V> | DocumentNode | string
    ): UseMutationResponse<T, V> {
      return callUseMutation(query, client);
    },
  };

  if (process.env.NODE_ENV !== 'production') {
    onMounted(() => {
      Object.assign(handle, {
        useQuery<T = any, V = object>(
          args: UseQueryArgs<T, V>
        ): UseQueryResponse<T, V> {
          if (process.env.NODE_ENV !== 'production' && !getCurrentInstance()) {
            throw new Error(
              '`handle.useQuery()` should only be called in the `setup()` or a lifecycle hook.'
            );
          }

          return callUseQuery(args, client, stops);
        },

        useSubscription<T = any, R = T, V = object>(
          args: UseSubscriptionArgs<T, V>,
          handler?: SubscriptionHandlerArg<T, R>
        ): UseSubscriptionResponse<T, R, V> {
          if (process.env.NODE_ENV !== 'production' && !getCurrentInstance()) {
            throw new Error(
              '`handle.useSubscription()` should only be called in the `setup()` or a lifecycle hook.'
            );
          }

          return callUseSubscription(args, handler, client, stops);
        },
      });
    });
  }

  return handle;
}
