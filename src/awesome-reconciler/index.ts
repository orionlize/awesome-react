import * as Awesome from '@/types';
import {AwesomeComponent} from '@/component';

let _root: Awesome.VDom;
let _jsx: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node;

function createRoot(jsx: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node, container: Awesome.Container | null): Awesome.VDom {
  _root = {
    parent: null,
    children: [],
    brother: null,
    patches: [],
    props: {},
    dom: container as HTMLElement,
  };
  _jsx = jsx;
  return _root;
}

function dispatchRoot() {
  return _root;
}
function dispatchJSX() {
  return _jsx;
}

let _state: Awesome.ListNode<any> = {
  value: null,
};

let _effect: Awesome.ListNode<any[] | null> = {
  value: null,
};

let _stateTail = _state;
let _effectTail = _effect;

function _appendState(node: Awesome.ListNode<any>) {
  if (node.next == null) {
    node.next = {
      value: null,
      perv: node,
    };
    _stateTail = node.next;
  }
  _state = node.next;
}

function _appendEffect(node: Awesome.ListNode<any | null>) {
  if (node.next == null) {
    node.next = {
      value: null,
      perv: node,
    };
    _effectTail = node.next;
  }
  _effect = node.next;
}

function dispatchState() {
  return {
    state: _state,
    appendState: _appendState,
  };
}

function dispatchEffect() {
  return {
    effectHooks: _effect,
    appendEffect: _appendEffect,
  };
}

function build(
    element: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node,
    parent: Awesome.VDom | null = null,
    i: number = 0,
    old?: Awesome.VDom,
) {
  if (!element || typeof element !== 'object') {
    if (element && parent) {
      const el: Awesome.VDom = {
        parent,
        children: String(element),
        brother: parent && Array.isArray(parent.children) && i > 0 ? parent.children[i - 1] : null,
        props: null,
        patches: [],
      };
      (parent.children as Awesome.VDom[]).push(el);
      return el;
    }
  } else if ('type' in element) {
    const type = element.type as any;
    const el: Awesome.VDom = {
      type,
      parent,
      children: [],
      brother: parent && Array.isArray(parent.children) && i > 0 ? parent.children[i - 1] : null,
      props: element.props,
      patches: [],
    };
    if (typeof type === 'function') {
      if (type.prototype instanceof AwesomeComponent) {
        if (old && old.type === element.type) {
          el.instance = old.instance!;
          if (!old.instance!._isDispatching && !(old.instance!.shouldComponentUpdate(element.props, old.instance!.state))) {
            build(el.instance.render(), el, 0, old && Array.isArray(old.children) ? old.children[0] : undefined);
            el.instance.props = element.props;
          } else {
            el.instance.props = element.props;
            el.instance._updated = true;
            build(el.instance.render(), el, 0, old && Array.isArray(old.children) ? old.children[0] : undefined);
          }
          old.instance!._isDispatching = false;
        } else {
          const Type = type as new(props: any) => AwesomeComponent;
          el.instance = new Type(element.props);
          el.instance._node = el;
          build(el.instance.render(), el, 0, old && Array.isArray(old.children) ? old.children[0] : undefined);
        }
      } else {
        if (old) {
          el.stateStart = old.stateStart;
          el.stateEnd = old.stateEnd;
          el.effectStart = old.effectStart;
          el.effectEnd = old.effectEnd;
        }
        if (el.stateStart == null) {
          el.stateStart = _stateTail;
        }
        if (el.effectStart == null) {
          el.effectStart = _effectTail;
        }
        _state = el.stateStart;
        _effect = el.effectStart;
        const functionComponent = (type as ((props: any) => Awesome.AwesomeElement<any, any> | null))(element.props);
        if (el.stateEnd == null) {
          el.stateEnd = _stateTail;
        }
        if (el.effectEnd == null) {
          el.effectEnd = _effectTail;
        }

        build(functionComponent, el, 0, old && Array.isArray(old.children) ? old.children[0] : undefined);
      }
    } else if (element.props && element.props.children) {
      console.log(old?.type, element.type);
      if (Array.isArray(element.props.children) && el) {
        let _i = 0;
        for (const child of element.props.children) {
          build(child as Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element>, el, _i, old && Array.isArray(old.children) ? old.children[_i]: undefined);
          if (Array.isArray(child)) {
            _i += child.length;
          } else {
            ++ _i;
          }
        }
      }
    }

    if (el && parent) {
      (parent.children as Awesome.VDom[]).push(el);
    }
  } else if (Array.isArray(element)) {
    let _i = 0;
    // if (old && Array.isArray(old.children)) {
    //   for (let i = 0; i < old.children.length; ++ i) {
    //     if (_i < element.length) {
    //       if ((element[_i] as any).type === old.children[i].type) {
    //         build(element[_i], parent, _i, old.children[i]);
    //         ++ _i;
    //       }
    //     }
    //   }
    // }

    // for (let i = _i; i < element.length; ++ i) {
    //   build(element[i], parent, i, undefined);
    //   ++ i;
    // }
    for (const child of element) {
      build(child as Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element>, parent, _i, old && Array.isArray(old.parent?.children) ? old.parent?.children[_i + i] : undefined);
      if (Array.isArray(child)) {
        _i += child.length;
      } else {
        ++ _i;
      }
    }
  }
}

export default {
  build,
  dispatchState,
  createRoot,
  dispatchRoot,
  dispatchJSX,
  dispatchEffect,
};
