import React from 'react';

// eslint-disable-next-line react/prop-types
const HTML = ({ Html, Head, Body, children }) => (
  <Html lang="en">
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="shortcut icon" href="../static/logos/favicon.ico" />
    </Head>
    <title>Urql</title>
    <Body>{children}</Body>
  </Html>
);

export default HTML;
