import React from "react";
import Sidebar from "./sidebar";

class Page extends React.Component {
  render() {
    return (
      <main className="Page Site-content Site-content--flex">
        <div className="Page-Container Container Grid Grid--guttersLg large-Grid--nowrap Site-content">
            <div className="Grid-cell Grid-cell--full large-Grid-cell--autoSize">
              <Sidebar
                tocArray={this.props.tocArray}
                location={this.props.location}
              />
            </div>
            <div className="Grid-cell Page-content">
              { this.props.children }
            </div>
        </div>
      </main>
    );
  }
}

Page.propTypes = {
  children: React.PropTypes.node,
  home: React.PropTypes.bool,
  tocArray: React.PropTypes.array,
  location: React.PropTypes.object
};

Page.defaultProps = {
  children: null,
  home: false,
  tocArray: []
};


export default Page;
