import React, { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import * as path from 'path';

import { useMarkdownTree, useMarkdownPage } from 'react-static-plugin-md-pages';

import {
  SidebarNavItem,
  SidebarNavSubItem,
  SidebarNavSubItemWrapper,
  SidebarContainer,
  SidebarWrapper,
  SideBarSvg,
} from './navigation';

import closeButton from '../assets/close.svg';
import logoSidebar from '../assets/sidebar-badge.svg';

const HeroLogo = styled.img.attrs(() => ({
  alt: 'urql'
}))`
  width: 14rem;
  align-self: center;
  margin-bottom: ${p => p.theme.spacing.md};

  @media (max-width: 768px) {
    display: ${props => (props.overlay ? '' : 'none')};
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: auto;
  @media (max-width: 768px) {
    display: ${props => (props.overlay ? '' : 'none')};
  }
`;

const CloseButton = styled.img`
  cursor: pointer;
  top: 1rem;
  right: 7rem;
  position: absolute;
  display: none;

  @media (max-width: 768px) {
    display: ${props => (props.overlay ? 'block' : 'none')};
    right: 1rem;
  }
`;

const relative = (from, to) => {
  if (!from || !to) return null;
  const pathname = path.relative(path.dirname(from), to);
  return { pathname };
};

const Sidebar = ({ overlay, closeSidebar }) => {
  const currentPage = useMarkdownPage();
  const tree = useMarkdownTree();

  const sidebarItems = useMemo(() => {
    if (!currentPage || !tree || !tree.children) {
      return null;
    }

    return tree.children.map(page => {
      return (
        <Fragment key={page.key}>
          <SidebarNavItem to={relative(currentPage.path, page.path)}>
            {page.frontmatter.title}
          </SidebarNavItem>

          {page.children && (
            <SidebarNavSubItemWrapper>
              {page.children.map(childPage => (
                <SidebarNavSubItem
                  to={relative(currentPage.path, childPage.path)}
                  key={childPage.key}
                >
                  {childPage.frontmatter.title}
                </SidebarNavSubItem>
              ))}
            </SidebarNavSubItemWrapper>
          )}
        </Fragment>
      );
    });
  }, [tree, currentPage]);

  return (
    <SidebarContainer>
      <SideBarSvg />
      <SidebarWrapper overlay={overlay}>
        <CloseButton
          src={closeButton}
          alt="X"
          overlay={overlay}
          onClick={() => closeSidebar()}
        />
        <HeroLogo src={logoSidebar} alt="Formidable Logo" overlay={overlay} />
        <ContentWrapper overlay={overlay}>
          {sidebarItems}
        </ContentWrapper>
      </SidebarWrapper>
    </SidebarContainer>
  );
};

Sidebar.propTypes = {
  closeSidebar: PropTypes.func,
  overlay: PropTypes.bool,
};

export default Sidebar;
