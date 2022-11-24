import { DebugEvent } from '@urql/core';

/**
 * === Exchange ===
 *
 * Types for messages coming from the exchange
 */
export type ExchangeSource = 'exchange';

/** Initialize connection (exchange -> devtools). */
export interface ExchangeConnectionInitMessage {
  type: 'connection-init';
  source: ExchangeSource;
  version: string;
}

/** Response for a _DevtoolsConnectionInitMessage_ message. */
export interface ExchangeConnectionAckMessage {
  type: 'connection-acknowledge';
  source: ExchangeSource;
  version: string;
}

/** Message triggered by background.js when connection is lost. */
export interface ExchangeConnectionDisconnectMessage {
  type: 'connection-disconnect';
  source: ExchangeSource;
}

/** Debugging event. */
export interface ExchangeDebugEventMessage<T extends string = string> {
  type: 'debug-event';
  source: ExchangeSource;
  data: DebugEvent<T>;
}

/** Messages being sent from the devtools exchange. */
export type ExchangeMessage =
  | ExchangeDebugEventMessage
  | ExchangeConnectionInitMessage
  | ExchangeConnectionAckMessage
  | ExchangeConnectionDisconnectMessage;

/**
 * === Devtools ===
 *
 * Types for messages coming devtools
 */
export type DevtoolsSource = 'devtools';

/** Initialize connection (devtools -> exchange). */
export interface DevtoolsConnectionInitMessage {
  type: 'connection-init';
  source: DevtoolsSource;
  tabId?: number;
  version: string;
}

/** Respond to a _ExchangeConnectionInitMessage_ message. */
export interface DevtoolsConnectionAckMessage {
  type: 'connection-acknowledge';
  source: DevtoolsSource;
  version: string;
}

/** Trigger a query on the Urql client. */
export interface DevtoolsExecuteQueryMessage {
  type: 'execute-query';
  source: DevtoolsSource;
  query: string;
}

export type DevtoolsMessage =
  | DevtoolsExecuteQueryMessage
  | DevtoolsConnectionInitMessage
  | DevtoolsConnectionAckMessage;
