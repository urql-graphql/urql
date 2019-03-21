import React from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import { withRouteData } from "react-static";
import Article from "./article";
import Sidebar from "./sidebar";
import burger from "../../static/svgs/burger.svg";
import logoFormidableDark from "../../static/svgs/logo_formidable_dark.svg";
import constants from "../../constants";

const headerZIndex = 800;

const Container = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  height: 6rem;
  width: 100%;
  position: fixed;
  left: 21rem;
  background: white;
  z-index: ${headerZIndex};
  padding-right: 3rem;
  box-shadow: 0 5px 10px -5px lightgrey;

  @media (max-width: 768px) {
    box-shadow: 0 5px 10px -5px lightgrey;
    margin-left: 2.5rem;
    right: 0;
    width: calc(100% - 2rem);
    justify-content: flex-start;
    left: 0;
  }
`;

const HeaderLogo = styled.img`
  position: relative;
  right: 25rem;

  @media (max-width: 768px) {
    right: 7rem;
    padding-left: 2rem;
  }
  @media (max-width: 600px) {
    display: none;
  }
`;

const CollapsedMenu = styled.div`
  cursor: pointer;
  padding-left: 3rem;
  display: none;

  @media (max-width: 768px) {
    display: block;
    visibility: ${props => (props.overlay ? "hidden" : "visible")};
  }
  @media (max-width: 600px) {
    padding-left: 2.5rem;
    position: absolute;
    left: 0;
  }
`;

const DocsTitle = styled.h2`
  font-size: 3rem;
  top: 0.2rem;
  flex: auto;
  width: 100%;
  letter-spacing: 0.5rem;
  margin: 0;
  position: relative;
  left: 9rem;
  @media (max-width: 768px) {
    font-size: 3rem;
    left: 2rem;
    margin: 0;
  }
  @media (max-width: 600px) {
    left: 6.5rem;
  }
`;

class Docs extends React.Component {
  constructor(props) {
    super(props);
    this.closeSidebar = this.closeSidebar.bind(this);
    this.state = { openSidebar: false };
  }

  openSidebar() {
    this.setState({ openSidebar: true });
  }

  closeSidebar() {
    this.setState({ openSidebar: false });
  }

  render() {
    return (
      <Container>
        <Wrapper noPadding>
          <CollapsedMenu overlay={this.state.openSidebar}>
            <img src={burger} alt="Menu" onClick={() => this.openSidebar()} />
          </CollapsedMenu>
          <DocsTitle>{constants.docsTitle}</DocsTitle>
          <HeaderLogo src={logoFormidableDark} alt="Formidable Logo" />
        </Wrapper>
        <Sidebar
          overlay={this.state.openSidebar}
          closeSidebar={this.closeSidebar}
        />
        <Article />
      </Container>
    );
  }
}

Docs.propTypes = {
  params: PropTypes.object
};

Docs.defaultProps = {
  params: null
};

export default withRouteData(Docs);
