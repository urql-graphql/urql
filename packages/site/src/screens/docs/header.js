import React from 'react';
import styled from 'styled-components';
import SVG from 'react-inlinesvg';

import formidableLogo from '../../assets/logos/logo-formidable.svg';

const Fixed = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1;
`;

const Wrapper = styled.header`
  width: 100%;
  max-width: ${p => p.theme.layout.page};
  margin: 0 auto;
  background: ${p => p.theme.colors.bg};

  height: ${p => p.theme.layout.header};
  padding: 0 ${p => p.theme.spacing.md};

  border-bottom: 1px solid ${p => p.theme.colors.border};
  border-left: 1px solid ${p => p.theme.colors.border};
  border-right: 1px solid ${p => p.theme.colors.border};

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const FormidableLogo = styled.img.attrs(() => ({
  src: formidableLogo
}))`
  height: 2.8rem;
  position: relative;
  top: -0.1rem;
`;

const Header = () => {
  return (
    <Fixed>
      <Wrapper>
        <FormidableLogo />
      </Wrapper>
    </Fixed>
  );
};

export default Header;
