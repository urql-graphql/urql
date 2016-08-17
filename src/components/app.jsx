import React from "react";
import Radium, { Style, StyleRoot } from "radium";
import { Header, Footer } from "formidable-landers";
import ReactGA from "react-ga";

// Child components
import Docs from "./docs";
import Hero from "./hero";
import Introduction from "./introduction";

// Variables and Stylesheet
import settings from "../spectacle-variables";
import theme from "../spectacle-theme";
import basename from "../basename";

class App extends React.Component {
  componentDidMount() {
    // Add Google Analytics tracking here since react-router
    // isn’t being used in entry.js
    ReactGA.initialize("UA-43290258-1");
    ReactGA.set({page: basename});
    ReactGA.pageview(basename);
  }

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
  getCircleStyles() {
    return {
      base: {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",

        zIndex: "0"
      },
      small: {
        clipPath: "circle(75vmax at 0% 100%)",
        background: `linear-gradient(0deg, ${settings.orange}, transparent 2%)`
      },
      large: {
        clipPath: "circle(105vmax at 100% 100%)",
        background: `linear-gradient(0deg, ${settings.yellow}, ${settings.white} 5%)`
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
    const circle = this.getCircleStyles();
    const headerStyles = this.getHeaderStyles();
    const footerStyles = this.getFooterStyles();
    return (
      <StyleRoot>
        <Header
          styleOverrides={headerStyles.overrides}
          linkStyles={headerStyles.linkStyles}
        />
        <Hero />
        <Introduction />
        <Docs />
        <Footer
          logoColor="black"
          background="transparent"
          styleOverrides={footerStyles.overrides}
          linkStyles={footerStyles.linkStyles}
        />
        <div style={[circle.base, circle.large]}></div>
        <div style={[circle.base, circle.small]}></div>
        <Style rules={theme} />
      </StyleRoot>
    );
  }
}

export default Radium(App);
