import React from "react";
// Common
import TitleMeta from "../../components/title-meta";

class About extends React.Component {
  render() {
    return (
      <TitleMeta title="Spectacle | About">
        <div className="Container Site-content">
          <h1>About Spectacle</h1>
          {/*
            * TODO: Customize these buttons
            * https://github.com/FormidableLabs/formidable-landers/issues/175
            */}
          <p>
            <iframe src="https://ghbtns.com/github-btn.html?user=formidablelabs&repo=spectacle&type=star&count=true&size=large" frameBorder="0" scrolling="0" width="160px" height="30px"></iframe>
            <iframe src="https://ghbtns.com/github-btn.html?user=formidablelabs&repo=spectacle&type=watch&count=true&size=large&v=2" frameBorder="0" scrolling="0" width="160px" height="30px"></iframe>
            <iframe src="https://ghbtns.com/github-btn.html?user=formidablelabs&repo=spectacle&type=fork&count=true&size=large" frameBorder="0" scrolling="0" width="158px" height="30px"></iframe>
          </p>
          <p>
            Spectacle is a React.js based library for creating sleek presentations using JSX syntax that gives you the ability to live demo your code.
          </p>
          <p>
            <a href="https://github.com/FormidableLabs/spectacle/graphs/contributors">
              See Contributors to Spectacle.
            </a>
          </p>
          {/* TODO: Add top 5 contributors with the github API
            * https://github.com/FormidableLabs/formidable-landers/issues/176
            */}
          <p>
            Formidable is a Seattle-based consultancy and development shop, focused on open-source, full-stack JavaScript using React.js and Node.js, and the architecture of large-scale JavaScript applications. We build products for some of the world&rsquo;s biggest companies, while helping their internal teams develop smart, thoughtful, and scalable systems.
          </p>
        </div>
      </TitleMeta>
    );
  }
}

export default About;
