import React from "react";
import styled from "styled-components";
import Article from "./article";
import Sidebar from "./sidebar";
import content from "../docs/_content";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  height: 8rem;
  width: 100%;
  position: absolute;
  padding-right: 6rem;

  & img {
    margin-left: auto;
    @media (min-width: 768px) {
      margin-left: 0;
    }
  }
`;

const HeaderTagLine = styled.p`
  display: none;
  @media (min-width: 768px) {
    display: block;
    color: "rgba(0, 0, 0, 0.3)";
    line-height: 3.2rem;
    margin: 0 1rem 0 auto;
    text-transform: uppercase;
  }
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
        <Sidebar sidebarContent={content.sidebarContent} />
        {/* the Article component will change, we want to be able to reuse the article, so from here we want to pass in the content that specific article needs */}
        <Article articleContent={content.articleContent} />
      </Container>
    );
  }
}

export default Docs;
