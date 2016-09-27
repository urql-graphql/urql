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
import GettingStartedMD from "!!raw!spectacle/docs/getting-started.md";
import BasicConceptsMD from "!!raw!spectacle/docs/basic-concepts.md";
import ApiMD from "!!raw!spectacle/docs/tag-api.md";
import PropsMD from "!!raw!spectacle/docs/props.md";
import ExtensionsMD from "!!raw!spectacle/docs/extensions.md";

const getSectionStyles = () => {
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
};

class GettingStarted extends React.Component {
  componentDidMount() {
    Prism.highlightAll();
  }

  render() {
    const gettingStarted = marked(GettingStartedMD);
    return (
      <section style={getSectionStyles()}>
       <div className="Docs" dangerouslySetInnerHTML={{__html: gettingStarted}}>
       </div>
      </section>
    );
  }
}

class Basic extends React.Component {
  componentDidMount() {
    Prism.highlightAll();
  }

  render() {
    const basicConcepts = marked(BasicConceptsMD);
    return (
      <section style={getSectionStyles()}>
       <div className="Docs" dangerouslySetInnerHTML={{__html: basicConcepts}}>
       </div>
      </section>
    );
  }
}

class Api extends React.Component {
  componentDidMount() {
    Prism.highlightAll();
  }

  render() {
    const apiDocs = marked(ApiMD);
    return (
      <section style={getSectionStyles()}>
       <div className="Docs" dangerouslySetInnerHTML={{__html: apiDocs}}>
       </div>
      </section>
    );
  }
}

class Props extends React.Component {
  componentDidMount() {
    Prism.highlightAll();
  }

  render() {
    const propsDocs = marked(PropsMD);
    return (
      <section style={getSectionStyles()}>
       <div className="Docs" dangerouslySetInnerHTML={{__html: propsDocs}}>
       </div>
      </section>
    );
  }
}

class Extensions extends React.Component {
  componentDidMount() {
    Prism.highlightAll();
  }

  render() {
    const extensionsDocs = marked(ExtensionsMD);
    return (
      <section style={getSectionStyles()}>
       <div className="Docs" dangerouslySetInnerHTML={{__html: extensionsDocs}}>
       </div>
      </section>
    );
  }
}

const GettingStartedComponent = Radium(GettingStarted);
const BasicComponent = Radium(Basic);
const ApiComponent = Radium(Api);
const PropsComponent = Radium(Props);
const ExtensionsComponent = Radium(Extensions);

export { BasicComponent, ApiComponent, GettingStartedComponent, PropsComponent, ExtensionsComponent };
