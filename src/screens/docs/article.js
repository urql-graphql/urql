import React from "react";
// import PropTypes from "prop-types";
import styled from "styled-components";
import { H1, H2, H3, H4, H5, H6, P } from "../../components/article-typography";

const Container = styled.article`
  max-width: 80rem;
  min-height: 100vh;
  padding: 4rem 2rem;
  width: 100%;
  @media (min-width: 768px) {
    padding: 8rem 5rem;
  }
`;

class Article extends React.Component {
  render() {
    // const { getStartedObj } = this.props;

    return (
      <Container>
        <H1>Getting Started (H1)</H1>
        <H2>Title (H2)</H2>
        <H3>Title (H3)</H3>
        <H4>Title (H4)</H4>
        <H5>Title (H5)</H5>
        <H6>Title (H6)</H6>
        <P>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam dui
          erat, vehicula eget erat nec, faucibus malesuada mi. Aliquam erat
          volutpat. Ut facilisis metus ut rhoncus dictum.
        </P>
      </Container>
    );
  }
}

Article.propTypes = {};

export default Article;
