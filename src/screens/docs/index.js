import React from "react";
import Radium from "radium";
import marked from "marked";
import Prism from "prismjs";
/* eslint-disable no-unused-vars */
// adds support for language-jsx (Prism.languages.jsx)
import jsx from "prismjs/components/prism-jsx";
/* eslint-enable no-unused-vars */

// Variables
import settings from "../../spectacle-variables";
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

      [`@media ${settings.mediaSizes.medium}`]: {
        padding: "1em 0 3em"
      }
    };
  }

  componentDidMount() {
    Prism.highlightAll();
  }

  render() {
    const spectacleDocs = marked(SpectacleREADME);
    return (
      <section style={this.getSectionStyles()}>
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
