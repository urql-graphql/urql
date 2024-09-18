import React from 'react';

const Document = ({ Html, Head, Body, children }) => (
  <Html lang="en">
    <Head>
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta
        name="description"
        content="A highly customisable and versatile GraphQL client."
      />
      <meta property="og:title" content="urql Documentation" />
      <meta property="og:site_name" content="urql Documentation" />
      <meta property="og:type" content="website" />
      <meta
        property="og:url"
        content="http://www.formidable.com/open-source/urql/"
      />
      <meta
        property="og:description"
        content="A highly customisable and versatile GraphQL client."
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon/favicon-32.png"
      />
      <link rel="manifest" href="./site.webmanifest" />
      <meta name="msapplication-TileColor" content="#ff4081" />
      <meta name="msapplica tion-config" content="./browserconfig.xml" />
      <meta name="theme-color" content="#ffffff" />
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
