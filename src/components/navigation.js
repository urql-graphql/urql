import styled from "styled-components";

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
    color: white;
    line-height: 3.2rem;
    margin: 0 1rem 0 auto;
    text-transform: uppercase;
  }
`;

export const SidebarNavItem = styled.div`
  color: white;
  font-size: 1.6rem;
  margin-left: 5rem;
  @media (min-width: 1024px) {
    font-size: 1.8rem;
  }
`;

export const SidebarNavSubItem = styled.div`
  color: white;
  font-size: 1.6rem;
  margin-left: 7rem;
  margin-top: 1rem;
  @media (min-width: 1024px) {
    font-size: 1.4rem;
  }
`;
