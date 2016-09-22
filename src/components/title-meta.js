import React from "react";
import DocumentMeta from "react-document-meta";

class TitleMeta extends React.Component {
  render() {
    const titleMeta = {
      title: this.props.title,
      meta: {
        property: {
          "og:title": this.props.title
        }
      }
    };

    return (
      <DocumentMeta {...titleMeta}>
        {this.props.children}
      </DocumentMeta>
    );
  }
}

TitleMeta.propTypes = {
  title: React.PropTypes.string,
  children: React.PropTypes.node
};

export default TitleMeta;

export const renderAsHTML = function () {
  return DocumentMeta.renderAsHTML();
};
