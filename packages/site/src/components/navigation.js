import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const SidebarContainer = styled.div`
  display: ${p => (p.hidden ? 'none' : 'block')};
  position: absolute;

  @media ${({ theme }) => theme.media.sm} {
    display: block;
    position: relative;
    width: ${p => p.theme.layout.sidebar};
  }
`;

export const SideBarStripes = styled.div`
  border-left: ${p => p.theme.layout.stripes} solid #8196ff;
  border-right: ${p => p.theme.layout.stripes} solid #bcc6fa;
  position: absolute;
  height: 100%;
  width: 0;
  left: 0;
  top: 0;
  bottom: 0;
`;

export const SidebarWrapper = styled.aside`
  position: fixed;
  bottom: 0;
  top: ${p => p.theme.layout.header};
  -webkit-overflow-scrolling: touch;
  overflow-y: scroll;

  display: flex;
  flex-direction: column;
  z-index: 1;
  overflow-y: scroll;
  min-height: 100%;
  width: 100%;
  padding: ${p => p.theme.spacing.md};
  padding-right: ${p => p.theme.spacing.sm};
  padding-top: ${p => p.theme.spacing.lg};
  line-height: ${p => p.theme.lineHeights.body};
  font-size: ${p => p.theme.fontSizes.small};

  @media ${({ theme }) => theme.media.sm} {
    width: ${p => p.theme.layout.sidebar};
  }
`;

export const SidebarNavItem = styled(Link)`
  display: block;
  margin: ${p => p.theme.spacing.xs} 0;
  color: ${p => p.theme.colors.accent};
  font-weight: ${p => p.theme.fontWeights.heading};
  text-decoration: none;
  width: 100%;
`;

export const SidebarNavSubItemWrapper = styled.div`
  padding-left: ${p => p.theme.spacing.sm};
  margin-bottom: ${p => p.theme.spacing.xs};
`;

export const SidebarNavSubItem = styled(Link)`
  display: block;
  color: ${p => p.theme.colors.heading};
  font-weight: ${p => p.theme.fontWeights.body};
  text-decoration: none;
  margin-top: ${p => p.theme.spacing.xs};
  opacity: 0.7;

  &:first-child {
    margin-top: 0;
  }
`;
