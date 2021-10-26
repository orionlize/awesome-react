import React from 'react';
import {dispatchRoot} from '@/node';
import * as AwesomeTypes from '@/types';
import Awesome from '@/awesome';
import {Map as createMap, is as equal} from 'immutable';

class AwesomeComponent<P = {}, S = {}, SS = {}> implements React.Component<P, S, SS> {
  context: undefined
  props: P & {children?: AwesomeTypes.ChildrenNode}
  state: S = {} as S

  _node?: AwesomeTypes.VDom
  _updated: boolean = false

  setState(_state: any) {
    this._node?.patches!.push({
      state: _state,
    });

    dispatchRoot().dispatchUpdate!();
  }
  forceUpdate() {
    this._node!.patches!.push({
      state: {...this.state},
    });
    dispatchRoot().dispatchUpdate!();
  }
  refs: {[key: string]: any} = {}

  constructor(props: P) {
    this.props = props;
  }

  componentDidCatch?(error: any): void
  getDerivedStateFromError?(): void
  shouldComponentUpdate(nextProps: P, nextState: S) {
    return !equal(createMap(this.props), createMap(nextProps)) || !equal(createMap(this.state), createMap(nextState));
    // return true;
  }
  componentDidMount?(): void
  componentDidUpdate?(): void
  componentWillUnmount?(): void

  render(): AwesomeTypes.Node {
    return null;
  }
}

function lazy(func: () => Promise<any>) {
  return class LazyComponent extends AwesomeComponent {
    componentDidMount() {
      throw func;
    }

    render() {
      return null;
    }
  };
}

class Suspense extends AwesomeComponent<{
  fallback: AwesomeTypes.Node
}, {
  element: AwesomeTypes.Node
}> {
  state = {
    element: null,
  }

  componentDidCatch(e: any) {
    e().then((res) => {
      this.setState({
        element: <res.default />,
      });
    });
  }

  getDerivedStateFromError() {
    this.setState({
      element: this.props.fallback,
    });
  }

  render() {
    const {children} = this.props;
    const {element} = this.state;

    return <>
      {
        element
      }
      {
        !element && children
      }
    </>;
  }
}

export {
  AwesomeComponent,
  lazy,
  Suspense,
};
