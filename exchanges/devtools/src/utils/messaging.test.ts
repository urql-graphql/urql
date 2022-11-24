import { createBrowserMessenger, createNativeMessenger } from './messaging';
import { beforeAll, vi, describe, it, expect } from 'vitest';

let instance: any = {};
const WebSocket = vi.fn(function () {
  instance = {};
  return instance;
});

(global as any).WebSocket = vi.fn(WebSocket);

beforeAll(() => {
  vi.useFakeTimers();
});

describe('on create native messenger', () => {
  it('creates a new websocket connection', () => {
    createNativeMessenger();
    vi.runAllTimers();
    expect(WebSocket).toBeCalledTimes(1);
    expect(WebSocket.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "ws://localhost:7700",
      ]
    `);
  });

  describe('on open', () => {
    it('sends connection-init message', () => {
      createNativeMessenger();
      instance.send = vi.fn();
      instance.onopen();
      expect(instance.send).toBeCalledTimes(1);
      expect(instance.send.mock.calls[0]).toMatchInlineSnapshot(`
        [
          "{\\"source\\":\\"exchange\\",\\"type\\":\\"connection-init\\",\\"version\\":\\"200.0.0\\"}",
        ]
      `);
    });
  });

  describe('on close', () => {
    it('tries to establish a new connection', () => {
      createNativeMessenger();
      instance.onclose();
      vi.runAllTimers();
      expect(WebSocket).toBeCalledTimes(2);
    });
  });

  describe('on error', () => {
    it('tries to establish a new connection', () => {
      createNativeMessenger();
      instance.onerror();
      vi.runAllTimers();
      expect(WebSocket).toBeCalledTimes(2);
    });
  });

  describe('on incoming message', () => {
    it('calls all message handlers', () => {
      const data = '{ "test": 1234 }';
      const listeners = [vi.fn(), vi.fn()];

      const m = createNativeMessenger();
      listeners.forEach(m.addMessageListener);
      instance.onmessage({ data });

      listeners.forEach(l => {
        expect(l).toBeCalledTimes(1);
        expect(l).toBeCalledWith(JSON.parse(data));
      });
    });
  });

  describe('on send message', () => {
    it('sends a websocket message', () => {
      const message = { test: 1234 } as any;

      const m = createNativeMessenger();
      instance.send = vi.fn();
      instance.readyState = instance.OPEN = 1;

      m.sendMessage(message);
      expect(instance.send).toBeCalledWith(JSON.stringify(message));
    });
  });
});

describe('on create browser messenger', () => {
  const addEventListener = vi.spyOn(window, 'addEventListener');
  const postMessage = vi.spyOn(window, 'postMessage');

  describe('on create', () => {
    it('sends connection-init message', () => {
      createBrowserMessenger();

      expect(postMessage).toBeCalledTimes(1);
      expect(postMessage.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          Object {
            "source": "exchange",
            "type": "connection-init",
            "version": "200.0.0",
          },
          "http://localhost",
        ]
      `);
    });
  });

  describe('on trusted message', () => {
    it('calls message listeners', () => {
      const data = {
        type: 'init',
        source: 'devtools',
        message: { test: 1234 },
      };
      const listener = vi.fn();

      const m = createBrowserMessenger();
      m.addMessageListener(listener);

      const handler = addEventListener.mock.calls[0][1] as any;
      handler({ data, isTrusted: true });

      expect(listener).toBeCalledTimes(1);
      expect(listener).toBeCalledWith(data);
    });
  });

  describe('on untrusted message', () => {
    it('calls message listeners', () => {
      const data = {
        type: 'init',
        source: 'devtools',
        message: { test: 1234 },
      };
      const listener = vi.fn();

      const m = createBrowserMessenger();
      m.addMessageListener(listener);

      const handler = addEventListener.mock.calls[0][1] as any;
      handler({ data, isTrusted: false });

      expect(listener).toBeCalledTimes(0);
    });
  });

  describe('on send message', () => {
    it('calls post message', () => {
      const data = {
        arg: 1234,
        ignoredFunction: () => false,
        someString: 'hello',
      };

      const m = createBrowserMessenger();
      m.sendMessage(data as any);
      expect(postMessage).toBeCalledTimes(2);
      expect(postMessage.mock.calls[1][0]).toMatchInlineSnapshot(`
        Object {
          "arg": 1234,
          "someString": "hello",
        }
      `);
    });
  });
});
