import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const Container = styled.aside`
  background-color: #3d4247;
  min-height: 100vh;
  min-width: 6rem;
  width: 6rem;
  @media (min-width: 768px) {
    min-width: 26rem;
    width: 26rem;
  }
`;

class Sidebar extends React.Component {
  render() {
    const { getStartedObj } = this.props;

    return (
      <Container>
      </Container>
    );
  }
}

Sidebar.propTypes = {};

export default Sidebar;
