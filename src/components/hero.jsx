import React from "react";
import Radium from "radium";

import settings from "../spectacle-variables";

class Hero extends React.Component {
  getHeroStyles() {
    return {
      position: "relative",
      margin: "0",
      padding: "0 2vw",
      height: "70vh",

      border: `1em solid ${settings.text}`,

      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      flexDirection: "column",
      justifyContent: "center"
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
        clipPath: "circle(75vmax at 100vmax 50vmax)",
        background: `linear-gradient(45deg, ${settings.yellow}, ${settings.orange})`
      },
      large: {
        clipPath: "circle(105vmax at 100vmax 0vmax)",
        background: `linear-gradient(315deg, ${settings.yellow}, ${settings.brandRed})`
      }
    };
  }

  getTitleStyles() {
    return {
      zIndex: "1",
      margin: "0",

      width: "90vw",
      height: "auto"
    };
  }

  render() {
    const circle = this.getCircleStyles();
    return (
      <div style={this.getHeroStyles()}>
        <div style={[circle.base, circle.large]}></div>
        <div style={[circle.base, circle.small]}></div>
        <h1 style={this.getTitleStyles()}>
          <img src="./static/logotype-spectacle.svg" style={{width: "100%"}}/>
        </h1>
      </div>
    );
  }
}

export default Radium(Hero);
