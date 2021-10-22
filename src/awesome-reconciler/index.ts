import * as Awesome from '@/types';
import {AwesomeComponent} from '@/component';
import {Fragment} from '@/const';
import {appendNextNode} from '@/utils';

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
      visitor,
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
      visitor,
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
          el.stateEnd = _stateTail.perv;
        }
        if (el.effectEnd == null) {
          el.effectEnd = _effectTail.perv;
        }

        build(functionComponent, el, 0);
      }
    } else if (element.props && element.props.children) {
      if (Array.isArray(element.props.children) && el) {
        let i = 0;
        while (i < element.props.children.length) {
          const curChildren = element.props.children[i];
          if (Array.isArray(curChildren)) {
            const child: Awesome.VDom = {
              type: Fragment,
              parent: el,
              children: [],
              brother: el && Array.isArray(el.children) && i > 0 ? el.children[i - 1] : null,
              props: {children: curChildren},
              visitor: i,
            };
            el.children[i] = child;
            build(curChildren, child, 0);
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

function unmount(node: Awesome.VDom) {
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      unmount(child);
    }
  }
  if (node.instance) {
    node.instance.componentWillUnmount && node.instance.componentWillUnmount();
  } else if (typeof node.type === 'function') {
    let p = node.effectStart;
    while (p) {
      if (p.value && typeof p.value[0] === 'function') {
        p.value[0]();
      }
      if (p === node.effectEnd) {
        break;
      } else {
        p = p.next;
      }
    }
    node.stateStart = undefined;
    node.stateEnd = undefined;
    node.effectStart = undefined;
    node.effectEnd = undefined;
  } else if (typeof node.type === 'string' && 'props' in node) {
    for (const prop in node.props) {
      if (/^on/.test(prop)) {
        node.dom?.removeEventListener(prop.slice(2).toLocaleLowerCase(), Reflect.get(node.props, prop));
      }
    }
    node.dom?.remove();
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
      for (const prop in element.props) {
        if (prop === 'children' || prop === 'ref' || prop === 'key') {
          continue;
        }
        if (prop === 'style') {
          Object.assign(old.dom?.style, Reflect.get(element.props, prop));
          continue;
        }
        if (/^on/.test(prop)) {
          const _oldFunc = Reflect.get(old.props, prop);
          const _newFunc = Reflect.get(element.props, prop);
          if (_oldFunc !== _newFunc) {
            const event = prop.slice(2).toLowerCase();
            old.dom?.removeEventListener(event, _oldFunc);
            old.dom?.addEventListener(event, _newFunc);
          }
          continue;
        }

        if (Reflect.has(element.props, prop)) {
          old.dom?.setAttribute(prop.toLocaleLowerCase(), Reflect.get(element.props, prop));
        }
      }
      node.children[visitor] = old;
      old.parent = node;
      old.props = element.props;
      if (Array.isArray(old.children)) {
        for (let i = 0; i < old.children.length; ++ i) {
          if (i < element.props.children.length) {
            if (typeof element.props.children[i] === 'object') {
              if (Array.isArray(element.props.children[i])) {
                for (let j = 0; j < element.props.children[i].length; ++ j) {
                  diff(
                      element.props.children[i][j],
                      node.children[visitor].children[i],
                      old.children[i].children[j],
                      j);
                  if (j === element.props.children[i].length - 1) {
                    appendNextNode(node.children[visitor].children[i], node.children[visitor], i + 1);
                  }
                }
              } else {
                diff(element.props.children[i], node.children[visitor], old.children[i], i);
              }
            } else {
              if (element.props.children[i]) {
                if (old.children[i].dom?.textContent !== element.props.children[i]) {
                  old.children[i].dom?.textContent = element.props.children[i];
                }
              } else {
                if (old.children[i]) {
                  unmount(old.children[i]);
                  old.children[i].children = [];
                }
              }
            }
          }
        }
        for (let i = old.children.length; i < element.props.children.length; ++ i) {
          diff(element.props.children[i], node.children[visitor], undefined, i);
        }
        for (let i = element.props.children.length; i < old.children.length; ++ i) {
          diff(undefined, node.children[visitor], old.children[i], i);
        }
      } else {
        console.log(element);
      }
    } else if (element.type !== old.type) {
      build(element, node, visitor);
      renderElement(node.children[visitor], node, visitor);

      appendNextNode(node.children[visitor], node, visitor + 1);
    } else if (typeof element.type === 'function') {
      old.props = element.props;
      rebuild(
          old,
          node,
          visitor,
          !(element.type.prototype instanceof AwesomeComponent),
      );
      if (old.instance && old.instance._updated) {
        old.instance.componentDidUpdate && old.instance.componentDidUpdate();
        old.instance._updated = false;
      }
    }
  } else {
    if (!element && !old) {
      return;
    } else if (!element) {

    } else if (!old) {
      build(element, node, visitor);
      renderElement(node.children[visitor], node, visitor);

      appendNextNode(node, node.parent, node.visitor + 1);
    }
  }
}

function rebuild(
    node: Awesome.VDom,
    workingNode: Awesome.VDom,
    visitor: number,
    isForce: boolean = false,
) {
  if (node.instance) {
    const nextState = Object.create(node.instance);
    node.patches && node.patches.forEach((patch) => {
      Object.assign(nextState, patch.state);
    });
    // 判断类组件是否需要更新组件树
    node.instance._updated = node.instance.shouldComponentUpdate(workingNode.children[visitor] ? workingNode.children[visitor].props : node.props, nextState);
    console.log(workingNode.children[visitor] ? workingNode.children[visitor].props : node.props);
    if (!node.instance._updated) {
      (workingNode.children as Awesome.VDom[])[visitor] = node;
      node.parent = workingNode.children;

      diff(node.children[0], node, (node.children as Awesome.VDom[])[0], 0);
    } else {
      Object.assign(node.instance.state, nextState);
      node.props = workingNode.children[visitor] ? workingNode.children[visitor].props : node.props;
      node.instance.props = node.props;
      // 待测试是否需要重新创建新的引用
      workingNode.children[visitor] = node;
      node.parent = workingNode;
      const result = node.instance.render();
      diff(result, node, (node.children as Awesome.VDom[])[0], 0);
      node.patches = [];
    }
  } else if (typeof node.type === 'function') {
    let p = node.stateStart;
    let isUpdate = !p;
    while (p) {
      if (p.future !== p.value) {
        isUpdate = true;
        p.value = p.future;
      }
      if (p !== node.stateEnd) {
        p = p.next;
      } else {
        break;
      }
    }
    if (isUpdate || isForce) {
      if (node.stateStart) {
        _state = node.stateStart!;
      } else {
        _state = _stateTail;
        node.stateStart = _state;
      }
      if (node.effectStart) {
        _effect = node.effectStart;
      } else {
        _effect = _effectTail;
        node.effectStart = _effect;
      }
      const newNode = node.type(node.props);
      diff(newNode, workingNode.children[visitor], node.children[0], 0);
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
        rebuild(node.children[i], node, i);
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
      node.dom = document.createTextNode(node.children as string);
      parent.dom?.append(node.dom);
    } else if (typeof node.type === 'string') {
      const el = document.createElement(node.type);
      for (const prop in node.props) {
        if (prop === 'children' || prop === 'ref' || prop === 'key') {
          continue;
        }
        if (prop === 'style') {
          Object.assign(el.style, Reflect.get(node.props, prop));
          continue;
        }
        if (/^on/.test(prop)) {
          el.addEventListener(prop.slice(2).toLowerCase(), Reflect.get(node.props, prop));
          continue;
        }

        if (Reflect.has(node.props, prop)) {
          el.setAttribute(prop.toLocaleLowerCase(), Reflect.get(node.props, prop));
        }
      }
      node.dom = el as HTMLElement;

      for (let i = 0; i < node.children.length; ++ i) {
        const child = node.children[i];
        renderElement(child as Awesome.VDom, node, i);
      }

      parent.dom?.append(el);
    } else {
      const el = document.createDocumentFragment();
      node.dom = el as unknown as HTMLElement;
      for (let i = 0; i < node.children.length; ++ i) {
        const child = node.children[i];
        renderElement(child as Awesome.VDom, node, i);
      }
      parent.dom?.append(el);
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
