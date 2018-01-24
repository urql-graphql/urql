import React, { Component } from 'react';
import { Consumer } from "./context";
import ClientWrapper from "./client";
export default class Connect extends Component {
  render() {
    // Use react-create-context to provide context to ClientWrapper
    return React.createElement(Consumer, null, client => React.createElement(ClientWrapper, {
      client: client,
      render: this.props.render,
      query: this.props.query,
      mutation: this.props.mutation,
      fetchingDelay: this.props.fetchingDelay,
      cache: this.props.cache,
      typeInvalidation: this.props.typeInvalidation,
      shouldInvalidate: this.props.shouldInvalidate
    }));
  }

}