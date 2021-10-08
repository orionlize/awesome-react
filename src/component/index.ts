import * as Awesome from '@/types';
import React from 'react';

export class AwesomeComponent<P extends {children?: Awesome.ChildrenNode | string} = {children: Awesome.ChildrenNode | string}, S = {}, SS = {}> implements React.Component<P, S, SS> {
  context: undefined
  props: P
  state: S = {} as S

  _node?: Awesome.VDom<P>

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

  render(): Awesome.Node {
    return null;
  }
}
