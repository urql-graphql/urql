import React from "react";

class About extends React.Component {
  render() {
    return (
      <div>
        <h1>About Spectacle</h1>
        <iframe src="https://ghbtns.com/github-btn.html?user=formidablelabs&repo=spectacle&type=star&count=true&size=large" frameBorder="0" scrolling="0" width="160px" height="30px"></iframe>
        <iframe src="https://ghbtns.com/github-btn.html?user=formidablelabs&repo=spectacle&type=watch&count=true&size=large&v=2" frameBorder="0" scrolling="0" width="160px" height="30px"></iframe>
        <iframe src="https://ghbtns.com/github-btn.html?user=formidablelabs&repo=spectacle&type=fork&count=true&size=large" frameBorder="0" scrolling="0" width="158px" height="30px"></iframe>

        <p>Spectacle is a React.js based library for creating sleek presentations using JSX syntax that gives you the
         ability to live demo your code.</p>
        <a href="https://github.com/FormidableLabs/spectacle/graphs/contributors">See Contributors to Spectacle.</a>
        {/*add top 5 contributors if we can figure out a good way with the github API*/}
        <p>Formidable is a Seattle-based consultancy and development shop, focused on open-source, full-stack JavaScript
         using React.js and Node.js, and the architecture of large-scale JavaScript applications. We build products for some
          of the world&#8217;s biggest companies, while helping their internal teams develop smart, thoughtful, and scalable systems.</p>
      </div>
    );
  }
}

export default About;
