import React from "react";
import Features from "./features";
import GetStarted from "./get-started";
import Preview from "./preview";
import MoreOSS from "./more-oss";
import styled from "styled-components";

const Container = styled.div`
  width: 100%;
`;

class Home extends React.Component {
  render() {
    const featureArray = [
      {
        title: "Interactive Presentations",
        description:
          "Add clickable elements and other interactivity to make your presentations pop.",
        icon: "../../static/svgs/bucket_click.svg"
      },
      {
        title: "Live-Preview Your Code",
        description:
          "Show people more than just a code block - demo the final project in real-time without leaving your presentation deck.",
        icon: "../../static/svgs/bucket_code.svg"
      },
      {
        title: "Auto-Size Text, Image Dimming, and More",
        description:
          "On top of all of Spectacle's helpful features, you can also make your presentation look amazing with auto-formatting, easy themeing abilities, image dimming, and lots of other fun touches",
        icon: "../../static/svgs/bucket_amazing.svg"
      }
    ];

    const getStartedObj = {
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      link: "#",
    };

    const previewObj = {
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      media: "",
    };

    const ossArray = [
      {
        title: "Victory",
        description: "An ecosystem of modular data visualization components for React. Friendly and flexible.",
        logo: "../../static/svgs/logo_victory.svg"
      },
      {
        title: "Development Dashboards",
        description: "Dashboards to organize and intuitively display your dev server and tooling output.",
        logo: "../../static/svgs/logo_development-dashboards.svg"
      },
      {
        title: "React Animations",
        description: "A collection of animations that can be used with many inline style libraries, such as Radium or Aphrodite.",
        logo: "../../static/svgs/logo_react-animation.svg"
      },
      {
        title: "Enzyme Matchers",
        description: "Run common assertions on your React components using Enzyme in a Jest or Jasmine environment.",
        logo: "../../static/svgs/logo_enzyme-matchers.svg"
      }
    ];

    return (
      <Container>
        <Features featureArray={featureArray} />
        <Preview previewObj={previewObj} />
        <GetStarted getStartedObj={getStartedObj} />
        <MoreOSS ossArray={ossArray} />
      </Container>
    );
  }
}

export default Home;
