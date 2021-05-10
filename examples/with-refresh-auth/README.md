# With Refresh Authentication

This example shows `urql` in use with `@urql/exchange-auth`'s `authExchange`
to support authentication token and refresh token logic. This largely follows the ["Authentication" docs
page](https://formidable.com/open-source/urql/docs/advanced/authentication/)
and uses the [`trygql.formidable.dev/graphql/web-collections` schema](https://github.com/FormidableLabs/trygql).

To run this example install dependencies and run the `start` script:

```sh
yarn install
yarn run start
# or
npm install
npm run start
```

This example contains:

- The `urql` bindings and a React app set up in [`src/App.jsx`](src/App.jsx)
- Some authentication glue code to store the tokens in [`src/authStore.js`](src/authStore.js)
- The `Client` and the `authExchange` from `@urql/exchange-auth` set up in [`src/client.js`](src/client.js)
- A basic login form in [`src/pages/LoginForm.jsx`](src/pages/LoginForm.jsx)
- And a basic login guard on [`src/App.jsx`](src/App.jsx)
  (Note: This isn't using a query in this particular component, since this is just an example)
