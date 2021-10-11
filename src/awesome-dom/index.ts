import * as Awesome from '@/types';
import AwesomeReconciler from '@/awesome-reconciler';
import {Fragment} from '@/const';

function _render(
    node: Awesome.VDom,
    parent: Awesome.Container,
) {
  if (!node.type || typeof node.type === 'string' || node.type === Fragment) {
    if (!node.type) {
      parent.append(node.children as string);
      node.dom = parent.childNodes.item(parent.childNodes.length - 1) as HTMLElement;
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
      for (const child of node.children) {
        _render(child as Awesome.VDom, el);
      }

      parent.append(el);
      node.dom = el as HTMLElement;
    } else {
      const el = document.createDocumentFragment();
      for (const child of node.children) {
        _render(child as Awesome.VDom, el);
      }

      parent.append(el);
    }
  } else {
    for (const child of node.children) {
      _render(child as Awesome.VDom, parent);
    }
    if (typeof node.type === 'function') {
      if (node.instance) {
        node.instance.componentDidMount && node.instance.componentDidMount();
      }
    }
  }
}

function replaceOld(tree: Awesome.VDom, handler: (dom: HTMLElement) => void, unmount?: () => void) {
  if (typeof tree.type === 'function' || tree.type === Fragment) {
    if (Array.isArray(tree.children)) {
      for (const child of tree.children) {
        replaceOld(child, handler);
      }
    }
    if (typeof tree.type === 'function') {
      unmount && unmount();
    }
  } else if (!tree.type || typeof tree.type === 'string') {
    if (tree.dom) {
      handler(tree.dom);
      tree.dom = null;
    }
  }
}

function diff(old: Awesome.VDom | null, cur: Awesome.VDom | null) {
  if (!cur) {
    if (old) {
      replaceOld(old, (dom) => {
        dom.remove();
      }, () => {
        if (old.instance) {
          old.instance.componentWillUnmount && old.instance.componentWillUnmount();
        } else if (typeof old.type === 'function') {
          AwesomeReconciler.dispatchRoot().stateMap?.delete(old.stateIndex!);
          for (let i = 0; i < old.effectLength!; ++ i) {
            const effect = AwesomeReconciler.dispatchEffect().effectHooks[i + old.effectIndex!][0];
            if (effect) {
              effect();
            }
          }
          AwesomeReconciler.dispatchEffect().effectHooks.splice(old.effectIndex!, old.effectLength);
          AwesomeReconciler.dispatchState().state.splice(old.stateIndex!, old.stateLength);
        }
      });
    }
  } else if (!old) {
    let parent = cur.parent;
    while (parent?.parent && !parent.dom) {
      parent = parent?.parent;
    }
    _render(cur, parent?.dom!);
  } else {
    if (old.type === cur.type) {
      if (old.type && cur.type) {
        if (typeof old.type === 'string') {
          cur.dom = old.dom;
          for (const attribute in cur.props) {
            if (attribute === 'children' || attribute === 'ref' || attribute === 'key') {
              continue;
            }
            if (Reflect.get(old.props, attribute) !== Reflect.get(cur.props, attribute)) {
              if (attribute === 'style') {
                Object.assign(cur.dom?.style, Reflect.get(cur.props, attribute));
                continue;
              }

              if (/^on/.test(attribute)) {
                const attr = attribute.slice(2).toLowerCase();
                cur.dom?.removeEventListener(attr, Reflect.get(old.props, attribute));
                const onEvent = Reflect.get(cur.props, attribute);
                if (onEvent) {
                  cur.dom?.addEventListener(attr, onEvent);
                }
                continue;
              }

              if (Reflect.has(cur?.props, attribute)) {
                cur.dom?.setAttribute(attribute.toLocaleLowerCase(), Reflect.get(cur?.props, attribute));
              }
            }
          }
        }
        if (cur.instance) {
          if (!(cur.instance.shouldComponentUpdate ? cur.instance.shouldComponentUpdate(cur.props, cur.instance.state) : true)) {
            cur.children = old.children;
            return;
          }
        }
        for (let i = 0; i < Math.max(old.children.length, cur.children.length); ++ i) {
          diff(old.children[i] as Awesome.VDom, cur.children[i] as Awesome.VDom);
        }
        if (cur.instance) {
          cur.instance.componentDidUpdate && cur.instance.componentDidUpdate();
        }
      } else {
        cur.dom = old.dom;
        if (cur.children !== cur.dom?.nodeValue) {
          cur.dom!.nodeValue = cur.children as string;
        }
      }
    } else {
      if (!old.type || typeof old.type === 'string') {
        old.dom?.remove();
        old.dom = null;
      } else if (typeof old.type === 'function') {
        cur.dom = old.dom;
        replaceOld(old, (dom) => {
          if (typeof cur.children === 'string') {
            dom.innerText = cur.children;
          } else {
            const fragment = document.createDocumentFragment();
            for (const child of cur.children) {
              _render(child, fragment);
            }
            dom.replaceWith(dom, fragment);
          }
        });
      } else {
        cur.dom = old.dom;
        if (typeof cur.children === 'string') {
          old.dom!.innerText = cur.children;
        } else {
          const fragment = document.createDocumentFragment();
          for (const child of cur.children) {
            _render(child, fragment);
          }
      old.dom!.replaceWith(old.dom!, fragment);
        }
      }
    }
  }
}

function render(
    element: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node,
    container: Awesome.Container | null,
    callback?: () => void) {
  if (container) {
    while (container.childNodes.length) {
      container.childNodes[0].remove();
    }
  }
  const root = AwesomeReconciler.createRoot(container);
  AwesomeReconciler.build(element, root);
  let isDispatching: null | NodeJS.Timeout = null;
  root.dispatchUpdate = function() {
    if (!isDispatching) {
      isDispatching = setTimeout(() => {
        for (const patch of root.patches) {
          if (patch.isForce) {
            Object.assign(patch.instance.state, patch.state);
          } else if (!(patch.instance.shouldComponentUpdate ? patch.instance.shouldComponentUpdate(patch.instance.props, {
            ...patch.instance.state,
            ...patch.state,
          }) : false)) {
            Object.assign(patch.instance.state, patch.state);
          } else {
            continue;
          }
        }
        const cur: Awesome.VDom = {...root};
        const next = AwesomeReconciler.build(root.children[0], null, 0, Array.isArray(root.children) ? root.children[0] : undefined);
        cur.children = next ? (typeof next === 'string' ? next : [next]) : [];
        diff(root.children[0], cur.children[0]);
        root.children = cur.children;
        root.patches = [];
        isDispatching = null;
      }, 0);
    } else {
      clearTimeout(isDispatching);
      isDispatching = null;
    }
  };
  if (container) {
    _render((root.children as Awesome.VDom[])[0], container);
  }

  callback && callback();
}

export default {
  render,
  diff,
};
