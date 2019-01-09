import React, { Component } from "react";
import PropTypes from "prop-types";
import "../styles/cookie-banner.css";

class CookieBanner extends Component {
  constructor(props) {
    super(props);
    this.state = {
      close: true
    };
    this.handleClose = this.handleClose.bind(this);
  }

  componentDidMount() {
    // TODO: We should have a comment as to why we're doing this here and
    // if there are other better alternatives.
    //
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({
      close: localStorage.getItem("closed_cookie_banner") || false
    });
  }

  handleClose() {
    try {
      localStorage.setItem("closed_cookie_banner", true);
    } catch (err) {
      // Catch possible quota exceeded errors
    }
    this.setState({
      close: true
    });
  }

  render() {
    let classes = "formidaCookie";
    if (this.props.className) {
      classes = `${classes} ${this.props.className}`;
    }
    if (this.state.close) {
      return null;
    }
    return (
      <div className={classes}>
        <div className="formidaCookie-container">
          <p className="formidaCookie-content">
            This site uses cookies to gather analytics data that helps us
            improve our website. By using our site, you acknowledge that you
            have read and understand our{" "}
            <a href="https://formidable.com/privacy-policy/#cookies-policy">
              Cookie Policy
            </a>{" "}
            and{" "}
            <a href="https://formidable.com/privacy-policy">Privacy Policy</a>.
            Your use of Formidable’s Products & Services, including our Open
            Source Software, is subject to these policies and terms.
          </p>
          <button
            type="button"
            onClick={this.handleClose}
            className="formidaCookie-button"
          >
            Ok
          </button>
        </div>
      </div>
    );
  }
}

CookieBanner.propTypes = {
  className: PropTypes.string
};

CookieBanner.defaultProps = {
  className: ""
};

export default CookieBanner;
