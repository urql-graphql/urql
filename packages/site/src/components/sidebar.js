import React, { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';
import * as path from 'path';

import { useMarkdownTree, useMarkdownPage } from 'react-static-plugin-md-pages';

import {
  SidebarNavItem,
  SidebarNavSubItem,
  SidebarNavSubItemWrapper,
  SidebarContainer,
  SidebarWrapper,
  SideBarStripes,
} from './navigation';

import { mediaSizes } from '../styles/theme';

import logoSidebar from '../assets/sidebar-badge.svg';

const HeroLogo = styled.img.attrs(() => ({
  src: logoSidebar,
  alt: 'urql',
}))`
  display: none;
  width: ${p => p.theme.layout.logo};
  margin-bottom: ${p => p.theme.spacing.sm};
  align-self: center;
  @media ${p => p.theme.media.sm} {
    display: block;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: ${p => p.theme.spacing.xs};
  padding-bottom: ${p => p.theme.spacing.lg};
`;

const relative = (from, to) => {
  if (!from || !to) return null;
  const pathname = path.relative(path.dirname(from), to);
  return { pathname };
};

const Sidebar = ({ sidebarOpen }) => {
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

          {page.children && page.children.length ? (
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
          ) : null}
        </Fragment>
      );
    });
  }, [tree, currentPage]);

  return (
    <SidebarContainer hidden={!sidebarOpen}>
      <SideBarStripes />
      <SidebarWrapper>
        <HeroLogo />
        <ContentWrapper>{sidebarItems}</ContentWrapper>
      </SidebarWrapper>
    </SidebarContainer>
  );
};

export default Sidebar;
