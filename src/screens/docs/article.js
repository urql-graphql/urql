import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import Markdown from "react-markdown/with-html";
import GetStartedMD from "../../../content/docs/getting-started.md";

const Container = styled.article`
  max-width: 80rem;
  min-height: 100vh;
  padding: 2rem 4rem;
  width: 100%;
  @media (min-width: 768px) {
    padding: 3rem 10rem;
  }
`;

const DocsTitle = styled.h2`
  font-size: 3.5rem;
  flex: auto;
  line-height: 1.3;
  width: 100%;
  letter-spacing: 0.5rem;
`;

class Article extends React.Component {
  render() {
    return (
      <Container>
        <DocsTitle>SPECTACLE</DocsTitle>
        <Markdown source={GetStartedMD} escapeHtml={false} />
        {/* <H1 key={articleContent[0].title}>{articleContent[0].title}</H1>
        <div>
          {articleContent[0].subCategories.map(subCategory => (
            <div key={subCategory.title}>{subCategory.title}</div>
          ))}
        </div> */}
      </Container>
    );
  }
}

Article.propTypes = { articleContent: PropTypes.array.isRequired };

export default Article;
