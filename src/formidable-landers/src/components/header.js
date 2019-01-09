import React from "react";
import PropTypes from "prop-types";
import CookieBanner from "./cookie-banner";

// Assets
import LOGO_GITHUB from "../assets/logo-github.svg";
import LOGO_TWITTER from "../assets/logo-twitter.svg";
import "../styles/header.css";
import formidableStyles from "../styles/formidable-header.css"; // eslint-disable-line no-unused-vars
import "../styles/cookie-banner.css";

// Formidable.com Header
import FormidableHeader from "../partials/formidable-header";
import BodyClassName from "../partials/body-class-name";

class Header extends React.Component {
  constructor(props) {
    super(props);

    // Fade in the very first page after load.
    this.state = {
      navOpen: false
    };

    this.handleToggleMenu = this.handleToggleMenu.bind(this);
  }

  handleToggleMenu(navOpen) {
    this.setState({
      navOpen
    });
  }

  render() {
    let classes = "formidableHeader";
    if (this.props.theme === "light") {
      classes = `${classes} isLight`;
    } else {
      classes = `${classes} isDark`;
    }
    if (this.props.className) {
      classes = `${classes} ${this.props.className}`;
    }

    return (
      <div>
        <CookieBanner />
        <BodyClassName
          className={this.state.navOpen ? "js-menu--is-open" : ""}
        />
        <FormidableHeader
          onToggleMenu={this.handleToggleMenu}
          isOpen={this.state.navOpen}
          location={this.props.location}
          linkRenderer={this.props.linkRenderer}
          activeLink={this.props.activeLink}
          preventSamePathReload={this.props.preventSamePathReload}
        />
        {this.props.subheader ? (
          <header className={classes}>
            <div className="formidableHeader-container">
              <div className="formidableHeader-logos">
                {this.props.logoProject}
              </div>
              {this.props.children}
            </div>
          </header>
        ) : (
          ""
        )}
      </div>
    );
  }
}

Header.propTypes = {
  activeLink: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  linkRenderer: PropTypes.func,
  location: PropTypes.object,
  logoProject: PropTypes.node,
  preventSamePathReload: PropTypes.bool,
  subheader: PropTypes.bool,
  theme: PropTypes.oneOf(["light", "dark"])
};

const defaultHeaderChildren = (
  <div className="default">
    <a
      href="https://twitter.com/FormidableLabs"
      dangerouslySetInnerHTML={{ __html: LOGO_TWITTER }}
    />
    <a
      href="https://github.com/FormidableLabs/"
      dangerouslySetInnerHTML={{ __html: LOGO_GITHUB }}
    />
  </div>
);

Header.defaultProps = {
  children: defaultHeaderChildren,
  className: "",
  logoProject: "",
  theme: "dark",
  location: { pathname: "/open-source/" },
  subheader: true,
  activeLink: props => props.current === props.item.path,
  preventSamePathReload: true
};

export default Header;
