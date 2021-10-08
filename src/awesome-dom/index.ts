import {AwesomeComponent} from '@/component';
import * as Awesome from '@/types';
import _Awesome from '@/awesome';

function build<P extends {children: Awesome.ChildrenNode | string}>(
    element: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node,
    parent: Awesome.VDom<P> | null = null,
    i: number = 0,
    old?: Awesome.VDom<P>,
): Awesome.VDom<P> | null {
  if (!element || typeof element !== 'object') {
    if (element && parent) {
      const el: Awesome.VDom<P> = {
        parent,
        children: String(element),
        brother: parent && Array.isArray(parent.children) && i > 0 ? parent.children[i - 1] : null,
        props: null,
        hooks: [],
        patches: [],
      };
      (parent.children as Awesome.VDom<P>[]).push(el);
      return el;
    }
  } else if ('type' in element) {
    const type = element.type;
    const el: Awesome.VDom<P> = {
      type,
      parent,
      children: [],
      brother: parent && Array.isArray(parent.children) && i > 0 ? parent.children[i - 1] : null,
      props: element.props,
      hooks: [],
      patches: [],
    };
    if (typeof type === 'function') {
      if (type.prototype instanceof AwesomeComponent) {
        const Type = type as new(props: P) => AwesomeComponent<P>;
        if (old && old.type === element.type) {
          el.instance = old.instance!;
        } else {
          el.instance = new Type(element.props);
          el.instance._node = el;
        }
        build(el.instance.render(), el, 0, old && Array.isArray(old.children) ? old.children[i] : undefined);
      } else {
        build((type as ((props: any) => Awesome.AwesomeElement<any, any> | null))(element.props), el, 0, old && Array.isArray(old.children) ? old.children[i] : undefined);
      }
    } else if (element.props && element.props.children) {
      if (Array.isArray(element.props.children) && el) {
        let _i = 0;
        for (const child of element.props.children) {
          build(child as Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element>, el, _i, old && Array.isArray(old.children) ? old.children[i] : undefined);
          ++ _i;
        }
      }
    }

    if (el && parent) {
      (parent.children as Awesome.VDom<P>[]).push(el);
    }

    return el;
  } else if (Array.isArray(element)) {
    let _i = 0;
    for (const child of element) {
      build(child as Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element>, parent, _i, old && Array.isArray(old.children) ? old.children[i] : undefined);
      ++ _i;
    }
  }

  return null;
}

function _render<P extends {children: Awesome.ChildrenNode | string}>(
    node: Awesome.VDom<P>,
    parent: Awesome.Container,
) {
  if (!node.type || typeof node.type === 'string' || node.type === _Awesome.Fragment) {
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
        _render(child as Awesome.VDom<P>, el);
      }

      parent.append(el);
      node.dom = el as HTMLElement;
    } else {
      const el = document.createDocumentFragment();
      for (const child of node.children) {
        _render(child as Awesome.VDom<P>, el);
      }

      parent.append(el);
    }
  } else {
    for (const child of node.children) {
      _render(child as Awesome.VDom<P>, parent);
    }
  }
}

function replaceOld(tree: Awesome.VDom, handler: (dom: HTMLElement) => void) {
  if (typeof tree.type === 'function' || tree.type === _Awesome.Fragment) {
    if (Array.isArray(tree.children)) {
      for (const child of tree.children) {
        if (typeof child.type === 'function') {
          replaceOld(child, handler);
        }
      }
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
        for (let i = 0; i < Math.max(old.children.length, cur.children.length); ++ i) {
          diff(old.children[i] as Awesome.VDom, cur.children[i] as Awesome.VDom);
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
  container && container.childNodes.forEach((child) => {
    child.remove();
  });

  const vdom: Awesome.VDom = {
    parent: null,
    children: [],
    brother: null,
    hooks: [],
    patches: [],
    props: {},
    dom: container as HTMLElement,
  };
  build(element, vdom);
  let isDispatching: null | NodeJS.Timer = null;
  vdom.dispatchUpdate = function() {
    if (!isDispatching) {
      isDispatching = setTimeout(() => {
        vdom.patches.forEach((patch) => {
          if (!patch.isForce) {
            Object.assign(patch.instance.state, patch.state);
          }
          const cur: Awesome.VDom = {...patch.instance._node!};
          const next = build(patch.instance.render(), null, 0, patch.instance._node?.children && Array.isArray(patch.instance._node.children) ? patch.instance._node?.children[0] : undefined);
          cur.children = next ? (typeof next === 'string' ? next : [next]) : [];
          diff(patch.instance._node!, cur);
          patch.instance._node!.children = cur.children;
        });
        vdom.patches = [];
        isDispatching = null;
      }, 0);
    } else {
      clearTimeout(isDispatching);
      isDispatching = null;
    }
  };
  if (container) {
    _render((vdom.children as Awesome.VDom[])[0], container);
  }

  callback && callback();
}

export default {
  render,
  build,
};
