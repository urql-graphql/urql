import React from "react";
import Radium from "radium";

import settings from "../spectacle-variables";

class Hero extends React.Component {
  getHeroStyles() {
    return {
      position: "relative",
      margin: "0 auto 25% auto",
      padding: "200px 0 0",
      background: "#0b0b0b url('./static/bg.png') top center repeat-x"
    };
  }

  getSkewStyles() {
    return {
      zIndex: "0",
      position: "absolute",
      top: "40%",
      left: "0",
      right: "0",
      height: "120%",
      transformOrigin: "top left",
      transform: "skew(0deg, 15deg)",
      backgroundColor: settings.jet
    };
  }

  getInstallerStyles() {
    return {
      zIndex: "1",
      margin: "0",
      position: "relative",
      textAlign: "center"
    };
  }

  getInstallerHeadingStyles() {
    return {
      backgroundColor: settings.gold,
      border: `1px solid ${settings.darkGold}`,
      color: settings.jet,
      display: "inline-block",
      fontFamily: settings.monospace,
      fontSize: "1.5rem",
      lineHeight: 1.2,
      margin: "0 auto",
      padding: "1em 2em",
      textAlign: "center"
    };
  }

  render() {
    return (
      <div style={this.getHeroStyles()}>
        <div style={this.getSkewStyles()}></div>
        <h1 style={{margin: "0 auto 2em", zIndex: "1", position: "relative", width: "65%", maxWidth: "995px"}}>
          <img src="./static/logotype-builder.svg" alt="Builder" />
        </h1>
        <div style={this.getInstallerStyles()}>
          <h2 style={this.getInstallerHeadingStyles()}>npm install builder</h2>
        </div>
      </div>
    );
  }
}

export default Radium(Hero);
