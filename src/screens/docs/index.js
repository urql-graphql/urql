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
  padding-right: 6rem;
}

@media (max-width: 768px) {
  margin-left: 3rem;
  right: 0;
  width: calc(100% - 2rem);
  box-shadow: 0 5px 10px -5px lightgrey;
  justify-content: flex-end;
}
`;

const HeaderTagLine = styled.p`
  display: block;
  color: "rgba(0, 0, 0, 0.3)";
  line-height: 3.2rem;
  margin: 0 1rem 0 auto;
  text-transform: uppercase;
`;

class Docs extends React.Component {
  render() {
    return (
      <Container>
        <Wrapper noPadding>
          <HeaderTagLine>Lovingly created by</HeaderTagLine>
          <img
            src="../../static/svgs/logo_formidable_dark.svg"
            alt="Formidable Logo"
          />
        </Wrapper>
        <Sidebar />
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
