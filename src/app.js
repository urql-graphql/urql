import React from "react";
import PropTypes from "prop-types";
import { Link, withRouter, Router, Route } from "react-static";
import { hot } from "react-hot-loader";
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
