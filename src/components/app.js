import React from "react";
import { Link } from "react-router";
import { Header, Footer } from "formidable-landers";

// Variables and Stylesheet
import LOGO from "../../static/logo.svg";
import "../styles/styles.css";

class App extends React.Component {
  render() {
    const SpectacleLogoLink = (
      <h1 className="u-noMargin">
        <Link
          to="/"
          className="Logo"
          dangerouslySetInnerHTML={{__html: LOGO}}
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
            <Link to="/about/" activeClassName="is-active">About</Link>
            <Link to="/docs/" activeClassName="is-active">Docs</Link>
            <a href="https://www.github.com/FormidableLabs/spectacle/issues">Issues</a>
            <a href="https://github.com/FormidableLabs/spectacle">GitHub</a>
          </div>
        </Header>

        { this.props.children }

        <Footer
          padding="5rem 6vw 6rem"
        />
      </div>
    );
  }
}

App.propTypes = {
  children: React.PropTypes.node
};

App.defaultProps = {
  children: null
};

export default App;
