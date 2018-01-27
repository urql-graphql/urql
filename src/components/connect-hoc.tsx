import React, { Component } from 'react';
import Connect from '../components/connect';
import { Query, Mutation } from '../interfaces/index';

export type HOCProps = {
  query?: Query | Array<Query>; // Query or queries
  mutation?: Mutation; // Mutation map
  cache?: boolean;
  typeInvalidation?: boolean;
  shouldInvalidate?: (
    changedTypes: Array<string>,
    typeNames: Array<string>,
    response: object,
    data: object
  ) => boolean;
};

function ConnectHOC(opts?: HOCProps | ((any) => HOCProps)) {
  return function(Comp: any) {
    return class extends Component {
      render() {
        let connectProps;
        if (typeof opts === 'function') {
          connectProps = opts(this.props);
        } else {
          connectProps = opts;
        }
        return (
          <Connect
            {...connectProps}
            render={data => <Comp {...data} {...this.props} />}
          />
        );
      }
    };
  };
}

export default ConnectHOC;
