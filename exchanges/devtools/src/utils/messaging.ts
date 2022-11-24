import {
  ExchangeMessage,
  DevtoolsMessage,
  ExchangeConnectionInitMessage,
} from '../types';

export interface Messenger {
  addMessageListener: (
    cb: (m: ExchangeMessage | DevtoolsMessage) => void
  ) => void;
  sendMessage: (m: ExchangeMessage) => void;
}

const connectionInitMessage: ExchangeConnectionInitMessage = {
  source: 'exchange',
  type: 'connection-init',
  version: __pkg_version__,
};

/** Create curried args for native environment. */
export const createNativeMessenger = (): Messenger => {
  let listeners: Function[] = [];
  let ws: WebSocket;
  let timeout: NodeJS.Timeout | undefined;

  const createConnection = () => {
    timeout = undefined;
    ws = new WebSocket('ws://localhost:7700');

    ws.onopen = () => {
      ws.send(JSON.stringify(connectionInitMessage));
    };
    ws.onclose = () => {
      timeout = timeout || setTimeout(createConnection, 500);
    };
    ws.onerror = () => {
      timeout = timeout || setTimeout(createConnection, 500);
    };
    ws.onmessage = message => {
      try {
        if (!message.data) {
          return;
        }

        listeners.forEach(l =>
          l(JSON.parse(message.data) as ExchangeMessage | DevtoolsMessage)
        );
      } catch (err) {
        console.warn(err);
      }
    };
  };
  createConnection();

  return {
    addMessageListener: cb => {
      listeners = [...listeners, cb];
    },
    sendMessage: message => {
      ws.readyState === ws.OPEN && ws.send(JSON.stringify(message));
    },
  };
};

/** Create curried args for browser environment. */
export const createBrowserMessenger = (): Messenger => {
  let listeners: Function[] = [];

  window.addEventListener('message', ({ data, isTrusted }) => {
    if (!isTrusted || !data?.source) {
      return;
    }

    listeners.forEach(cb => cb(data));
  });

  const addMessageListener: Messenger['addMessageListener'] = cb =>
    (listeners = [...listeners, cb]);
  const sendMessage: Messenger['sendMessage'] = m =>
    window.postMessage(JSON.parse(JSON.stringify(m)), window.location.origin);

  sendMessage(connectionInitMessage);

  return {
    addMessageListener,
    sendMessage,
  };
};
