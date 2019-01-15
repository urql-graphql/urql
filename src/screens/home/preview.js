import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { SectionTitle } from "../../components/section-title";
import { Wrapper } from "../../components/wrapper";

const OutterWrapper = styled.div`
  background: #F3F3F3;
`;

const PreviewBody = styled.p`
  font-size: 1.5rem;
  line-height: 2.4rem;
  margin: 0;
  width: 100%;
`;

class Preview extends React.Component {
  render() {
    const { previewObj } = this.props;

    return (
      <OutterWrapper>
        <Wrapper>
          <SectionTitle>Code Preview</SectionTitle>
          <PreviewBody>{previewObj.description}</PreviewBody>
        </Wrapper>
      </OutterWrapper>
    );
  }
}

Preview.propTypes = {
  previewObj: PropTypes.object
};

export default Preview;
