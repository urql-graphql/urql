import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { BodyCopy } from "../../components/body-copy";
import { SectionTitle } from "../../components/section-title";
import { Wrapper } from "../../components/wrapper";

const OuterWrapper = styled.div`
  background: #f3f3f3;
`;

class Preview extends React.Component {
  render() {
    const { previewObj } = this.props;

    return (
      <OuterWrapper>
        <Wrapper>
          <SectionTitle>Code Preview</SectionTitle>
          <BodyCopy>{previewObj.description}</BodyCopy>
        </Wrapper>
      </OuterWrapper>
    );
  }
}

Preview.propTypes = {
  previewObj: PropTypes.object
};

export default Preview;
