## CombinedError

### Description

CombinedError contains a list of all network and GraphQL errors that have occured during a GraphQL request.

### Properties

| Name          | Type          | Description                          |
| ------------- | ------------- | ------------------------------------ |
| networkError  | Error         | Network error if fetch has failed    |
| graphQLErrors | Error[]       | GraphQL errors from the API response |
| reponse       | FetchResponse | Raw Response instance                |
