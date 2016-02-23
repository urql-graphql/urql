import Ecology from "ecology";
import React from "react";
import Radium from "radium";

import settings from "../spectacle-variables";
import SpectacleREADME from "!!raw!spectacle/README.markdown";

class Docs extends React.Component {
  getMainStyles() {
    return {
      position: "relative",

      zIndex: "0",
      margin: "0",
      padding: "2em 1em",
      width: "100%",

      borderTop: "0",
      borderRight: `1em solid ${settings.text}`,
      borderBottom: `1em solid ${settings.text}`,
      borderLeft: `1em solid ${settings.text}`,

      [settings.mediaQueries.medium]: {
        padding: "2em 5em"
      }
    };
  }
  render() {
    return (
      <section style={this.getMainStyles()}>
        <div className="Container">
          <Ecology overview={SpectacleREADME} />
        </div>
      </section>
    );
  }
}

export default Radium(Docs);
