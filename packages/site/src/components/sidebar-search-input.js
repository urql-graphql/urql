import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const StyledInput = styled.input`
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 0.5rem;
  color: ${p => p.theme.colors.text};
  font-family: ${p => p.theme.fonts.body};
  font-size: 1.6rem;
  line-height: 2.3rem;
  letter-spacing: -0.6px;
  margin: ${p =>
    `${p.theme.spacing.sm} 0 ${p.theme.spacing.sm} calc(${p.theme.spacing.xs} * -1.5)`};
  padding: ${p =>
    `${p.theme.spacing.xs} calc(${p.theme.spacing.xs} * 1.5) ${p.theme.spacing.xs}`};
  width: calc(100% + 1.8rem);
  background-color: ${p => p.theme.colors.passiveBg};

  @media ${p => p.theme.media.sm} {
    background-color: ${p => p.theme.colors.bg};
  }
`;

const SidebarSearchInput = ({ value, onHandleInputChange }) => (
  <StyledInput
    onChange={onHandleInputChange}
    placeholder="Filter..."
    type="search"
    value={value}
  />
);

SidebarSearchInput.propTypes = {
  value: PropTypes.string,
  onHandleInputChange: PropTypes.func,
};

export default SidebarSearchInput;
