import AwesomeReconciler from '@/awesome-reconciler';
import * as Awesome from '@/types';
// import {Map as createMap, is as equal} from 'immutable';
import React from 'react';

export class AwesomeComponent<P = {}, S = {}, SS = {}> implements React.Component<P, S, SS> {
  context: undefined
  props: P & {children?: Awesome.ChildrenNode}
  state: S = {} as S

  _node?: Awesome.VDom
  _updated: boolean = false

  setState(_state: any) {
    this._node?.patches.push({
      instance: this,
      state: _state,
    });

    AwesomeReconciler.dispatchRoot().dispatchUpdate!();
  }
  forceUpdate() {
    this._node?.patches.push({
      instance: this,
      isForce: true,
    });
    AwesomeReconciler.dispatchRoot().dispatchUpdate!();
  }
  refs: {[key: string]: any} = {}

  constructor(props: P) {
    this.props = props;
  }

  // componentDidCatch?: () => void
  shouldComponentUpdate(nextProps: P, nextState: S) {
    // return !equal(createMap(this.props), createMap(nextProps)) || !equal(createMap(this.state), createMap(nextState));
    return true;
  }
  componentDidMount?(): void
  componentDidUpdate?(): void
  componentWillUnmount?(): void

  render(): Awesome.Node {
    return null;
  }
}
