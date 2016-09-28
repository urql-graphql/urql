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
      <a
        href="/"
        style={{display: "block", height: "125px"}}
        dangerouslySetInnerHTML={{__html: LOGO}}
      />
    );
    const isBrowser = typeof window !== "undefined" && window.__STATIC_GENERATOR !== true;

    return (
      <StyleRoot radiumConfig={isBrowser ? { userAgent: window.navigator.userAgent } : null}>
        <Header
          logoProject={SpectacleLogoLink}
          padding="40px 0 60px"
          styleBy={{ textIndent: "44px" }}
          styleContainer={{ margin: "0 auto", maxWidth: "640px" }}
          theme="light"
        >
          <div className="default">
            <Link to="/about">About</Link>
            <Link to="/docs">Docs</Link>
            <a href="https://github.com/FormidableLabs/spectacle">GitHub</a>
          </div>
        </Header>
          {this.props.children}
        <Footer
          styleContainer={{ margin: "0 auto", maxWidth: "640px" }}
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
