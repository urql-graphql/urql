import React from "react";
import PropTypes from "prop-types";
import { Link, withRouter, Router, Route } from "react-static";
import { hot } from "react-hot-loader";
import { Header, Footer } from "formidable-landers";

// import "./app.css";
import "./styles/styles.css";
import Template from "./template";
import Analytics from "./google-analytics";

// Routes generated at build-time
import Routes from "react-static-routes";

const App = () => (
  <Router>
    <Analytics id="UA-43290258-1">
      <Template>
        <Routes />
      </Template>
    </Analytics>
  </Router>
);

export default hot(module)(App);

// export default App;

// const App = () => (
//   <Router>
//     <div>
//       <nav>
//         <Link exact to="/">
//           Home
//         </Link>
//         <Link to="/about">About</Link>
//         <Link to="/blog">Blog</Link>
//       </nav>
//       <div className="content">
//         <Routes />
//       </div>
//     </div>
//   </Router>
// );
