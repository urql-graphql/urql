import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { withRouteData, withRouter } from "react-static";
import Prism from "prismjs";

/* eslint-disable no-unused-vars */
// add more language support
import jsx from "prismjs/components/prism-jsx";
import sh from "prismjs/components/prism-bash";
import yaml from "prismjs/components/prism-yaml";
/* eslint-enable no-unused-vars */

const Container = styled.div`
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

const Markdown = styled.article`
  & h1 {
    font-size: 3.2rem;
    margin: 0 0 2rem;
    @media (min-width: 1024px) {
      font-size: 4.6rem;
    }
  }
`;

class Article extends React.Component {
  componentDidMount() {
    Prism.highlightAll();
  }

  componentDidUpdate() {
    Prism.highlightAll();
  }

  render() {
    return (
      <Container>
        <DocsTitle>SPECTACLE</DocsTitle>
        <Markdown dangerouslySetInnerHTML={{ __html: this.props.renderedMd }} />
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

Article.propTypes = {
  renderedMd: PropTypes.string
};

Article.defaultProps = {
  params: null
};

export default withRouteData(withRouter(Article));
