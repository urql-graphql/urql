import React from "react";
import PropTypes from "prop-types";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { Hero } from "./screens/home/hero";
import { Navigation, NavigationTagline } from "./components/navigation";
import { Wrapper } from "./components/wrapper";
import { createGlobalStyle } from "styled-components";
import { withRouter, Link } from "react-static";
// import { Header, Footer } from "formidable-landers";

const GlobalStyle = createGlobalStyle`
  :root {
    font-size: 10px;
  }

  body {
    background: #fff;
    box-sizing: border-box;
    color: #3b3b3b;
    font-family: sans-serif;
    font-size: 1.3rem;
    margin: 0;
    padding: 0;
  }

  * {
    box-sizing: inherit;
  }

  a {
    text-decoration: none;
  }

  img {
    max-width: 100%;
  }
`

class Template extends React.Component {
  render() {
    return (
      <div>
        <GlobalStyle />
        <Header>
          <Navigation>
            <Wrapper noPadding>
              <NavigationTagline>Lovingly created by</NavigationTagline>
              <img src="./static/svgs/logo_formidable_white.svg" alt="Formidable Logo" />
            </Wrapper>
          </Navigation>
          <Hero />
        </Header>
        <main>
          {this.props.children}
        </main>
        <Footer />
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
