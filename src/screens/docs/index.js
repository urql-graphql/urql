import React from "react";

import Page from "../../components/page";
import TitleMeta from "../../components/title-meta";
import Markdown from "./components/markdown";

// Variables
// import settings from "../../spectacle-variables";

// const getSectionStyles = () => {
//   return {
//     position: "relative",
//     zIndex: "1",
//     margin: "0",
//     padding: "1em 1em 3em",
//     width: "100%",
//     borderTop: "0",
//     borderRight: `1em solid ${settings.text}`,
//     borderBottom: `1em solid ${settings.text}`,
//     borderLeft: `1em solid ${settings.text}`,

//     [`@media ${settings.mediaSizes.medium}`]: {
//       padding: "1em 0 3em"
//     }
//   };
// };

class Docs extends React.Component {
  constructor() {
    super();

    this.state = {
      tocArray: []
    };
  }

  updateTocArray(tocArray) {
    this.setState({tocArray});
  }

  render() {
    return (
      <TitleMeta title="Spectacle | Documentation">
        <Page
          tocArray={this.state.tocArray}
          location={this.props.location}
        >
          <Markdown
            location={this.props.location}
            params={this.props.params}
            updateTocArray={this.updateTocArray.bind(this)}
          />
        </Page>
      </TitleMeta>
    );
  }
}

Docs.propTypes = {
  location: React.PropTypes.object,
  params: React.PropTypes.object
};

Docs.defaultProps = {
  params: null
};

export default Docs;
