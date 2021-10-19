import * as Awesome from '@/types';
import {AwesomeComponent} from '@/component';
import {Fragment} from '@/const';
import {render} from 'react-dom';

let _root: Awesome.VDom;

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
      el.type = Fragment;
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
    parent: parent,
    brother: Array.isArray(parent.children) && parent.children.length > 0 ? parent.children[visitor] : null,
    children: [],
    type: old.type,
    props: element.props,
    dom: old.dom,
  };
  if (typeof element === 'object' && element) {
    if ('props' in element) {
      el.props = element.props;
      if (element.props && Array.isArray(element.props.children)) {
        for (let i = 0; i < element.props.children.length; ++ i) {
          const child = element.props.children[i];
          const _old = (old.children as Awesome.VDom[])[i];
          const newNode: Awesome.VDom = {
            type: Array.isArray(child) || !child ? Fragment : child.type,
            parent: el,
            brother: Array.isArray(el.children) && i > 0 ? el.children[i - 1] : null,
            children: Array.isArray(child) ? child : (child.props ? child.props.children : []),
            props: (Array.isArray(child) ? {children: child} : child.props) || null,
            instance: _old ? _old.instance : undefined,
            patches: _old ? _old.patches : undefined,
            dom: _old ? _old.dom : undefined,
          };
          if (newNode.instance) {
            newNode.instance._node = newNode;
          }
          (el.children as Awesome.VDom[])[i] = newNode;
        }
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
    element: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node | Awesome.VDom,
    node: Awesome.VDom,
    old: Awesome.VDom,
    visitor: number,
) {
  if (old && element && typeof element === 'object') {
    if (typeof element.type !== 'function' && old.type === element.type) {
      node.children[visitor] = old;
      old.parent = node;
      if (Array.isArray(old.children)) {
        for (let i = 0; i < old.children.length; ++ i) {
          // rebuild(old.children[i], newNode, i);
          if (i < element.props.children.length) {
            if (typeof element.props.children[i] === 'object') {
              if (Array.isArray(element.props.children[i])) {
                for (let j = 0; j < element.props.children[i].length; ++ j) {
                  diff(
                      element.props.children[i][j],
                      node.children[visitor].children[i],
                      old.children[i].children[j],
                      j);
                }
              } else {
                diff(element.props.children[i], node.children[visitor], old.children[i], i);
              }
            } else {
              console.log(old.dom);
              old.children[0].dom?.textContent = element.props.children[0];
            }
          }
        }
        for (let i = old.children.length; i < element.props.children.length; ++ i) {
          diff(element.props.children[i], node.children[visitor], undefined, i);
        }
        for (let i = element.props.children.length; i < old.children.length; ++ i) {
          diff(undefined, node.children[visitor], old.children[i], i);
        }
      }
    } else if (typeof element.type === 'function') {
      rebuild(
          multiplex(element, old, node, visitor),
          node,
          visitor,
      );
    } else {
      // TODO: 重新构建子树
    }
  } else {
    if (!element && !old) {
      return;
    } else if (!element) {
      // TODO: 删除子节点
    } else if (!old) {
      build(element, node, visitor);
      renderElement(node.children[visitor], node, visitor);
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
    if (!node.instance.shouldComponentUpdate(workingNode.children[visitor] ? workingNode.children[visitor].props : node.props, nextState)) {
      (workingNode.children as Awesome.VDom[])[visitor] = node;
      node.parent = workingNode.children;
    } else {
      Object.assign(node.instance.state, nextState);
      node.props = workingNode.children[visitor] ? workingNode.children[visitor].props : node.props;
      node.instance.props = node.props;
      // 待测试是否需要重新创建新的引用
      workingNode.children[visitor] = node;
      node.parent = workingNode;
      const result = node.instance.render();
      diff(result, workingNode.children[visitor], (node.children as Awesome.VDom[])[0], 0);
      node.patches = [];
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
      diff(node.type(node.props), workingNode.children[visitor], node.children[0], visitor);
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
    workingNode.children[visitor] = node;
    node.parent = workingNode;
    if (Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; ++ i) {
        rebuild(node.children[i], workingNode.children[visitor], i);
      }
    } else {
      // TODO: 处理非数组的子元素
    }
  }
}

function renderElement(
    node: Awesome.VDom,
    parent: Awesome.VDom,
    visitor: number = 0,
) {
  if (!node.type || typeof node.type === 'string' || node.type === Fragment) {
    if (!node.type) {
      if (node.children[visitor + 1] && node.children[visitor + 1].dom) {
        parent.dom?.insertBefore(document.createTextNode(node.children as string), node.children[visitor + 1].dom);
      } else {
        parent.dom?.append(node.children as any);
      }
      node.dom = parent.lastChild as HTMLElement;
    } else if (typeof node.type === 'string') {
      const el = document.createElement(node.type);
      for (const attribute in node.props) {
        if (attribute === 'children' || attribute === 'ref' || attribute === 'key') {
          continue;
        }
        if (attribute === 'style') {
          Object.assign(el.style, Reflect.get(node.props, attribute));
          continue;
        }
        if (/^on/.test(attribute)) {
          const onEvent = Reflect.get(node.props, attribute);
          if (onEvent) {
            el.addEventListener(attribute.slice(2).toLowerCase(), onEvent);
          }
          continue;
        }

        if (Reflect.has(node.props, attribute)) {
          el.setAttribute(attribute.toLocaleLowerCase(), Reflect.get(node.props, attribute));
        }
      }
      node.dom = el as HTMLElement;

      for (let i = 0; i < node.children.length; ++ i) {
        const child = node.children[i];
        renderElement(child as Awesome.VDom, node, i);
      }

      if (parent.children[visitor + 1] && parent.children[visitor + 1].dom) {
        parent.dom?.insertBefore(el, parent.children[visitor + 1].dom);
      } else {
        parent.dom?.append(el);
      }
    } else {
      const el = document.createDocumentFragment();
      node.dom = el as unknown as HTMLElement;
      for (let i = 0; i < node.children.length; ++ i) {
        const child = node.children[i];
        renderElement(child as Awesome.VDom, node, i);
      }

      if (parent.children[visitor + 1] && parent.children[visitor + 1].dom) {
        parent.dom?.insertBefore(el, parent.children[visitor + 1].dom);
      } else {
        parent.dom?.append(el);
      }
    }
  } else {
    for (let i = 0; i < node.children.length; ++ i) {
      const child = node.children[i];
      renderElement(child as Awesome.VDom, parent, visitor);
      if (!node.dom && node.children[i].dom) {
        node.dom = node.children[i].dom;
      }
    }
    if (typeof node.type === 'function') {
      if (node.instance) {
        node.instance.componentDidMount && node.instance.componentDidMount();
      }
    }
  }
}

export default {
  build,
  rebuild,
  renderElement,
  dispatchState,
  createRoot,
  dispatchRoot,
  dispatchEffect,
};
