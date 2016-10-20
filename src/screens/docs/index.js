import React from "react";

import Page from "../../components/page";
import TitleMeta from "../../components/title-meta";
import Markdown from "./components/markdown";

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
