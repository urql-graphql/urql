import React, { Component } from 'react';
import { Provider as ContextProvider } from "./context";
export default class Provider extends Component {
  render() {
    // Use react-create-context to provide client over context
    return React.createElement(ContextProvider, {
      value: this.props.client
    }, this.props.children);
  }

}