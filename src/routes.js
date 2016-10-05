import React from "react";
import { Route, IndexRoute } from "react-router";
import Home from "./screens/home/index";

// Components
import App from "./components/app";
// import About from "./screens/about/index";
import { BasicComponent, ApiComponent, GettingStartedComponent,
  PropsComponent, ExtensionsComponent } from "./screens/docs/index";
import Example from "./screens/example/index";

module.exports = (
  <Route path="/" component={App}>
    <IndexRoute component={Home}/>
    <Route path="/docs" component={GettingStartedComponent}/>
    <Route path="/docs/getting-started" component={GettingStartedComponent}/>
    <Route path="/docs/basic-concepts" component={BasicComponent}/>
    <Route path="/docs/tag-api" component={ApiComponent}/>
    <Route path="/docs/props" component={PropsComponent}/>
    <Route path="/docs/extensions" component={ExtensionsComponent}/>
    <Route path="/docs/example" component={Example}/>
  </Route>
);
