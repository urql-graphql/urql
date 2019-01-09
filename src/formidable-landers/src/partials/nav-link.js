import React, { Component } from "react";
import PropTypes from "prop-types";

export default class NavLink extends Component {
  static displayName = "NavLink";
  static propTypes = {
    Tag: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.func,
      PropTypes.object
    ]),
    activeLink: PropTypes.func,
    className: PropTypes.string,
    current: PropTypes.string.isRequired,
    item: PropTypes.object.isRequired,
    linkRenderer: PropTypes.func,
    onClick: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.handleLinkRenderer = this.handleLinkRenderer.bind(this);
  }

  handleLinkRenderer(props) {
    const { className, item, onClick, activeLink } = props;
    const activeClass = activeLink(props) ? "active" : "inactive";
    return props.linkRenderer ? (
      props.linkRenderer({ ...props, activeClass })
    ) : (
      <a
        href={item.path}
        className={`${className} ${activeClass}`}
        onClick={onClick}
      >
        {item.title}
      </a>
    );
  }

  render() {
    return this.handleLinkRenderer({ ...this.props });
  }
}
