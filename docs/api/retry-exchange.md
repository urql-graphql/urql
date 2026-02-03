---
title: '@urql/exchange-retry'
order: 5
---

# Retry Exchange

> **Note:** These API docs are deprecated as we now keep TSDocs in all published packages.
> You can view TSDocs while using these packages in your editor, as long as it supports the
> TypeScript Language Server.
> We're planning to replace these API docs with a separate web app soon.

The `@urql/exchange-retry` package contains an addon `retryExchange` for `urql` that may be used to
let failed operations be retried, typically when a previous operation has failed with a network
error.

[Read more about how to use and configure the `retryExchange` on the "Retry Operations"
page.](../advanced/retry-operations.md)

## Options

| Option              | Description                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialDelayMs`    | Specify at what interval the `retrying` should start, this means that if we specify `1000` that when our `operation` fails we'll wait 1 second and then retry it.                                                                                                                                                                                                                                |
| `maxDelayMs`        | The maximum delay between retries. The `retryExchange` will keep increasing the time between retries so that the server doesn't receive simultaneous requests it can't complete. This time between requests will increase with a random `back-off` factor applied to the `initialDelayMs`, read more about the [thundering herd problem](https://en.wikipedia.org/wiki/Thundering_herd_problem). |
| `randomDelay`       | Allows the randomized delay described above to be disabled. When this option is set to `false` there will be exactly a `initialDelayMs` wait between each retry.                                                                                                                                                                                                                                 |
| `maxNumberAttempts` | Defines the maximum number of attempts (including the initial request). For example, `2` means one retry after the initial attempt.                                                                                                                                                                                                                                                              |
| `retryIf`           | Apply a custom test to the returned error to determine whether it should be retried.                                                                                                                                                                                                                                                                                                             |
| `retryWith`         | Apply a transform function allowing you to selectively replace a retried `Operation` or return a nullish value. This will act like `retryIf` where a truthy value retries (`retryIf` takes precedence and overrides this function.)                                                                                                                                                              |
