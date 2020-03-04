---
title: urql (React)
order: 1
---

# React API

## Hooks

### useQuery

#### useQuery Parameters

Accepts a single required `options` object as an input with the following properties:

| Prop          | Type                     | Description                                                                                                           |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| query         | `string \| DocumentNode` | The query to be executed. Accepts as a plain string query or GraphQL DocumentNode.                                    |
| variables     | `?object`                | The variables to be used with the GraphQL request.                                                                    |
| requestPolicy | `?RequestPolicy`         | An optional [request policy](/basics/querying-data#request-policy) that should be used specifying the cache strategy. |
| pause         | `?boolean`               | A boolean flag instructing `Query` to pause execution of the subsequent query operation.                              |
| pollInterval  | `?number`                | Every `pollInterval` milliseconds the query will be refetched.                                                        |
| context       | `?object`                | Holds the contextual information for the query.                                                                       |

#### useQuery Returned Data

A tuple is returned with item one being the current query's state object and item two being an `executeQuery` function.

The shape of the current state is an [OperationResult Type](/api/core#operationresult-type)

&nbsp;

The `executeQuery` function optionally accepts a partial `OperationContext`.

[More information on how to use this hook can be found in the Basics section.](/basics/querying-data#queries)

### useMutation

#### useMutation Parameters

Accepts a single `query` argument of type `string`.

#### useMutation Returned Data

A tuple is returned with item one being the current query's state object and item two being an `executeQuery` function.

The shape of the current state is an [OperationResult Type](/api/core#operationresult-type)
&nbsp;

The `executeQuery` function optionally accepts a partial `OperationContext`.

[More information on how to use this hook can be found in the Basics section.](/basics/mutating-data#mutations)

### useSubscription

#### useSubscription Parameters

Accepts an `options` object as the required first parameter, and a second optional parameter that is the subscription's handler function.

The `options` object's property breakdown:

| Prop      | Type                     | Description                                                                        |
| --------- | ------------------------ | ---------------------------------------------------------------------------------- |
| query     | `string \| DocumentNode` | The query to be executed. Accepts as a plain string query or GraphQL DocumentNode. |
| variables | `?object`                | The variables to be used with the GraphQL request.                                 |
| context   | `?object`                | Holds the contextual information for the query.                                    |

&nbsp;

The subscription handler's type signature:

```js
type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;
```

This means that the subscription handler receives the previous data or undefined
and the current, incoming subscription event data.

#### useSubscription Returned Data

The shape of the current state is an [OperationResult Type](/api/core#operationresult-type) without the first `operation` prop.

More information can be found in the [Subscriptions](/advanced/subscriptions) section.

## Components

### Query

#### Props

| Prop          | Type                       | Description                                                                                           |
| ------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| query         | `string`                   | The GraphQL request's query                                                                           |
| variables     | `object`                   | The GraphQL request's variables                                                                       |
| context       | `?object`                  | The GraphQL request's context                                                                         |
| requestPolicy | `?RequestPolicy`           | An optional request policy that should be used                                                        |
| pause         | `?boolean`                 | A boolean flag instructing `Query` to pause execution of the subsequent query operation               |
| pollInterval  | `?number`                  | Every `pollInterval` milliseconds the query will be refetched                                         |
| children      | `RenderProps => ReactNode` | A function that follows the typical render props pattern. The shape of the render props is as follows |

#### Render Props

| Prop         | Type                                | Description                                                                                             |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| fetching     | `boolean`                           | Whether the `Query` is currently waiting for a GraphQL result                                           |
| data         | `?any`                              | The GraphQL request's result                                                                            |
| error        | `?CombinedError`                    | The `CombinedError` containing any errors that might've occured                                         |
| extensions   | `?Record<string, any>`              | Optional extensions that the GraphQL server may have returned.                                          |
| executeQuery | `Partial<OperationContext> => void` | A function that can force the operation to be sent again with the given context (Useful for refetching) |

&nbsp;

[More information on how to use this hook can be found in the Basics section.](/basics/querying-data#queries)

### Mutation

#### Props

| Prop     | Type                       | Description                                                                                           |
| -------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| query    | `string`                   | The GraphQL request's query                                                                           |
| children | `RenderProps => ReactNode` | A function that follows the typical render props pattern. The shape of the render props is as follows |

#### Render Props

| Prop            | Type                                                               | Description                                                      |
| --------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| fetching        | `boolean`                                                          | Whether the `Mutation` is currently waiting for a GraphQL result |
| data            | `?any`                                                             | The GraphQL request's result                                     |
| error           | `?CombinedError`                                                   | The `CombinedError` containing any errors that might've occured  |
| extensions      | `?Record<string, any>`                                             | Optional extensions that the GraphQL server may have returned.   |
| executeMutation | `(variables: object, context?: Partial<OperationContext>) => void` | A function that accepts variables and starts the mutation        |

[More information on how to use this hook can be found in the Basics section.](/basics/mutating-data#mutations)

### Subscription

[More information on how to use this component can be found in the Basics section.](https://formidable.com/open-source/urql/docs/basics#subscriptions)

#### Props

| Prop      | Type                                                | Description                                                                                           |
| --------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| query     | `string`                                            | The GraphQL subscription's query                                                                      |
| variables | `object`                                            | The GraphQL subscriptions' variables                                                                  |
| context   | `?Partial<OperationContext>`                        | The GraphQL subscriptions' context                                                                    |
| handler   | `undefined \| (prev: R \| undefined, data: T) => R` | The handler that should combine/update the subscription's data with incoming data                     |
| children  | `RenderProps => ReactNode`                          | A function that follows the typical render props pattern. The shape of the render props is as follows |

#### Render Props

| Prop       | Type                   | Description                                                     |
| ---------- | ---------------------- | --------------------------------------------------------------- |
| fetching   | `boolean`              | Whether the `Subscription` is currently ongoing                 |
| data       | `?any`                 | The GraphQL subscription's data                                 |
| error      | `?CombinedError`       | The `CombinedError` containing any errors that might've occured |
| extensions | `?Record<string, any>` | Optional extensions that the GraphQL server may have returned.  |

More information can be found in the [Subscriptions](/advanced/subscriptions) section.

### Context

`urql` comes with the two context components `Consumer` and `Provider` as returned
by React's `createContext` utility. It also exports the `Context` itself which can
be used in combination with the `useContext` hook.

E.g.

```js
<App>
  <UrqlProvider>
    <UrqlConsumer>{urqlData => <MyComponent data={urqlData} />}</UrqlConsumer>
  </UrqlProvider>
</App>
```
