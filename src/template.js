import React from "react";
import PropTypes from "prop-types";
import { withRouter, Link } from "react-static";
import LOGO from "./static/logo.svg";
import { Header, Footer } from "formidable-landers";

class Template extends React.Component {
  render() {
    const SpectacleLogoLink = (
      <h1 className="u-noMargin">
        <Link
          to="/"
          className="Logo"
          dangerouslySetInnerHTML={{ __html: LOGO }}
        />
      </h1>
    );

    return (
      <div className="Site">
        <Header
          logoProject={SpectacleLogoLink}
          padding="20px 6vw 30px"
          theme="dark"
        >
          <div className="default">
            <Link to="/about/" activeClassName="is-active">
              About
            </Link>
            <Link to="/docs/" activeClassName="is-active">
              Docs
            </Link>
            <a href="https://www.github.com/FormidableLabs/spectacle/issues">
              Issues
            </a>
            <a href="https://github.com/FormidableLabs/spectacle">GitHub</a>
          </div>
        </Header>
        <main>{this.props.children}</main>
        <Footer padding="5rem 6vw 6rem" />
      </div>
    );
  }
}

Template.propTypes = {
  children: PropTypes.node
};

Template.defaultProps = {
  children: null
};

export default withRouter(Template);
