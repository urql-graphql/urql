---
title: @urql/exchange-retry
order: 0
---

# Retry Exchange

## Available Options

| Option              | Description                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialDelayMs`    | Specify at what interval the `retrying` should start, this means that if we specify `1000` that when our `operation` fails we'll wait 1 second and then retry it.                                                                                                                                                                                                                                |
| `maxDelayMs`        | The maximum delay between retries. The `retryExchange` will keep increasing the time between retries so that the server doesn't receive simultaneous requests it can't complete. This time between requests will increase with a random `back-off` factor applied to the `initialDelayMs`, read more about the [thundering herd problem](https://en.wikipedia.org/wiki/Thundering_herd_problem). |
| `randomDelay`       | Allows the randomized delay described above to be disabled. When this option is set to `false` there will be exactly a `initialDelayMs` wait between each retry.                                                                                                                                                                                                                                 |
| `maxNumberAttempts` | Allows the max number of retries to be defined.                                                                                                                                                                                                                                                                                                                                                  |
| `retryIf`           | Apply a custom test to the returned error to determine whether it should be retried.                                                                                                                                                                                                                                                                                                             |
