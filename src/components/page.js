import React from "react";
import Sidebar from "./sidebar";
import PropTypes from "prop-types";
// Our troubles begin and end with the tocArray -- it's not great to pass down the markdown file and parse
// it in one component to add tags + piggyback on existing HTML then parse it again in the sidebar component to get the
// subheadings, all with a dependency on the location. This dovetails into our other problem, which is that
// different landers take different approaches to:

// 1) Writing/formatting the markdown
// 2) Ingesting/importing the markdown
// 3) Processing/parsing the markdown
// 4) Rendering the markdown

// The way we've organized the tasks and conceive of the problem space is by tangible deliverables per page/lander
// incrementally and not as a problem which can/should be considered in aggregate, so for now this is a problem which can
// only be partially addressed on an ad-hoc basis.

class Page extends React.Component {
  render() {
    return (
      <div className="Site-content">
        <div className="Container Grid Grid--guttersLg large-Grid--nowrap Site-content u-noMarginBottom">
          <div className="Grid-cell Grid-cell--full large-Grid-cell--autoSize">
            <Sidebar
              tocArray={this.props.tocArray}
              location={this.props.location}
            />
          </div>
          <div className="Grid-cell Page-content">{this.props.children}</div>
        </div>
      </div>
    );
  }
}

Page.propTypes = {
  children: PropTypes.node,
  home: PropTypes.bool,
  location: PropTypes.object,
  tocArray: PropTypes.array
};

Page.defaultProps = {
  children: null,
  home: false,
  tocArray: []
};

export default Page;
