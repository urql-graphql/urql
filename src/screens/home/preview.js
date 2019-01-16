import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { BodyCopy } from "../../components/body-copy";
import { SectionTitle } from "../../components/section-title";
import { Wrapper } from "../../components/wrapper";

const OutterWrapper = styled.div`
  background: #F3F3F3;
`;

class Preview extends React.Component {
  render() {
    const { previewObj } = this.props;

    return (
      <OutterWrapper>
        <Wrapper>
          <SectionTitle>Code Preview</SectionTitle>
          <BodyCopy>{previewObj.description}</BodyCopy>
        </Wrapper>
      </OutterWrapper>
    );
  }
}

Preview.propTypes = {
  previewObj: PropTypes.object
};

export default Preview;
