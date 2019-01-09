import React from "react";
import PropTypes from "prop-types";
import Page from "../../components/page";
// import TitleMeta from "../../components/title-meta";
import Markdown from "./components/markdown";
import { withRouter, withRouteData, Link } from "react-static";

class Docs extends React.Component {
  constructor() {
    super();

    this.state = {
      tocArray: []
    };
  }

  updateTocArray(tocArray) {
    this.setState({ tocArray });
  }
  // {/*<TitleMeta title="Spectacle | Documentation">*/}
  render() {
    return (
        <Page tocArray={this.state.tocArray} location={this.props.location}>
          <Markdown
            location={this.props.location}
            params={this.props.params}
            updateTocArray={this.updateTocArray.bind(this)}
            {...this.props}
          />
        </Page>
    );
  }
}

Docs.propTypes = {
  location: PropTypes.object,
  params: PropTypes.object
};

Docs.defaultProps = {
  params: null
};

export default withRouter(withRouteData(Docs));
