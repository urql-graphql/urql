import React from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import { withRouter, withRouteData } from "react-static";
import Article from "./article";
import Sidebar from "./sidebar";

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
  position: absolute;
  padding-right: 3rem;
}

@media (max-width: 768px) {
  box-shadow: 0 5px 10px -5px lightgrey;
  margin-left: 3rem;
  right: 0;
  width: calc(100% - 2rem);
  justify-content: flex-end;
}
`;

const HeaderLogo = styled.img`
  position: absolute;
  right: 3rem;
  top: 1.5rem;

  @media (max-width: 600px) {
    display: none;
  }
`;

const CollapsedMenu = styled.div`
  padding-left: 3rem;
  display: ${props => (props.overlay ? "none" : "")};

  @media (min-width: 768px) {
    display: none;
  }
  @media (max-width: 600px) {
    position: absolute;
    left: 0;
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
            <img
              src="../../static/svgs/burger.svg"
              alt="Menu"
              onClick={() => this.openSidebar()}
            />
          </CollapsedMenu>
          <HeaderLogo
            src="../../static/svgs/logo_formidable_dark.svg"
            alt="Formidable Logo"
          />
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

export default withRouter(withRouteData(Docs));
