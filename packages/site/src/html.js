import React from 'react';

const Document = ({ Html, Head, Body, children }) => (
  <Html lang="en">
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link
        href="https://fonts.googleapis.com/css?family=Space+Mono&display=swap"
        rel="stylesheet"
      />
      <title>urql Documentation</title>
    </Head>
    <Body>{children}</Body>
  </Html>
);

export default Document;
