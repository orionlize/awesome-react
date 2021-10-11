import * as Awesome from '@/types';
import React from 'react';

export class AwesomeComponent<P = {}, S = {}, SS = {}> implements React.Component<P, S, SS> {
  context: undefined
  props: P & {children?: Awesome.ChildrenNode}
  state: S = {} as S

  _node?: Awesome.VDom
  _isDispatching: boolean = false
  _updated: boolean = false

  setState(_state: any) {
    let _parent = this._node?.parent || this._node;
    while (_parent?.parent) {
      _parent = _parent.parent;
    }
    _parent?.patches.push({
      instance: this,
      state: _state,
    });

    _parent?.dispatchUpdate && _parent.dispatchUpdate();
  }
  forceUpdate() {
    let _parent = this._node?.parent;
    while (_parent?.parent) {
      _parent = _parent?.parent;
    }
    _parent?.patches.push({
      instance: this,
      isForce: true,
    });
    _parent?.dispatchUpdate && _parent.dispatchUpdate();
  }
  refs: {[key: string]: any} = {}

  constructor(props: P) {
    this.props = props;
  }

  // componentDidCatch?: () => void
  shouldComponentUpdate(nextProps: P, nextState: S) {
    return this.props !== nextProps || this.state !== nextState;
  }
  componentDidMount?(): void
  componentDidUpdate?(): void
  componentWillUnmount?(): void

  render(): Awesome.Node {
    return null;
  }
}
