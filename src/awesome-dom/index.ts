import * as Awesome from '@/types/index';


function _render(
    element: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement,
    container: Awesome.Container | null): Element {
  const type = element.type;
  let el: HTMLElement | null = null;
  if (typeof type === 'string') {
    el = document.createElement(type);
    for (const attribute in element.props) {
      if (attribute === 'children' || attribute === 'ref' || attribute === 'key') {
        continue;
      }
      if (attribute === 'style') {
        Object.assign(el.style, Reflect.get(element.props, attribute));
        continue;
      }

      if (Reflect.has(element.props, attribute)) {
        el.setAttribute(attribute.toLocaleLowerCase(), Reflect.get(element.props, attribute));
      }
    }
  } else if (typeof element === 'string' && container) {
    container.textContent = element;
  } else if (Array.isArray(element)) {
    for (const child of element) {
      _render(child as Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element>, container);
    }
  }
  // TODO: 组件构建
  // else if (typeof type === 'function') {
  //   if (Reflect.get(type, '_isClass')) {
  //     return new type(element.props).render();
  //   } else {
  //     return type(element.props);
  //   }
  // }
  if (element.props && element.props.children) {
    if (Array.isArray(element.props.children) && el) {
      for (const child of element.props.children) {
        const _return = _render(child as Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element>, el);
        if (_return) {
          el.append(_return);
        }
      }
    }
  }

  if (el && container) {
    container.append(el);
  }

  return el as Element;
}

function render(
    element: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement,
    container: Awesome.Container | null,
    callback?: () => void): Element {
  container && container.childNodes.forEach((child) => {
    child.remove();
  });
  const _return = _render(element, container);
  callback && callback();
  return _return;
}

export default {
  render,
};
