import Ecology from "ecology";
import React from "react";
import Radium from "radium";

import settings from "../spectacle-variables";
import SpectacleREADME from "!!raw!spectacle/README.markdown";

class Docs extends React.Component {
  getSectionStyles() {
    return {
      position: "relative",

      zIndex: "1",
      margin: "0",
      padding: "1em 1em 3em",
      width: "100%",

      borderTop: "0",
      borderRight: `1em solid ${settings.text}`,
      borderBottom: `1em solid ${settings.text}`,
      borderLeft: `1em solid ${settings.text}`,

      [settings.mediaQueries.medium]: {
        padding: "1em 0 3em"
      }
    };
  }
  render() {
    return (
      <section style={this.getSectionStyles()}>
        <Ecology overview={SpectacleREADME} />
      </section>
    );
  }
}

export default Radium(Docs);
