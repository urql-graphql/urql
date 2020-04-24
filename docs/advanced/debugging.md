---
title: Debugging
order: 6
---

# Debugging

We've tried to make debugging in `urql` as seamless as possible by creating great tools for both basic users and those trying to create their own exchanges.

## Debug events

Debug events allow you to inspect what's going on in your Urql exchanges. Before you get started, here are a few things you should be aware of.

### Anyone with client access can listen

This includes the user of your exchange and other exchanges (although the latter is not advised).

### Debug events are disabled in production

That's right! Debug events are a fire-and-forget mechanism and should not be used as a means for messaging in your app.

## Dispatching debug events

> Note: Users who are not making their own exchanges can [skip this section](#consuming-debug-events).

Debug events are a great way to share implementation details to consumers of your exchanges.

### How to send a debug event

#### Identify key events

The first thing you want to do is identify key events in your exchange. For example, if you are writing a [_fetchExchange_](https://github.com/FormidableLabs/urql/blob/master/packages/core/src/exchanges/fetch.ts) which triggers fetch requests, an event might be `fetchRequest`.

#### Create an event type (optional)

If you want to make your event type safe and prevent conflicts with other exchanges, you can [merge your event type](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).

```ts
// urql.d.ts
import '@urql/core';

declare module '@urql/core' {
  interface DebugEventTypes {
    fetchRequest: { targetUrl: string };
  }
}
```

#### Dispatch the event

A _dispatchDebug_ function is now passed to every exchange. It expects an object with the following properties:

- `type` - a unique identifier for the event type.
- `message` - a human readable description of the event.
- `operation` - the operation in scope when the event occured.
- `data` _(optional)_ - any additional data useful for debugging

Here's a basic example of an exchange calling `dispatchDebug`

```ts
export const fetchExchange: Exchange = ({ forward, dispatchDebug }) => {
  // ...
  dispatchDebug({
    type: 'fetchRequest',
    message: 'A network request has been triggered',
    operation,
    data: { targetUrl },
  });
};
```

> Note: for a real world example, see the [_fetchExchange_](https://github.com/FormidableLabs/urql/blob/master/packages/core/src/exchanges/fetch.ts).

### Tips

In summary, here are a few do's and don'ts.

#### ✅ Do share internal details

Frequent debug messages on key events inside your exchange is very useful for consumers.

#### ✅ Do create unique event types

Key events should be easy to identify and differentiate, so have a unique name and data format for each unique event and use that format consistently.

#### ❌ Don't listen to debug events inside your exchange

While it is possible, there isn't any value in doing this. Use the exchange pipeline to communicate with other exchanges.

#### ❌ Don't send warnings in debug events

Debug **events** are intended to document **events** inside an exchange, not as a way to send messages to the user. Use `console.warn` to send alerts to the user.

## Consuming debug events

So you're trying to debug your app and you don't know where to start?

### Devtools

The quickest way is going to be using our [official devtools extension](https://github.com/FormidableLabs/urql-devtools/) which visualizes events on a timeline and provides tools to filter events, inspect the cache, and trigger custom querys via your running client.

![Urql Devtools Timeline](../assets/devtools-timeline.png)
_The Urql Devtools timeline._

Check out [the repo](https://github.com/FormidableLabs/urql-devtools/) for instructions on how to get started.

> Note: Devtools is unfortunately not currently supported for React Native but we're looking into it!

### Manual consumption of events

If you don't want to use a GUI to view events, you can subscribe to events directly via the client using `subscribeToDebugTarget`.

Here's how you would print debug events to the console (with filtering).

```ts
const { unsubscribe } = client.subscribeToDebugTarget(event => {
  if (event.source === 'dedupExchange') {
    return;
  }

  console.log(event);
});

// ...
// Unsubscribe from events
unsubscribe();
```
