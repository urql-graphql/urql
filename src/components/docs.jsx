import React from "react";
import Radium from "radium";
import marked from "marked";
import Prism from "prismjs";
/* eslint-disable no-unused-vars */
// adds support for language-jsx (Prism.languages.jsx)
import jsx from "prismjs/components/prism-jsx";
/* eslint-enable no-unused-vars */

// Variables
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
        marginTop: "1em",
        paddingBottom: "56.25%", // 16:9 ratio
        paddingTop: "25px",
        height: "0px"
      },
      iframe: {
        position: "absolute",
        top: "0px",
        left: "0px",
        width: "100%",
        height: "100%"
      }
    };
  }

  componentDidMount() {
    Prism.highlightAll();
  }

  render() {
    const spectacleDocs = marked(SpectacleREADME);
    const videoStyles = this.getVideoStyles();
    return (
      <section style={this.getSectionStyles()}>
        <div className="Docs">
          <h2 style={{margin: "0px"}}>Take a tour</h2>
        </div>
        <div className="Container">
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
          <p style={{margin: "2em 0 0 0", textAlign: "center"}}>
            <a className="Button" href="http://stack.formidable.com/spectacle/">
              View the live example
            </a>
          </p>
          <p style={{margin: "3em 0 0 0", textAlign: "center"}}>
            <a className="Button" href="https://github.com/FormidableLabs/spectacle-boilerplate/">
              Create a deck with the boilerplate
            </a>
          </p>
        </div>
        <div className="Docs">
          <h1>Peruse the documentation</h1>
        </div>
       <div className="Docs" dangerouslySetInnerHTML={{__html: spectacleDocs}}>
       </div>
       <div className="Docs">
         <p style={{margin: "3em 0 0 0", textAlign: "center"}}>
           <a className="Button" href="https://github.com/FormidableLabs/spectacle-boilerplate/">Get started with the boilerplate</a>
         </p>
       </div>
      </section>
    );
  }
}

export default Radium(Docs);
