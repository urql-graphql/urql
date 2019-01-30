import styled from "styled-components";
import { Link } from "react-static";

export const Navigation = styled.div`
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
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

export const NavigationTagline = styled.p`
  display: none;
  @media (min-width: 768px) {
    display: block;
    color: "white"
    line-height: 3.2rem;
    margin: 0 1rem 0 auto;
    text-transform: uppercase;
  }
`;

export const SidebarContainer = styled.aside`
  font-family: "akkurat";
  background-color: #3d4247;
  min-height: 100vh;
  padding-top: 23rem;
  width: ${props => (props.small ? "7rem" : "26rem")};
  min-width: ${props => (props.small ? "7rem" : "26rem")};
`;

export const SidebarNavItem = styled(Link)`
  color: white;
  margin-left: 4rem;
  margin-bottom: 1rem;
  font-size: 1.6rem;
  display: inline-block;
`;

export const SidebarNavSubItem = styled(Link)`
  color: white;
  margin-left: 6rem;
  margin-top: 1rem;
  font-size: 1.4rem;
`;
