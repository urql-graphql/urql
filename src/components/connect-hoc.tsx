import React, { Component } from 'react';
import Connect from '../components/connect';
import { IMutation, IQuery } from '../interfaces/index';

export interface IHOCProps {
  query?: IQuery | IQuery[]; // Query or queries
  mutation?: IMutation; // Mutation map
  cache?: boolean;
  typeInvalidation?: boolean;
  shouldInvalidate?: (
    changedTypes: string[],
    typeNames: string[],
    response: object,
    data: object
  ) => boolean;
}

function ConnectHOC(opts?: IHOCProps | ((_) => IHOCProps)) {
  return (Comp: any) =>
    class extends Component {
      constructor(props) {
        super(props);

        this.renderComponent = this.renderComponent.bind(this);
      }
      renderComponent(data) {
        return <Comp {...data} {...this.props} />;
      }
      render() {
        const connectProps =
          typeof opts === 'function' ? opts(this.props) : opts;

        return <Connect {...connectProps} render={this.renderComponent} />;
      }
    };
}

export default ConnectHOC;
