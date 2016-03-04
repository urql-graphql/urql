import React from "react";
import Radium from "radium";
import marked from "marked";

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
  getVideoStyles() {
    return {
      grid: {
        [settings.mediaQueries.medium]: {
          paddingLeft: "5%",
          paddingRight: "5%"
        },
        [settings.mediaQueries.large]: {
          paddingLeft: "10%",
          paddingRight: "10%"
        }
      },
      wrapper: {
        position: "relative",
        paddingBottom: "56.25%", // 16:9 ratio
        paddingTop: "25px",
        height: 0
      },
      iframe: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%"
      }
    };
  }
  render() {
    const spectacleDocs = marked(SpectacleREADME);
    const videoStyles = this.getVideoStyles();
    return (
      <section style={this.getSectionStyles()}>
        <div style={videoStyles.grid}>
          <div style={videoStyles.wrapper}>
            <iframe
              style={videoStyles.iframe}
              width="640"
              height="360"
              src="https://www.youtube-nocookie.com/embed/vvgtgnIhJ1g?rel=0&amp;showinfo=0"
              frameBorder="0"
              allowFullScreen
            >
            </iframe>
          </div>
        </div>
       <div className="Docs" dangerouslySetInnerHTML={{__html: spectacleDocs}}>
       </div>
      </section>
    );
  }
}

export default Radium(Docs);
