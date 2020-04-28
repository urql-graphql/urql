---
title: Debugging
order: 6
---

# Debugging

We've tried to make debugging in `urql` as seamless as possible by creating tools for users of urql and those creating their own exchanges.

## Debug events

Debug events are a means for seeing what's going on inside of urql exchanges. Before getting started, here are a few things to be aware of.

### Anyone with client access can listen

This includes the creator of an `urql` client and any of it's exchanges (although the latter is not advised).

### Debug events are disabled in production

Debug events are a fire-and-forget mechanism and should not be used as a means for messaging in your app.

## Consuming debug events

Debugging events can be inspected either graphically using our [devtools](https://github.com/FormidableLabs/urql-devtools) or manually by subscribing to events on the client.

### Devtools

The quickest way is going to be using our [devtools extension](https://github.com/FormidableLabs/urql-devtools/) which visualizes events on a timeline and provides tools to filter events, inspect the cache, and trigger custom queries via the running client.

![Urql Devtools Timeline](../assets/devtools-timeline.png)

Visit [the repo](https://github.com/FormidableLabs/urql-devtools/) for instructions on getting started.

> Note: Devtools is unfortunately not currently supported for React Native but we're looking into it!

### Manual consumption of events

For those not looking to use a GUI to view events, the client has a `subscribeToDebugTarget` function.

As demonstrated below, the `subscribeToDebugTarget` function takes a callback which is called with every debug event that is dispatched.

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

## Dispatching debug events

Debug events are a means of sharing implementation details to consumers of an exchange.

#### Identify key events

The first step is to identify key events of the exchange in question.

For example, a [_fetchExchange_](https://github.com/FormidableLabs/urql/blob/master/packages/core/src/exchanges/fetch.ts) which triggers fetch requests may have an event of type `fetchRequest`.

#### Create an event type (optional)

For type safe events, and to prevent conflicts with other exchanges, [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) can be used.

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

A `dispatchDebug` function is now passed to every exchange and is used to dispatch debug events.

It is called with an object containing the following properties:

- `type` - a unique identifier for the event type.
- `message` - a human readable description of the event.
- `operation` - the operation in scope when the event occured.
- `data` _(optional)_ - any additional data useful for debugging

Here, we call `dispatchDebug` with our `fetchRequest` event we declared earlier.

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
