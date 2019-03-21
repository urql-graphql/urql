import React from "react";
import PropTypes from "prop-types";

class CustomDocument extends React.Component {
  render() {
    const { Html, Head, Body, children, renderMeta } = this.props;
    return (
      <Html>
        <Head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
          <meta
            name="description"
            content="A React.js based library for creating sleek presentations using JSX syntax (with the ability to live demo your code!)"
          />
          <meta property="og:title" content="Spectacle" />
          <meta property="og:site_name" content="Spectacle" />
          <meta property="og:type" content="website" />
          <meta
            property="og:url"
            content="http://www.formidable.com/open-source/spectacle/"
          />
          <meta property="og:image" content="./static/og-image.png" />
          <meta
            property="og:description"
            content="A React.js based library for creating sleek presentations using JSX syntax (with the ability to live demo your code!)"
          />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <link
            rel="icon"
            href="./static/favicon/favicon.ico"
            type="image/x-icon"
          />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="./static/favicon/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="./static/favicon/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="./static/favicon/favicon-16x16.png"
          />
          <link rel="manifest" href="./static/favicon/site.webmanifest" />
          <link
            rel="mask-icon"
            href="./static/favicon/safari-pinned-tab.svg"
            color="#ff4081"
          />
          <link rel="shortcut icon" href="./static/favicon/favicon.ico" />
          <meta name="msapplication-TileColor" content="#ff4081" />
          <meta
            name="msapplication-config"
            content="./static/favicon/browserconfig.xml"
          />
          <meta name="theme-color" content="#ffffff" />
          {renderMeta.styleTags}
          <title>Spectacle</title>
        </Head>
        <Body>
          <div id="content">{children}</div>
        </Body>
      </Html>
    );
  }
}

CustomDocument.propTypes = {
  Body: PropTypes.func,
  Head: PropTypes.func,
  Html: PropTypes.func,
  children: PropTypes.object,
  renderMeta: PropTypes.object
};

export default CustomDocument;
