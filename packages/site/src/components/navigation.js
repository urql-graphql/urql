import styled from 'styled-components';
import { Link } from 'react-router-dom';

import collapsedSidebarBackground from '../assets/collapsed-sidebar-background.svg';

export const Navigation = styled.div`
  align-items: center;
  background: #8196ff;
  display: flex;
  flex-direction: row;
  height: 6rem;
  width: 100%;

  & img {
    margin-left: auto;
    @media (min-width: 768px) {
      margin-left: 0;
    }
  }
`;
export const SidebarContainer = styled.div`
  width: 24rem;
  min-width: 24rem;
  min-height: 100vh;

  @media (max-width: 768px) {
    min-width: 2.5rem;
    width: 2.5rem;
  }
`;

export const SideBarSvg = styled.div`
  width: 2.5rem;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 3;
  background-image: url(${collapsedSidebarBackground});
  background-size: cover;
  background-repeat: repeat-y;
`;

export const SidebarWrapper = styled.aside`
  background-size: 100% 100%;
  max-height: 100%;
  z-index: 2;
  position: fixed;
  overflow-y: scroll;
  top: 0;
  bottom: 0;
  width: ${p => p.theme.layout.sidebar};
  padding: 0 ${p => p.theme.spacing.md};
  padding-top: 18rem;

  line-height: ${p => p.theme.lineHeights.body};
  font-size: ${p => p.theme.fontSizes.small};
`;

export const SidebarNavItem = styled(Link)`
  display: block;
  margin-bottom: ${p => p.theme.spacing.xs};
  color: ${p => p.theme.colors.accent};
  text-decoration: none;
  font-weight: bold;
  width: 100%;
`;

export const SidebarNavSubItemWrapper = styled.div`
  padding-left: ${p => p.theme.spacing.sm};
  margin-bottom: ${p => p.theme.spacing.sm};
  border-left: 1px solid ${p => p.theme.colors.border};
`;

export const SidebarNavSubItem = styled(Link)`
  display: block;
  margin-top: ${p => p.theme.spacing.xs};
  color: ${p => p.theme.colors.heading};
  text-decoration: none;
  opacity: 0.7;
`;
