## ChildArgs

### Description

The first argument for the child function of a _Connect_ component.

### Properties

| Name      | Type                                | Description                                                     |
| --------- | ----------------------------------- | --------------------------------------------------------------- |
| fetching  | boolean                             | Whether a dependent GraphQL request is currently being fetched. |
| error     | [CombinedError](combined-error.md)? | Any network or GraphQL errors.                                  |
| data      | any?                                | The data returned from a GraphQL query to the server.           |
| mutations | (vars: object) => void              | A collection of functions for executing pre-specified mutations |
| refetch   | (noCache?: boolean ) => void        | Trigger a fetch of the pre-specified query.                     |
