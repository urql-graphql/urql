import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { withRouteData } from "react-static";
// import Prism from "prismjs";
import { Markdown } from "../../components/markdown";
import Highlight, { defaultProps } from "prism-react-renderer";

/* eslint-disable no-unused-vars */
// add more language support
// import jsx from "prismjs/components/prism-jsx";
// import sh from "prismjs/components/prism-bash";
// import yaml from "prismjs/components/prism-yaml";
/* eslint-enable no-unused-vars */

const Container = styled.div`
  max-width: 80rem;
  min-height: 100vh;
  width: 100%;
  padding: 10rem 4rem 8rem;
}
@media (max-width: 768px) {
  padding: 6rem 4rem 8rem 3.5rem;
}
@media (max-width: 600px) {
  padding: 4rem 4rem 8rem 0.3rem;
}
`;

class Article extends React.Component {
  // componentDidMount() {
  //   Prism.highlightAll();
  // }

  // componentDidUpdate() {
  //   Prism.highlightAll();
  // }

  render() {
    console.log(this.props);
    return (
      <Container>
        <Markdown dangerouslySetInnerHTML={{ __html: this.props.renderedMd }} />
      </Container>
    );

    // return (
    //   <Container>
    //     <Markdown>
    //       <Highlight {...defaultProps} code={ this.props.renderedMd} language="jsx">
    //         {({ className, style, tokens, getLineProps, getTokenProps }) => (
    //           <pre className={className} style={style}>
    //             {tokens.map((line, i) => (
    //               <div {...getLineProps({ line, key: i })}>
    //                 {line.map((token, key) => (
    //                   <span {...getTokenProps({ token, key })} />
    //                 ))}
    //               </div>
    //             ))}
    //           </pre>
    //         )}
    //       </Highlight>
    //     </Markdown>
    //   </Container>
    // );
  }
}

Article.propTypes = {
  renderedMd: PropTypes.string
};

Article.defaultProps = {
  params: null
};

export default withRouteData(Article);
