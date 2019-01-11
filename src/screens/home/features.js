import React from "react";
import styled from "styled-components";
import PropTypes from "prop-types";

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

class Features extends React.Component {
  render() {
    return (
      <Wrapper>
        {this.props.featureArray.map(feature => {
          return (
            <div key={feature.title}>
              <img src={feature.icon} />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          );
        })}
      </Wrapper>
    );
  }
}

Features.propTypes = {
  featureArray: PropTypes.array
};

export default Features;
