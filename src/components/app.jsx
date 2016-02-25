import React from "react";
import Radium, { Style, StyleRoot } from "radium";

import Docs from "./docs";
import Hero from "./hero";
import { Header, Footer } from "formidable-landers";

import settings from "../spectacle-variables";
import theme from "../spectacle-theme";

class App extends React.Component {
  getHeaderOverrides() {
    return {
      backgroundColor: "transparent",
      borderTop: `1em solid ${settings.text}`,
      borderRight: `1em solid ${settings.text}`,
      borderBottom: "0",
      borderLeft: `1em solid ${settings.text}`
    };
  }
  getHeaderLinkStyles() {
    return {
      color: settings.orange,
      borderColor: settings.orange,
      ":hover": {
        color: settings.text,
        boxShadow: `inset 0 -0.2em ${settings.orange}`
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
  getFooterOverrides() {
    return {
      zIndex: "1",
      position: "relative",

      margin: "0",

      borderTop: "0",
      borderRight: `1em solid ${settings.text}`,
      borderBottom: `1em solid ${settings.text}`,
      borderLeft: `1em solid ${settings.text}`
    };
  }

  render() {
    const circle = this.getCircleStyles();
    return (
      <StyleRoot>
        <Header
          styleOverrides={this.getHeaderOverrides()}
          linkStyles={this.getHeaderLinkStyles()}
        />
        <Hero />
        <Docs />
        <Footer
          backgroundColor={"transparent"} styleOverrides={this.getFooterOverrides()}
        />
        <div style={[circle.base, circle.large]}></div>
        <div style={[circle.base, circle.small]}></div>
        <Style rules={theme} />
      </StyleRoot>
    );
  }
}

export default Radium(App);
