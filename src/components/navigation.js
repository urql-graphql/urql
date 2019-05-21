import styled from "styled-components";
import { Link } from "react-static";
import sidebarBackground from "../static/svgs/sidebar-background.svg";
import collapsedSidebarBackground from "../static/svgs/collapsed-sidebar-background.svg";

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

export const SidebarWrapper = styled.aside`
  font-family: "akkurat";
  background-image: url(${sidebarBackground});
  background-repeat: repeat-y;
  background-size: 100%;
  min-height: 100vh;
  padding-top: 18rem;
  min-width: 24rem;
  width: 24rem;
  z-index: 2;
  position: fixed;
  overflow-y: scroll;
  top: 0;
  bottom: 0;

  @media (max-width: 768px) {
    background-image: ${props =>
      props.overlay
        ? `url(${sidebarBackground})`
        : `url(${collapsedSidebarBackground})`};
    min-width: ${props => (props.overlay ? "24rem" : "2.5rem")};
    width: ${props => (props.overlay ? "24rem" : "2.5rem")};
  }
`;

export const SidebarNavItem = styled(Link)`
  color: white;
  margin-left: 1rem;
  margin-bottom: 1rem;
  font-size: 1.6rem;
  display: inline-block;
`;

export const SidebarNavSubItem = styled(Link)`
  color: white;
  margin-left: 3rem;
  margin-top: 1rem;
  font-size: 1.4rem;
`;
