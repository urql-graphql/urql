import React from "react";
import { Link } from "react-router";

// Child components
import TitleMeta from "../../components/title-meta";

class Home extends React.Component {
  render() {
    return (
      <TitleMeta title="Spectacle">

        <div className="Hero">
          <h2 className="Hero-Heading u-noMargin">
            A <strong>React.js based</strong> library for creating <strong>
              sleek presentations
            </strong> using <span>JSX</span> syntax <span className="Hero-Subheading">
              with the ability to <strong>live demo your&nbsp;code!</strong>
            </span>
          </h2>
        </div>

        <p>
          <Link className="btn btn--dark" to="/docs">
            Get Started with Spectacle
          </Link>
        </p>

        <div className="Docs">
          <h2>Take a tour</h2>
        </div>

        <div className="VideoWrapper">
          <div className="Video">
            <iframe
              className="Video-iframe"
              width="640"
              height="360"
              src="https://www.youtube-nocookie.com/embed/vvgtgnIhJ1g?rel=0&amp;showinfo=0"
              frameBorder="0"
            >
            </iframe>
          </div>
        </div>

        <div className="Docs">
          <h2>Features</h2>
          <h3>Interactive Presentations</h3>
            <p>Add clickable elements and other interactivity to make your presentations pop.</p>
          <h3>Live-Preview Your Code</h3>
            <p>Show people more than just a code block - demo the final project in real-time without leaving your presentation deck.</p>
          <h3>Auto-Size Text, Image Dimming, and More</h3>
            <p>On top of all of Spectacle's helpful features, you can also make your presentation look amazing with
             auto-formatting, easy theming abilities, image dimming, and lots of other fun touches.</p>
        </div>

        <p>
          <Link className="btn btn--dark" to="/docs">
            Get Started with Spectacle
          </Link>
        </p>
        <p>
          <a href="https://www.github.com/FormidableLabs/spectacle">
            View the Spectacle Source Code
          </a>
        </p>
        <p>
          <a href="https://www.github.com/FormidableLabs/spectacle/issues">
            Having an Issue?
          </a>
        </p>

      </TitleMeta>
    );
  }
}

export default Home;
