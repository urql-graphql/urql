---
'@urql/vue': patch
---

Exposed callUseQuery to allow executing queries in app setup functions.
Add clientId parameter to useClient and provideClient, as well as useQuery to support multi-client setups (Note: You must provide app.provide('\$myUrql', myUrqlClient) yourself).
Then it becomes trivial to write code like const useMyApiQuery = (args) => useQuery(args, '$myUrql') and provide this function across your app to execute queries against a concrete API Client
