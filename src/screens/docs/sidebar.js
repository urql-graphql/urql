import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { withRouteData, withRouter } from "react-static";

import { SidebarNavItem, SidebarNavSubItem } from "../../components/navigation";

const Container = styled.aside`
  background-color: #3d4247;
  min-height: 100vh;
  padding-top: 23rem;
  min-width: 6rem;
  font-family: "sharp";
  width: 6rem;
  @media (min-width: 768px) {
    min-width: 26rem;
    width: 26rem;
  }
`;

const HeroLogo = styled.img`
  max-width: 14.5rem;
  position: relative;
  @media (min-width: 768px) {
    left: -3rem;
    max-width: auto;
    min-width: 29rem;
    position: absolute;
    top: -4rem;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding-right: 6rem;
  margin-bottom: 1rem;
`;

class Sidebar extends React.Component {
  renderSidebarItem(item) {
    const { tocArray } = this.props;
    const currentPath = `/docs${item.path}` === window.location.pathname;
    const subContent = tocArray.filter(toc => toc.level === 2);

    return (
      <div>
        <SidebarNavItem
          to={`/docs${item.path}`}
          replace
          key={item.title.split(" ").join("_")}
        >
          {item.title}
        </SidebarNavItem>
        <Wrapper>
          {currentPath &&
            subContent &&
            subContent.map(sh => (
              <SidebarNavSubItem
                to={`#${sh.content
                  .split(" ")
                  .join("-")
                  .toLowerCase()}`}
                key={sh.content.split(" ").join("_")}
              >
                {sh.content}
              </SidebarNavSubItem>
            ))}
        </Wrapper>
      </div>
    );
  }

  render() {
    const { sidebarHeaders } = this.props;

    return (
      <Container>
        <HeroLogo
          src="../../static/svgs/docs_image.svg"
          alt="Formidable Logo"
        />
        <Wrapper>
          {sidebarHeaders &&
            sidebarHeaders.map(sh => this.renderSidebarItem(sh))}
        </Wrapper>
      </Container>
    );
  }
}

Sidebar.propTypes = {
  location: PropTypes.object,
  sidebarHeaders: PropTypes.array,
  tocArray: PropTypes.array
};

export default withRouter(withRouteData(Sidebar));
