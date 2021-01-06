import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const StyledInput = styled.input`
  width: 100%;
  border-radius: 0.5rem;
  font-size: 1.6rem;
  line-height: 2.3rem;
  letter-spacing: -0.6px;
  padding: 0.4rem 0.9rem 0.6rem;
  color: ${({ theme }) => theme.colors.text};
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  font-family: ${({ theme }) => theme.fonts.body};
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
