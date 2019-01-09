import React from "react";
import find from "lodash/find";
import { withRouteData, withRouter } from "react-static";
import PropTypes from "prop-types";
import Prism from "prismjs";
/* eslint-disable no-unused-vars */
// add more language support
import jsx from "prismjs/components/prism-jsx";
import sh from "prismjs/components/prism-bash";
import yaml from "prismjs/components/prism-yaml";
/* eslint-enable no-unused-vars */

class Markdown extends React.Component {
  constructor() {
    super();
    this.state = {
      renderedMd: ""
    };
  }

  componentDidMount() {
    Prism.highlightAll();
  }

  componentDidUpdate() {
    Prism.highlightAll();
  }

  render() {
    return (
      <article
        className="Markdown"
        dangerouslySetInnerHTML={{
          __html: this.props.renderedMd
        }}
      />
    );
  }
}

Markdown.propTypes = {
  renderedMd: PropTypes.string
};

Markdown.defaultProps = {
  params: null
};

export default withRouteData(withRouter(Markdown));
