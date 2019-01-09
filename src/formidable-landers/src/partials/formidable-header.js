import React, { Component } from "react";
import PropTypes from "prop-types";
import NavLink from "./nav-link";

const navItems = [
  { path: "/about/", title: "What We Do" },
  { path: "/work/", title: "Our Work" },
  { path: "/careers/", title: "Careers" },
  { path: "/open-source/", title: "Open Source" },
  { path: "/blog/", title: "Journal" },
  { path: "/contact/", title: "Contact" }
];
const ESCSAPE_KEY_CODE = 27;
// eslint-disable-next-line max-len
const LOGO_PATH =
  "M3.685,8.038h5.26v2.88H3.715v5.3H0.535V2.048h9.13v2.99H3.685v3Zm16.22,3.2a5.27,5.27,0,1,1-5.28-5.26q0.142,0,.284,0A5.13,5.13,0,0,1,19.9,11.238Zm-3.04,0a2.25,2.25,0,1,0-4.48,0A2.252,2.252,0,1,0,16.865,11.238Zm6.95-3.62V6.328h-2.94v9.93h3v-4.38c0-2,1.1-2.7,2.32-2.7a4.12,4.12,0,0,1,1,.1V6.328a3,3,0,0,0-.8-0.1A2.81,2.81,0,0,0,23.815,7.618ZM40.347,5.986A3.479,3.479,0,0,0,39.8,5.978a3.41,3.41,0,0,0-3.08,1.56,3.07,3.07,0,0,0-2.94-1.56,3.46,3.46,0,0,0-2.86,1.44V6.328h-2.9v9.93h3V10.5a1.61,1.61,0,0,1,1.5-1.717q0.072,0,.144,0a1.51,1.51,0,0,1,1.6,1.68v5.76h3v-5.74a1.61,1.61,0,0,1,1.517-1.7q0.072,0,.143,0a1.51,1.51,0,0,1,1.58,1.68v5.76h2.98V9.778A3.48,3.48,0,0,0,40.347,5.986Zm4.708,10.221h3.04V6.278h-3.04v9.93Zm1.52-14.74h-0.02A1.779,1.779,0,1,0,46.575,1.468Zm12.95,13.04c0,0.9.08,1.56,0.08,1.78h-2.92a6.9,6.9,0,0,1-.08-1,3.21,3.21,0,0,1-2.66,1.18q-0.155,0-.309-0.009a4.92,4.92,0,0,1-4.611-5.211q-0.011-.155-0.011-0.311a4.85,4.85,0,0,1,4.831-4.869c1.68,0,2.44.62,2.68,1V1.748h3v12.76Zm-2.96-3.27a2.25,2.25,0,1,0-4.48,0,2.24,2.24,0,0,0,2.24,2.51v-0.03A2.24,2.24,0,0,0,56.565,11.238Zm12.94,3.41a9.746,9.746,0,0,0,.12,1.54h-2.74a4.77,4.77,0,0,1-.1-1.12,3.48,3.48,0,0,1-6.24-1.62,3.05,3.05,0,0,1,2.94-3l2.34-.36h0.041a0.68,0.68,0,0,0,.679-0.681q-0.006-.055-0.016-0.11a1.23,1.23,0,0,0-1.444-.97,1.6,1.6,0,0,0-1.68,1.49l-2.64-.54c0.12-1.42,1.44-3.3,4.36-3.3,3.22,0,4.4,1.84,4.4,3.84H69.5v4.83Zm-2.98-2.33v-0.4l-1.88.3h-0.02a1.1,1.1,0,0,0-1.1,1.1,1,1,0,0,0,1.18,1A1.71,1.71,0,0,0,66.525,12.318Zm15.04-1.1c0,3.04-1.96,5.22-4.74,5.22a3.2,3.2,0,0,1-2.8-1.34v1.12h-2.94V1.748h3v5.47a3.57,3.57,0,0,1,2.86-1.18C79.825,6.038,81.565,8.178,81.565,11.218Zm-3.04.02a2.26,2.26,0,1,0-4.5,0,2.26,2.26,0,0,0,2.26,2.48A2.23,2.23,0,0,0,78.525,11.238Zm4.01,4.98h3.04V1.748h-3.04v14.47Zm13.87-4.23h-6.92a2.15,2.15,0,0,0,2.26,1.92,1.92,1.92,0,0,0,2-1.3l2.54,0.72a4.46,4.46,0,0,1-4.64,3.19q-0.184,0-.367,0a5.06,5.06,0,0,1-4.813-5.3q-0.006-.123-0.006-0.246a5,5,0,0,1,5.006-4.994c3.1,0,5,1.9,5,5.1A6.118,6.118,0,0,1,96.4,11.988Zm-2.86-1.91q0-.068-0.012-0.136A1.78,1.78,0,0,0,91.545,8.4a1.89,1.89,0,0,0-2,1.68h4Z";

export default class Header extends Component {
  static displayName = "Header";

  static propTypes = {
    activeLink: PropTypes.func,
    isOpen: PropTypes.bool,
    linkRenderer: PropTypes.func,
    location: PropTypes.object,
    onToggleMenu: PropTypes.func,
    preventSamePathReload: PropTypes.bool
  };

  static defaultProps = {
    isOpen: false
  };

  constructor(props) {
    super(props);
    this.onResize = this.onResize.bind(this);
    this.onEscape = this.onEscape.bind(this);
    this.handleToggleMenu = this.handleToggleMenu.bind(this);
    this.handleAnchorClick = this.handleAnchorClick.bind(this);
  }

  componentDidMount() {
    if (typeof window !== "undefined") {
      document.addEventListener("keydown", this.onEscape);
      window.addEventListener("resize", this.onResize);
    }
  }

  componentWillUnmount() {
    if (typeof window !== "undefined") {
      document.removeEventListener("keydown", this.onEscape);
      window.removeEventListener("resize", this.onResize);
    }
  }

  /**
   * Close hamburger dropdown menu items when in desktop size
   *
   * @returns {void}
   */
  onResize() {
    // eslint-disable-next-line no-magic-numbers
    if(typeof window !== "undefined") {
      const mobileVersion = document.getElementsByClassName(
        "display-mobile-only"
      )[0];
      const style = getComputedStyle(mobileVersion);
      if (style.display === "none" && this.props.isOpen === true) {
        this.props.onToggleMenu(!this.props.isOpen);
      }
    }
  }

  /**
   * Closes the hamburger menu when the escape key is pressed
   * @param {number} keyCode accepts keycode from event
   * @memberof Header
   * @returns {void}
   */
  onEscape({ keyCode }) {
    if (this.props.isOpen === true) {
      // If pressed escape key
      if (keyCode === ESCSAPE_KEY_CODE) {
        this.props.onToggleMenu(!this.props.isOpen);
      }
    }
  }

  /**
   * @param {object} e React synthetic event object
   * Toggles open and closed the hamburger menu when clicking on the menu button
   * and prevents reload if the path selected is the same as the current path
   * @returns {void}
   */
  handleToggleMenu(e) {
    this.props.onToggleMenu(!this.props.isOpen);
    this.handleAnchorClick(e);
  }

  handleAnchorClick(e) {
    if (
      this.props.location.pathname === e.target.getAttribute("href") &&
      this.props.preventSamePathReload
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  render() {
    const { isOpen } = this.props;
    return (
      <div>
        <div className={`site-header isOpen-${this.props.isOpen}`}>
          {/* Site-Header: Logo */}
          <a
            onClick={this.handleAnchorClick}
            href="/"
            className="site-header__logo"
            title="Formidable"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 97 18"
              aria-labelledby="logotype-formidable"
              className="logo-type"
            >
              <title id="logotype-formidable">Formidable</title>
              <path d={LOGO_PATH} />
            </svg>
          </a>

          <nav className="site-header__nav display-desktop-only">
            {navItems.map((item, i) => (
              <NavLink
                className="site-header__nav-links"
                item={item}
                current={this.props.location.pathname}
                onClick={this.handleAnchorClick}
                linkRenderer={this.props.linkRenderer}
                activeLink={this.props.activeLink}
                key={i}
              />
            ))}
          </nav>
          <div className="site-header__nav display-mobile-only">
            {/* Site-Header: Toggle */}
            <button
              className="site-header__menu-toggle"
              title="navigation menu"
              aria-label="navigation menu"
              role="button"
              onClick={this.handleToggleMenu}
            >
              Menu
              <span className="site-header__menu-text" />
              <span className="site-header__menu-bar" />
            </button>
          </div>
        </div>
        {/* SITE MENU FOR MOBILE */}
        <nav className="site-menu" aria-hidden={!isOpen}>
          <ul className="site-menu__nav">
            {navItems.map((item, i) => (
              <li key={`navlink-${item}-${i}`} className="site-menu__nav-item">
                <NavLink
                  className="site-menu__nav-item-link"
                  onClick={this.handleToggleMenu}
                  item={item}
                  current={this.props.location.pathname}
                  linkRenderer={this.props.linkRenderer}
                  activeLink={this.props.activeLink}
                  key={i}
                />
              </li>
            ))}
          </ul>
        </nav>
      </div>
    );
  }
}
