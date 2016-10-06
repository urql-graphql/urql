/* global window */
import React from "react";
import Radium, { StyleRoot } from "radium";
import { Link } from "react-router";
import { Header, Footer } from "formidable-landers";

// Variables and Stylesheet
import LOGO from "../../static/logo.svg";
import "../styles/styles.css";

class App extends React.Component {
  render() {
    const SpectacleLogoLink = (
      <h1 className="u-noMargin">
        <a
          href="/"
          style={{display: "block", height: "125px"}}
          dangerouslySetInnerHTML={{__html: LOGO}}
        />
      </h1>
    );
    const isBrowser = typeof window !== "undefined" && window.__STATIC_GENERATOR !== true;

    return (
      <StyleRoot radiumConfig={isBrowser ? { userAgent: window.navigator.userAgent } : null}>
        <Header
          logoProject={SpectacleLogoLink}
          padding="40px 3vw 60px"
          styleBy={{ textIndent: "20px" }}
          styleContainer={{ margin: "0 auto" }}
          theme="dark"
        >
          <div className="default">
            <Link to="/about">About</Link>
            <Link to="/docs">Docs</Link>
            <a href="https://www.github.com/FormidableLabs/spectacle/issues">Issues</a>
            <a href="https://github.com/FormidableLabs/spectacle">GitHub</a>
          </div>
        </Header>
          {this.props.children}
        <Footer
          padding="5rem 3vw 6rem"
          styleContainer={{ margin: "0 auto" }}
        />
      </StyleRoot>
    );
  }
}

App.propTypes = {
  children: React.PropTypes.node
};

App.defaultProps = {
  children: null
};

export default Radium(App);
