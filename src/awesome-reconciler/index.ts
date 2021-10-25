import * as AwesomeTypes from '@/types';
import {AwesomeComponent} from '@/component';
import {Fragment} from '@/const';
import {dispatchState, dispatchEffect, dispatchRef, dispatchMemo, dispatchCallback, appendNextNode} from '@/node';

function build(
    element: AwesomeTypes.DOMElement<AwesomeTypes.DOMAttributes<Element>, Element> | AwesomeTypes.AwesomeElement | AwesomeTypes.Node,
    parent: AwesomeTypes.VDom | null = null,
    visitor: number = 0,
) {
  if (!element || typeof element !== 'object') {
    const el: AwesomeTypes.VDom = {
      parent,
      children: [],
      brother: parent && Array.isArray(parent.children) && visitor > 0 ? parent.children[visitor - 1] : null,
      props: null,
      patches: [],
      visitor,
    };
    if (parent) {
      (parent.children as AwesomeTypes.VDom[])[visitor] = el;
    }
    if (element) {
      el.children = String(element);
    } else {
      el.type = Fragment;
    }
  } else if ('type' in element) {
    const type = element.type as any;
    const el: AwesomeTypes.VDom = {
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
        const {getState, getStateTail, setState} = dispatchState();
        const {getEffectHooks, getEffectTail, setEffectHooks} = dispatchEffect();
        const {getMemo, getMemoTail, setMemo} = dispatchMemo();
        const {getCallback, getCallbackTail, setCallback} = dispatchCallback();
        const {getRef, getRefTail, setRef} = dispatchRef();

        if (el.stateStart == null) {
          el.stateStart = getStateTail();
        }
        if (el.effectStart == null) {
          el.effectStart = getEffectTail();
        }
        if (el.memoStart == null) {
          el.memoStart = getMemoTail();
        }
        if (el.callbackStart == null) {
          el.callbackStart = getCallbackTail();
        }
        if (el.refStart == null) {
          el.refStart = getRefTail();
        }

        setState(el.stateStart);
        setEffectHooks(el.effectStart);
        setMemo(el.memoStart);
        setCallback(el.callbackStart);
        setRef(el.refStart);
        const functionComponent = (type as ((props: any) => AwesomeTypes.AwesomeElement<any, any> | null))(element.props);
        if (getState() !== el.stateStart) {
          if (el.effectEnd == null) {
            el.stateEnd = getState().perv;
          }
        } else {
          delete el.stateStart;
        }
        if (getEffectHooks() !== el.effectStart) {
          if (el.effectEnd == null) {
            el.effectEnd = getEffectTail().perv;
          }
        } else {
          delete el.effectStart;
        }
        if (getMemo() !== el.memoStart) {
          if (el.memoEnd == null) {
            el.memoEnd = getMemoTail().perv;
          }
        } else {
          delete el.memoStart;
        }
        if (getCallback() !== el.callbackStart) {
          if (el.callbackEnd == null) {
            el.callbackEnd = getCallbackTail().perv;
          }
        } else {
          delete el.callbackStart;
        }
        if (getRef() !== el.refStart) {
          if (el.refEnd == null) {
            el.refEnd = getRefTail().perv;
          }
        } else {
          delete el.refStart;
        }

        build(functionComponent, el, 0);
      }
    } else if (element.props && element.props.children) {
      if (Array.isArray(element.props.children) && el) {
        let i = 0;
        while (i < element.props.children.length) {
          const curChildren = element.props.children[i];
          build(curChildren, el, i);
          (parent?.children as AwesomeTypes.VDom[])[visitor] = el;
          ++ i;
        }
      }
    }

    if (el && parent) {
      (parent.children as AwesomeTypes.VDom[])[visitor] = el;
    }
  } else if (Array.isArray(element)) {
    let i = 0;
    const el: AwesomeTypes.VDom = {
      parent,
      children: [],
      brother: parent && Array.isArray(parent.children) && visitor > 0 ? parent.children[visitor - 1] : null,
      props: null,
      visitor,
      type: Fragment,
    };
    while (i < element.length) {
      build(element[i], el, i);
      ++ i;
    }
    (parent?.children as AwesomeTypes.VDom[])[visitor] = el;
  }
}

function unmount(node: AwesomeTypes.VDom) {
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

    if (node.stateStart) {
      if (node.stateStart.perv) {
        node.stateStart.perv.next = node.stateEnd?.next;
      }
      delete node.stateStart.perv;
    }
    if (node.stateEnd) {
      if (node.stateEnd.next) {
        node.stateEnd.next.perv = node.stateStart?.perv;
      }
      delete node.stateEnd.next;
    }

    if (node.effectStart) {
      if (node.effectStart.perv) {
        node.effectStart.perv.next = node.effectEnd?.next;
      }
      delete node.effectStart.perv;
    }
    if (node.effectEnd) {
      if (node.effectEnd.next) {
        node.effectEnd.next.perv = node.effectStart?.perv;
      }
      delete node.effectEnd.next;
    }

    if (node.memoStart) {
      if (node.memoStart.perv) {
        node.memoStart.perv.next = node.memoEnd?.next;
      }
      delete node.memoStart.perv;
    }
    if (node.memoEnd) {
      if (node.memoEnd.next) {
        node.memoEnd.next.perv = node.memoStart?.perv;
      }
      delete node.memoEnd.next;
    }

    if (node.callbackStart) {
      if (node.callbackStart.perv) {
        node.callbackStart.perv.next = node.callbackEnd?.next;
      }
      delete node.callbackStart.perv;
    }
    if (node.callbackEnd) {
      if (node.callbackEnd.next) {
        node.callbackEnd.next.perv = node.callbackStart?.perv;
      }
      delete node.callbackEnd.next;
    }

    if (node.refStart) {
      if (node.refStart.perv) {
        node.refStart.perv.next = node.refEnd?.next;
      }
      delete node.refStart.perv;
    }
    if (node.refEnd) {
      if (node.refEnd.next) {
        node.refEnd.next.perv = node.refStart?.perv;
      }
      delete node.refEnd.next;
    }

    node.stateStart = undefined;
    node.stateEnd = undefined;
    node.effectStart = undefined;
    node.effectEnd = undefined;
    node.memoStart = undefined;
    node.memoEnd = undefined;
    node.callbackStart = undefined;
    node.callbackEnd = undefined;
    node.refStart = undefined;
    node.refEnd = undefined;
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
 * @param {AwesomeTypes.DOMElement<AwesomeTypes.DOMAttributes<Element>, Element> | AwesomeTypes.AwesomeElement | AwesomeTypes.Node} element 新的组件节点
 * @param {AwesomeTypes.VDom} node 新组建父节点
 * @param {AwesomeTypes.VDom} old 旧的组建节点
 * @param {number} visitor 访问下标
 */
function diff(
    element: AwesomeTypes.DOMElement<AwesomeTypes.DOMAttributes<Element>, Element> | AwesomeTypes.AwesomeElement | AwesomeTypes.Node | AwesomeTypes.VDom | null,
    node: AwesomeTypes.VDom,
    old: AwesomeTypes.VDom | null,
    visitor: number,
) {
  if (Array.isArray(element)) {
    for (let j = 0; j < element.length; ++ j) {
      diff(
          element[j],
          (node.children as AwesomeTypes.VDom[])[visitor],
          (old!.children as AwesomeTypes.VDom[])[j],
          j);
      if (j === element.length - 1) {
        appendNextNode((node.children as AwesomeTypes.VDom[])[visitor], node, visitor + 1);
      }
    }

    return;
  }
  if (old && element && typeof element === 'object') {
    if ('type' in element && 'type' in old && typeof element.type !== 'function' && old.type === element.type) {
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
      (node.children as AwesomeTypes.VDom[])[visitor] = old;
      old.parent = node;
      old.props = element.props;
      if (Array.isArray(old.children)) {
        for (let i = 0; i < old.children.length; ++ i) {
          if (i < element.props.children.length) {
            if (typeof element.props.children[i] === 'object') {
              diff(element.props.children[i], (node.children as AwesomeTypes.VDom[])[visitor], old.children[i], i);
            } else {
              if (element.props.children[i]) {
                if (old.children[i].dom?.textContent !== element.props.children[i]) {
                  if (old && old.children[i] && old.children[i].dom) {
                    (old.children as AwesomeTypes.VDom[])[i].dom!.textContent = element.props.children[i];
                  }
                }
              } else {
                if (old.children[i]) {
                  unmount(old.children[i]);
                  old.children[i].children = [];
                  old.children[i].type = Fragment;
                  old.children[i].props = null;
                }
              }
            }
          }
        }
        const size = element.props && element.props.children ? element.props.children.length : 0;
        for (let i = old.children.length; i < size; ++ i) {
          diff(element.props.children[i], (node.children as AwesomeTypes.VDom[])[visitor], null, i);
        }
        for (let i = size; i < old.children.length; ++ i) {
          diff(null, (node.children as AwesomeTypes.VDom[])[visitor], old.children[i], i);
        }
      } else {
        console.log(element);
      }
    } else if ('type' in element && element.type !== old.type) {
      build(element, node, visitor);
      sateRenderElement((node.children as AwesomeTypes.VDom[])[visitor], node, visitor);

      appendNextNode((node.children as AwesomeTypes.VDom[])[visitor], node, visitor + 1);
    } else if ('type' in element && typeof element.type === 'function') {
      if ('compare' in (old.type as Function)) {
        if (!(Reflect.get(old.type as Function, 'compare') as Function)(old.props, element.props)) {
          if (Array.isArray(element.props.children)) {
            for (let i = 0; i < element.props.children.length; ++ i) {
              if (typeof element.props.type === 'function') {
                rebuild((old.children as AwesomeTypes.VDom[])[i], old, i);
              }
            }
          }
          return;
        }
      }
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
      sateRenderElement((node.children as AwesomeTypes.VDom[])[visitor], node, visitor);

      appendNextNode(node, node.parent!, node.visitor + 1);
    }
  }
}

function updateClassNode(
    node: AwesomeTypes.VDom,
    workingNode: AwesomeTypes.VDom,
    visitor: number,
) {
  const nextState = Object.create(node.instance!);
  node.patches && node.patches.forEach((patch) => {
    Object.assign(nextState, patch.state);
  });
  // 判断类组件是否需要更新组件树
  node.instance!._updated = node.instance!.shouldComponentUpdate(workingNode.children[visitor] ? (workingNode.children as AwesomeTypes.VDom[])[visitor].props : node.props, nextState);

  if (!node.instance!._updated) {
    (workingNode.children as AwesomeTypes.VDom[])[visitor] = node;
    node.parent = workingNode;

    diff(node.children[0], node, (node.children as AwesomeTypes.VDom[])[0], 0);
  } else {
    Object.assign(node.instance!.state, nextState);
    node.props = workingNode.children[visitor] ? (workingNode.children as AwesomeTypes.VDom[])[visitor].props : node.props;
    node.instance!.props = node.props;
    // 待测试是否需要重新创建新的引用
    (workingNode.children as AwesomeTypes.VDom[])[visitor] = node;
    node.parent = workingNode;
    const result = node.instance!.render();
    diff(result, node, (node.children as AwesomeTypes.VDom[])[0], 0);
    node.patches = [];
  }
}

function rebuild(
    node: AwesomeTypes.VDom,
    workingNode: AwesomeTypes.VDom,
    visitor: number,
    isForce: boolean = false,
) {
  if (node.instance) {
    if (node.instance.componentDidCatch) {
      try {
        updateClassNode(node, workingNode, visitor);
      } catch (error: any) {
        node.instance.componentDidCatch(error);
      }
    } else {
      updateClassNode(node, workingNode, visitor);
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
      const {setState, getStateTail} = dispatchState();
      if (node.stateStart) {
        setState(node.stateStart);
      } else {
        setState(getStateTail());
      }
      const {setEffectHooks, getEffectTail} = dispatchEffect();
      if (node.effectStart) {
        setEffectHooks(node.effectStart);
      } else {
        setEffectHooks(getEffectTail());
      }
      const {setMemo, getMemoTail} = dispatchMemo();
      if (node.memoStart) {
        setMemo(node.memoStart);
      } else {
        setMemo(getMemoTail());
      }
      const {setCallback, getCallbackTail} = dispatchCallback();
      if (node.callbackStart) {
        setCallback(node.callbackStart);
      } else {
        setCallback(getCallbackTail());
      }
      const {setRef, getRefTail} = dispatchRef();
      if (node.refStart) {
        setRef(node.refStart);
      } else {
        setRef(getRefTail());
      }
      const newNode = (node.type as Function)(node.props);
      diff(newNode, (workingNode.children as AwesomeTypes.VDom[])[visitor], (node.children as AwesomeTypes.VDom[])[0], 0);
    } else {
      (workingNode.children as AwesomeTypes.VDom[])[visitor] = node;
      if (Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; ++ i) {
          const child = node.children[i];
          rebuild(child, node, i);
        }
      }
    }
  } else {
    (workingNode.children as AwesomeTypes.VDom[])[visitor] = node;
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
    node: AwesomeTypes.VDom,
    parent: AwesomeTypes.VDom,
    visitor: number = 0,
) {
  if (!node.type || typeof node.type === 'string' || node.type === Fragment) {
    if (!node.type) {
      node.dom = document.createTextNode(node.children as string) as unknown as HTMLElement;
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
        sateRenderElement(child as AwesomeTypes.VDom, node, i);
      }

      if ('ref' in node.props) {
        node.props.ref(el);
      }
      parent.dom?.append(el);
    } else {
      const el = document.createDocumentFragment();
      node.dom = el as unknown as HTMLElement;
      for (let i = 0; i < node.children.length; ++ i) {
        const child = node.children[i];
        sateRenderElement(child as AwesomeTypes.VDom, node, i);
      }
      parent.dom?.append(el);
    }
  } else {
    for (let i = 0; i < node.children.length; ++ i) {
      const child = node.children[i];
      sateRenderElement(child as AwesomeTypes.VDom, parent, visitor);
      if (!node.dom && (node.children as AwesomeTypes.VDom[])[i].dom) {
        node.dom = (node.children as AwesomeTypes.VDom[])[i].dom;
      }
    }
    if (typeof node.type === 'function') {
      if (node.instance) {
        node.instance.componentDidMount && node.instance.componentDidMount();
      } else {
        let p = node.effectStart;
        while (p) {
          if (p.value && p.value[0]) {
            p.value[0] = p.value[0]();
          }
          if (p !== node.effectEnd) {
            p = p.next;
          } else {
            break;
          }
        }
      }
    }
  }
}

function sateRenderElement(
    node: AwesomeTypes.VDom,
    parent: AwesomeTypes.VDom,
    visitor: number = 0,
) {
  if (node.instance && node.instance.componentDidCatch) {
    try {
      renderElement(node, parent, visitor);
    } catch (error: any) {
      node.instance.componentDidCatch(error);
    }
  } else {
    renderElement(node, parent, visitor);
  }
}

export default {
  build,
  rebuild,
  renderElement,
  dispatchState,
  dispatchEffect,
};
