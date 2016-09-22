/* global window */
import React from "react";
import Radium, { Style, StyleRoot } from "radium";
import { Header, Footer } from "formidable-landers";

// Variables and Stylesheet
import settings from "../spectacle-variables";
import theme from "../spectacle-theme";

class App extends React.Component {

  getHeaderStyles() {
    return {
      overrides: {
        background: "transparent",
        borderTop: `1em solid ${settings.text}`,
        borderRight: `1em solid ${settings.text}`,
        borderBottom: "0",
        borderLeft: `1em solid ${settings.text}`
      },
      linkStyles: {
        color: settings.orange,
        borderColor: settings.orange,
        ":hover": {
          color: settings.text,
          boxShadow: `inset 0 -0.2em ${settings.orange}`
        }
      }
    };
  }
  getFooterStyles() {
    return {
      overrides: {
        zIndex: "1",
        position: "relative",

        margin: "0",

        borderTop: "0",
        borderRight: `1em solid ${settings.text}`,
        borderBottom: `1em solid ${settings.text}`,
        borderLeft: `1em solid ${settings.text}`
      },
      linkStyles: {
        color: settings.text,
        borderColor: settings.red,
        ":hover": {
          color: settings.red,
          boxShadow: `inset 0 -0.2em ${settings.red}`
        }
      }
    };
  }

  render() {
    const headerStyles = this.getHeaderStyles();
    const footerStyles = this.getFooterStyles();
    const isBrowser = typeof window !== "undefined" && window.__STATIC_GENERATOR !== true;
    return (
      <StyleRoot radiumConfig={isBrowser ? { userAgent: window.navigator.userAgent } : null}>
        <Header
          styleOverrides={headerStyles.overrides}
          linkStyles={headerStyles.linkStyles}
        />
          {this.props.children}
        <Footer
          logoColor="black"
          background="transparent"
          styleOverrides={footerStyles.overrides}
          linkStyles={footerStyles.linkStyles}
        />
        <Style rules={theme} />
      </StyleRoot>
    );
  }
}

App.propTypes = {
  children: React.PropTypes.node
};

App.defaultProps = {
  children: null
};

export default Radium(App);
