import { Exchange, Client, Operation, OperationResult } from '@urql/core';
import { parse } from 'graphql';
import { pipe, tap, take, toPromise } from 'wonka';
import { DevtoolsExecuteQueryMessage } from './types';
import {
  getDisplayName,
  hash,
  createDebugMessage,
  createNativeMessenger,
  createBrowserMessenger,
  Messenger,
} from './utils';

interface HandlerArgs {
  sendMessage: Messenger['sendMessage'];
}

const curriedDevtoolsExchange: (a: Messenger) => Exchange = ({
  sendMessage,
  addMessageListener,
}) => ({ client, forward }) => {
  // Listen for messages from devtools
  addMessageListener(message => {
    if (message.source !== 'devtools' || !(message.type in messageHandlers)) {
      return;
    }

    messageHandlers[message.type]({ client, sendMessage })(message as any);
  });

  // Forward debug events to content script
  client.subscribeToDebugTarget &&
    client.subscribeToDebugTarget(event =>
      sendMessage({
        type: 'debug-event',
        source: 'exchange',
        data: event,
      })
    );

  return ops$ =>
    pipe(
      ops$,
      tap(handleOperation({ client, sendMessage })),
      forward,
      tap(handleResult({ client, sendMessage }))
    );
};

interface HandlerArgs {
  client: Client;
  sendMessage: Messenger['sendMessage'];
}

/** Handle outgoing operations */
const handleOperation = ({ sendMessage }: HandlerArgs) => (
  operation: Operation
) => {
  if (operation.kind === 'teardown') {
    const msg = createDebugMessage({
      type: 'teardown',
      message: 'The operation has been torn down',
      operation,
      data: undefined,
    });

    return sendMessage(msg);
  }

  const msg = createDebugMessage({
    type: 'execution',
    message: 'The client has received an execute command.',
    operation,
    data: {
      sourceComponent: getDisplayName(),
    },
  });
  return sendMessage(msg);
};

/** Handle new value or error */
const handleResult = ({ sendMessage }: HandlerArgs) => ({
  operation,
  data,
  error,
}: OperationResult) => {
  if (error) {
    const msg = createDebugMessage({
      type: 'error',
      message: 'The operation has returned a new error.',
      operation,
      data: {
        value: error,
      },
    });
    return sendMessage(msg);
  }

  const msg = createDebugMessage({
    type: 'update',
    message: 'The operation has returned a new response.',
    operation,
    data: {
      value: data,
    },
  });
  sendMessage(msg);
};

/** Handle execute request message. */
const handleExecuteQueryMessage = ({ client }: HandlerArgs) => (
  message: DevtoolsExecuteQueryMessage
) => {
  const isMutation = /(^|\W)+mutation\W/.test(message.query);
  const requestType = isMutation ? 'mutation' : 'query';
  const op = client.createRequestOperation(
    requestType,
    {
      key: hash(JSON.stringify(message.query)),
      query: parse(message.query),
      variables: {},
    },
    {
      meta: {
        source: 'Devtools',
      },
    }
  );

  pipe(client.executeRequestOperation(op), take(1), toPromise);
};

/** Handle connection initiated by devtools. */
const handleConnectionInitMessage = ({ sendMessage }: HandlerArgs) => () =>
  sendMessage({
    type: 'connection-acknowledge',
    source: 'exchange',
    version: __pkg_version__,
  });

/** Map of handlers for incoming messages. */
const messageHandlers = {
  'execute-query': handleExecuteQueryMessage,
  'connection-init': handleConnectionInitMessage,
} as const;

export const devtoolsExchange = ((): Exchange => {
  const isNative =
    typeof navigator !== 'undefined' && navigator?.product === 'ReactNative';
  const isSSR = !isNative && typeof window === 'undefined';

  // Prod or SSR
  if (process.env.NODE_ENV === 'production' || isSSR) {
    return ({ forward }) => ops$ => pipe(ops$, forward);
  }

  if (isNative) {
    return curriedDevtoolsExchange(createNativeMessenger());
  }

  return curriedDevtoolsExchange(createBrowserMessenger());
})();
