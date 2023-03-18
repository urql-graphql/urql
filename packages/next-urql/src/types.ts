import type { ClientOptions, Client, SSRExchange, SSRData } from '@urql/core';
import type { NextPageContext } from 'next';
import type { AppContext } from 'next/app';

/** The Next.js {@link NextPageContext}, as modified by `next-urql`. */
export interface NextUrqlPageContext extends NextPageContext {
  urqlClient: Client;
}

/** The Next.js {@link AppContext}, as modified by `next-urql`. */
export interface NextUrqlAppContext extends AppContext {
  urqlClient: Client;
}

export type NextUrqlContext = NextUrqlPageContext | NextUrqlAppContext;

/** Passed to {@link withUrqlClient} returning the options a {@link Client} is created with.
 *
 * @param ssrExchange - the `ssrExchange` you must use in your `exchanges` array.
 * @param ctx - Passed when `getInitialProps` is used and set to Next.js’ {@link NextPageContext}.
 * @returns a {@link ClientOptions} configuration object to create a {@link Client} with.
 *
 * @remarks
 * You must define a `getClientConfig` function and pass it to {@link withUrqlClient}.
 *
 * This function defines the options passed to {@link initUrqlClient}.
 * It passes you an `ssrExchange` that you must use in your `exchanges` array.
 *
 * @example
 * ```ts
 * import { cacheExchange, fetchExchange } from '@urql/core';
 * import { withUrqlClient } from 'next-urql';
 *
 * const WrappedPage = withUrqlClient(
 *   (ssrExchange) => ({
 *     url: 'https://YOUR_API',
 *     exchanges: [cacheExchange, ssrExchange, fetchExchange],
 *   })
 * )(Page);
 * ```
 */
export type NextUrqlClientConfig = (
  ssrExchange: SSRExchange,
  ctx?: NextPageContext
) => ClientOptions;

/** Props that {@link withUrqlClient} components pass on to your component. */
export interface WithUrqlProps {
  /** The {@link Client} that {@link withUrqlClient} created for your component. */
  urqlClient?: Client;
  /** Next.js’ `pageProps` prop, as passed to it by Next.js. */
  pageProps: any;
  /** The SSR data that {@link withUrqlClient} created for your component. */
  urqlState?: SSRData;
  /** Resets the `Client` that on the client-side.
   *
   * @remarks
   * `resetUrqlClient` will force a new {@link Client} to be created
   * on the client-side, rather than the same `Client` with the same
   * server-side data to be reused.
   *
   * This may be used to force the cache and any state in the `Client`
   * to be cleared and reset.
   */
  resetUrqlClient?(): void;
  [key: string]: any;
}

/** Options that may be passed to the {@link withUrqlClient} wrapper function. */
export interface WithUrqlClientOptions {
  /** Enables automatic server-side rendering mode.
   *
   * @remarks
   * When enabled, {@link withUrqlClient} will add a `getInitialProps`
   * function to the resulting component, even if you haven't defined
   * one.
   *
   * This function will automatically capture `urql`'s SSR state on the
   * server-side and rehydrate it on the client-side, unless
   * {@link WithUrqlClientOptions.neverSuspend} is `true`.
   */
  ssr?: boolean;
  /** Disables automatic server-side rendering, even if a `getInitialProps` function is defined.
   *
   * @remarks
   * When enabled, {@link withUrqlClient} will never execute queries
   * on the server-side automatically, and will instead rely on you
   * to do so manually.
   */
  neverSuspend?: boolean;
  /** Enables reexecuting operations on the client-side after rehydration.
   *
   * @remarks
   * When enabled, `staleWhileRevalidate` will reexecute GraphQL queries on
   * the client-side, if they’ve been rehydrated from SSR state.
   *
   * This is useful if you, for instance, cache your server-side rendered
   * pages, or if you use `getStaticProps` and wish to get this data
   * updated.
   */
  staleWhileRevalidate?: boolean;
}
