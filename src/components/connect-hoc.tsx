import React, { Component } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import { Connect } from '../components/connect';
import { Query } from '../types';

export interface ConnectHOCProps {
  children: (props: any) => any;
  query?: Query;
  mutation?: {};
}

export const ConnectHOCWrapper = function(
  opts?: ConnectHOCProps | ((_) => ConnectHOCProps)
) {
  return (Comp: any) => {
    const componentName = Comp.displayName || Comp.name || 'Component';

    class ConnectHOC extends Component {
      static displayName = `Connect(${componentName})`;
      props: any;

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

        return <Connect {...connectProps} children={this.renderComponent} />;
      }
    }

    return hoistStatics(ConnectHOC, Comp);
  };
};
