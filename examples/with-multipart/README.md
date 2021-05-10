# With Multipart File Upload

This example shows `urql` in use with `@urql/exchange-multipart-fetch`'s `multipartFetchExchange`
to support file uploads in GraphQL. This largely follows the ["File Uploads" docs
page](https://formidable.com/open-source/urql/docs/advanced/persistence-and-uploads/)
and uses the [`trygql.formidable.dev/graphql/uploads-mock` schema](https://github.com/FormidableLabs/trygql).

To run this example install dependencies and run the `start` script:

```sh
yarn install
yarn run start
# or
npm install
npm run start
```

This example contains:

- The `urql` bindings and a React app with a client set up in [`src/App.jsx`](src/App.jsx)
- The `multipartFetchExchange` from `@urql/exchange-multipart-fetch` in [`src/App.jsx`](src/App.jsx)
- A basic file upload form in [`src/FileUpload.jsx`](src/FileUpload.jsx)
