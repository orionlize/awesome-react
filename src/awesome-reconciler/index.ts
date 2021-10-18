import * as Awesome from '@/types';
import {AwesomeComponent} from '@/component';
import {Fragment} from '@/const';

let _root: Awesome.VDom;

const EmptyElement = Symbol('awesome.empty');

function createRoot(container: Awesome.Container | null): Awesome.VDom {
  _root = {
    parent: null,
    children: [],
    brother: null,
    patches: [],
    props: {},
    dom: container as HTMLElement,
  };
  return _root;
}

function dispatchRoot() {
  return _root;
}

let _state: Awesome.ListNode<any> = {
  value: null,
  future: null,
};

let _effect: Awesome.ListNode<any[] | null> = {
  value: null,
  future: null,
};

let _stateTail = _state;
let _effectTail = _effect;

function _appendState(node: Awesome.ListNode<any>) {
  if (node.next == null) {
    node.next = {
      value: null,
      future: null,
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
      future: null,
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

// function build(
//     element: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node,
//     parent: Awesome.VDom | null = null,
//     i: number = 0,
//     old?: Awesome.VDom,
// ) {
//   if (!element || typeof element !== 'object') {
//     if (element && parent) {
//       const el: Awesome.VDom = {
//         parent,
//         children: String(element),
//         brother: parent && Array.isArray(parent.children) && i > 0 ? parent.children[i - 1] : null,
//         props: null,
//         patches: [],
//       };
//       (parent.children as Awesome.VDom[]).push(el);
//       return el;
//     }
//   } else if ('type' in element) {
//     const type = element.type as any;
//     const el: Awesome.VDom = {
//       type,
//       parent,
//       children: [],
//       brother: parent && Array.isArray(parent.children) && i > 0 ? parent.children[i - 1] : null,
//       props: element.props,
//       patches: [],
//     };
//     if (typeof type === 'function') {
//       if (type.prototype instanceof AwesomeComponent) {
//         if (old && old.type === element.type) {
//           el.instance = old.instance!;
//           if (!old.instance!._isDispatching && !(old.instance!.shouldComponentUpdate(element.props, old.instance!.state))) {
//             build(el.instance.render(), el, 0, old && Array.isArray(old.children) ? old.children[0] : undefined);
//             el.instance.props = element.props;
//           } else {
//             el.instance.props = element.props;
//             el.instance._updated = true;
//             build(el.instance.render(), el, 0, old && Array.isArray(old.children) ? old.children[0] : undefined);
//           }
//           old.instance!._isDispatching = false;
//         } else {
//           const Type = type as new(props: any) => AwesomeComponent;
//           el.instance = new Type(element.props);
//           el.instance._node = el;
//           build(el.instance.render(), el, 0, old && Array.isArray(old.children) ? old.children[0] : undefined);
//         }
//       } else {
//         if (old) {
//           el.stateStart = old.stateStart;
//           el.stateEnd = old.stateEnd;
//           el.effectStart = old.effectStart;
//           el.effectEnd = old.effectEnd;
//         }
//         if (el.stateStart == null) {
//           el.stateStart = _stateTail;
//         }
//         if (el.effectStart == null) {
//           el.effectStart = _effectTail;
//         }
//         _state = el.stateStart;
//         _effect = el.effectStart;
//         const functionComponent = (type as ((props: any) => Awesome.AwesomeElement<any, any> | null))(element.props);
//         if (el.stateEnd == null) {
//           el.stateEnd = _stateTail;
//         }
//         if (el.effectEnd == null) {
//           el.effectEnd = _effectTail;
//         }

//         build(functionComponent, el, 0, old && Array.isArray(old.children) ? old.children[0] : undefined);
//       }
//     } else if (element.props && element.props.children) {
//       if (Array.isArray(element.props.children) && el) {
//         let _i = 0;
//         if (old && Array.isArray(old.children)) {
//           for (let j = 0; j < old.children.length; ++ j) {
//             const child = old.children[j];
//             while (_i < element.props.children.length) {
//               const curChildren = element.props.children[_i];
//               if (!curChildren) {
//                 ++ _i;
//                 continue;
//               }

//               if (Array.isArray(curChildren)) {
//                 build(curChildren, el, j, old);
//                 j += curChildren.length - 1;
//                 ++ _i;
//                 break;
//               } else if ((curChildren as any).type === child.type) {
//                 build(curChildren, el, _i, child);
//                 ++ _i;
//                 break;
//               } else {
//                 break;
//               }
//             }
//             if (_i >= element.props.children.length) {
//               break;
//             }
//           }
//         }

//         for (let j = _i; j < element.props.children.length; ++ j) {
//           build(element.props.children[j], el, j, undefined);
//         }
//       }
//     }

//     if (el && parent) {
//       (parent.children as Awesome.VDom[]).push(el);
//     }
//   } else if (Array.isArray(element)) {
//     let _i = 0;
//     if (old && Array.isArray(old.children)) {
//       for (let j = i; j < old.children.length; ++ j) {
//         const child = old.children[j];
//         while (_i < element.length) {
//           if (!element[_i]) {
//             ++ _i;
//             continue;
//           }
//           if ((element[_i] as any).type === child.type) {
//             build(element[_i], parent, _i, child);
//             ++ _i;
//             break;
//           } else {
//             break;
//           }
//         }
//         if (_i >= element.length) {
//           break;
//         }
//       }
//     }

//     for (let j = _i; j < element.length; ++ j) {
//       build(element[j], parent, j, undefined);
//     }

//     // for (let i = _i; i < element.length; ++ i) {
//     //   build(element[i], parent, i, undefined);
//     //   ++ i;
//     // }
//     // for (const child of element) {
//     //   build(child as Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element>, parent, _i, old && Array.isArray(old.parent?.children) ? old.parent?.children[_i + i] : undefined);
//     //   if (Array.isArray(child)) {
//     //     _i += child.length;
//     //   } else {
//     //     ++ _i;
//     //   }
//     // }
//   }
// }

function build(
    element: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node,
    parent: Awesome.VDom | null = null,
    visitor: number = 0,
) {
  if (!element || typeof element !== 'object') {
    const el: Awesome.VDom = {
      parent,
      children: [],
      brother: parent && Array.isArray(parent.children) && visitor > 0 ? parent.children[visitor - 1] : null,
      props: null,
      patches: [],
    };
    if (parent) {
      (parent.children as Awesome.VDom[])[visitor] = el;
    }
    if (element) {
      el.children = String(element);
    } else {
      el.type = EmptyElement;
    }
  } else if ('type' in element) {
    const type = element.type as any;
    const el: Awesome.VDom = {
      type,
      parent,
      children: [],
      brother: parent && Array.isArray(parent.children) && visitor > 0 ? parent.children[visitor - 1] : null,
      props: element.props,
      patches: [],
    };
    if (typeof type === 'function') {
      if (type.prototype instanceof AwesomeComponent) {
        const Type = type as new(props: any) => AwesomeComponent;
        el.instance = new Type(element.props);
        el.instance._node = el;
        build(el.instance.render(), el, 0);
      } else {
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

        build(functionComponent, el, 0);
      }
    } else if (element.props && element.props.children) {
      if (Array.isArray(element.props.children) && el) {
        let i = 0;
        while (i < element.props.children.length) {
          const curChildren = element.props.children[i];
          if (Array.isArray(curChildren)) {
            const child = {
              type: Fragment,
              parent: el,
              children: [],
              brother: el && Array.isArray(el.children) && i > 0 ? el.children[i - 1] : null,
              props: {children: curChildren},
            };
            el.children[visitor] = child;
            build(curChildren, child, i);
          } else {
            build(curChildren, el, i);
          }
          ++ i;
        }
      }
    }

    if (el && parent) {
      (parent.children as Awesome.VDom[])[visitor] = el;
    }
  } else if (Array.isArray(element)) {
    let i = 0;
    while (i < element.length) {
      build(element[i], parent, i);
      ++ i;
    }
  }
}

function multiplex(
    element: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node,
    old: Awesome.VDom,
    parent: Awesome.VDom,
    visitor: number) {
  const el: Awesome.VDom = {
    parent: parent.parent,
    brother: Array.isArray(parent.children) && parent.children.length > 0 ? parent.children[visitor] : null,
    children: [],
    type: parent.type,
    props: null,
  };
  if (typeof element === 'object' && element) {
    if ('props' in element) {
      el.props = element.props;
      for (let i = 0; i < element.props.children.length; ++ i) {
        const child = element.props.children[i];
        const _old = (old.children as Awesome.VDom[])[i];
        const newNode: Awesome.VDom = {
          type: element.type,
          parent: el,
          brother: Array.isArray(el.children) && i > 0 ? el.children[i - 1] : null,
          children: [],
          props: Array.isArray(child) ? {children: child} : child.props,
          instance: _old ? _old.instance : undefined,
          patches: _old ? _old.patches : undefined,
        };
        if (newNode.instance) {
          newNode.instance._node = newNode;
        }
        (el.children as Awesome.VDom[])[i] = newNode;
      }
    }
    return el;
  } else {
    const el: Awesome.VDom = {
      parent,
      children: [],
      brother: parent && Array.isArray(parent.children) && visitor > 0 ? parent.children[visitor - 1] : null,
      props: null,
    };
    if (parent) {
      (parent.children as Awesome.VDom[])[visitor] = el;
    }
    if (element) {
      el.children = String(element);
    } else {
      el.type = Fragment;
    }
    return el;
  }
}

/**
 * 遍历旧的组件节点和新的组件节点 判断是否有新的节点
 * @param {Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node} element 新的组件节点
 * @param {Awesome.VDom} node 新组建父节点
 * @param {Awesome.VDom} old 旧的组建节点
 * @param {number} visitor 访问下标
 */
function diff(
    element: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node,
    node: Awesome.VDom,
    old: Awesome.VDom,
    visitor: number,
) {
  if (typeof element === 'object' && element) {
    if ('props' in element) {
      if ((old.props && element.props) && Object.keys(element.props).length === Object.keys(old.props).length) {
        for (const prop in element.props) {
          if (Reflect.get(element.props, prop) !== Reflect.get(old.props, prop)) {
            const newNode = multiplex(element, old, node, visitor);
            node.children[visitor] = newNode;
            if (Array.isArray(old.children)) {
              for (let i = 0; i < old.children.length; ++ i) {
                rebuild(old.children[i], newNode, i);
              }
            }
            break;
          }
        }
      } else {
        const newNode = multiplex(element, old, node, visitor);
        node.children[visitor] = newNode;
        if (Array.isArray(old.children)) {
          for (let i = 0; i < old.children.length; ++ i) {
            rebuild(old.children[i], newNode, i);
          }
        }
      }
    }
  } else {
    if (node.props.children[0] !== element) {
      if (node.dom) {
        node.dom.innerText = String(element || '');
      }
      node.children = element;
    }
  }
}

function rebuild(
    node: Awesome.VDom,
    workingNode: Awesome.VDom,
    visitor: number,
) {
  if (node.instance instanceof AwesomeComponent) {
    const nextState = Object.create(node.instance);
    node.patches!.forEach((patch) => {
      Object.assign(nextState, patch.state);
    });
    // 判断类组件是否需要更新组件树
    if (node.patches!.length === 0 || !node.instance.shouldComponentUpdate(node.props, nextState)) {
      (workingNode.children as Awesome.VDom[])[visitor] = node;
    } else {
      Object.assign(node.instance.state, nextState);
      const result = node.instance.render();
      debugger;
      diff(result, workingNode, (node.children as Awesome.VDom[])[0], 0);
    }
  } else if (typeof node.type === 'function') {
    let p = node.stateStart;
    let isUpdate = false;
    while (p && p !== node.stateEnd) {
      if (p.future !== p.value) {
        isUpdate = true;
        break;
      }
      p.value = p.future;
      p = p.next;
    }
    if (isUpdate) {
      diff(node.type(node.props), workingNode.children[visitor], node.children[0], 0);
    } else {
      (workingNode.children as Awesome.VDom[])[visitor] = node;
      if (Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; ++ i) {
          const child = node.children[i];
          rebuild(child, node, i);
        }
      }
    }
  } else {
    (workingNode.children as Awesome.VDom[])[visitor] = node;
    if (Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; ++ i) {
        const child = node.children[i];
        if (Array.isArray(child)) {
          const el: Awesome.VDom = {
            brother: i > 0 ? node.children[i - 1] : null,
            parent: node,
            children: child,
            props: {children: child},
          };
          node.children[i] = el;
          rebuild(el, node, i);
        } else {
          rebuild(child, node, i);
        }
      }
    }
  }
}

export default {
  build,
  rebuild,
  dispatchState,
  createRoot,
  dispatchRoot,
  dispatchEffect,
};
