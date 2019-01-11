import React from "react";
import Features from "./features";
import styled from "styled-components";

const Container = styled.div`
  max-width: 36em;
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

    return (
      <Container>
        <div>
          <Features featureArray={featureArray} />
          {/* <Section />
          <GetStarted />
        <MoreOSS /> */}
        </div>
      </Container>
    );
  }
}

export default Home;
