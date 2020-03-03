<h2 align="center">@urql/exchange-retry</h2>
<p align="center">
<strong>An exchange for operation retry support in <code>urql</code></strong>
<br /><br />
<a href="https://npmjs.com/package/@urql/exchange-retry">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/@urql/exchange-retry.svg" />
</a>
<a href="https://bundlephobia.com/result?p=@urql/exchange-retry">
  <img alt="Minified gzip size"
  src="https://img.shields.io/bundlephobia/minzip/@urql/exchange-retry.svg?label=gzip%20size" />
</a>
<a href="https://github.com/FormidableLabs/urql-exchange-retry#maintenance-status">
  <img alt="Maintenance Status" src="https://img.shields.io/badge/maintenance-experimental-blueviolet.svg" />
</a>
</p>

`@urql/exchange-retry` is an exchange for the [`urql`](../../README.md) GraphQL client that allows operations (queries, mutations, subscriptions) to be retried based on an `options` parameter.

### retryExchange (Exchange factory)

The `retryExchange` is of type `Options => Exchange`.

It periodically retries requests that fail due to network errors. It accepts two options:

- `defaultDelayMs`, which is the initial delay to retry a request
- `maxDelayMs`, which is the maximum delay to retry a request.

The `retryExchange` will exponentially increase the delay from `minDelayMs` up to `maxDelayMs`, with some random jitter added to avoid the [thundering herd problem](https://en.wikipedia.org/wiki/Thundering_herd_problem).
