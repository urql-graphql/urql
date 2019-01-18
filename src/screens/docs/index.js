import React from "react";
import styled from "styled-components";
import Article from "./article";
import Sidebar from "./sidebar";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

class Docs extends React.Component {
  render() {
    return (
      <Container>
        <Sidebar />
        <Article />
      </Container>
    );
  }
}

export default Docs;
