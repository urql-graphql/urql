import React from "react";
import { Routes, Root } from "react-static";
import { Router } from "react-router";

import Template from "./template";
import Analytics from "./google-analytics";

// import default prism theme styles
import "prismjs/themes/prism.css";

let history;
let basename;
if (typeof window !== "undefined") {
  const createBrowserHistory = require("history").createBrowserHistory;
  const { stage, landerBasePath } = require("../static-config-parts/constants");
  basename = `/${landerBasePath}`;
  history =
    stage === "development"
      ? createBrowserHistory()
      : createBrowserHistory({ basename });
}

const App = () => (
  <Root>
    <Router history={history}>
      <Analytics>
        <Template>
          <Routes />
        </Template>
      </Analytics>
    </Router>
  </Root>
);

export default App;
