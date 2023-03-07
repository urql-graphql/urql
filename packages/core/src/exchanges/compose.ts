import type { ExchangeIO, Exchange, ExchangeInput } from '../types';

/** Composes an array of Exchanges into a single one.
 *
 * @param exchanges - An array of {@link Exchange | Exchanges}.
 * @returns - A composed {@link Exchange}.
 *
 * @remarks
 * `composeExchanges` returns an {@link Exchange} that when instantiated
 * composes the array of passed `Exchange`s into one, calling them from
 * right to left, with the prior `Exchange`’s {@link ExchangeIO} function
 * as the {@link ExchangeInput.forward} input.
 *
 * This simply merges all exchanges into one and is used by the {@link Client}
 * to merge the `exchanges` option it receives.
 */
export const composeExchanges = (exchanges: Exchange[]): Exchange => ({
  client,
  forward,
  dispatchDebug,
}: ExchangeInput): ExchangeIO =>
  exchanges.reduceRight(
    (forward, exchange) =>
      exchange({
        client,
        forward,
        dispatchDebug(event) {
          dispatchDebug({
            timestamp: Date.now(),
            source: exchange.name,
            ...event,
          });
        },
      }),
    forward
  );
