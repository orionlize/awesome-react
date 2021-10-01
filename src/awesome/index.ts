import * as Awesome from '../types/index';

const AWESOME_TYPE = Symbol('awesome.element');

function createElement(
  type: 'input',
  props?: Awesome.InputHTMLAttributes & Awesome.ClassAttributes<HTMLInputElement> | null,
  ...children: Awesome.Node[]): Awesome.DetailedAwesomeHTMLElement<Awesome.InputHTMLAttributes, HTMLInputElement>;
function createElement<P extends Awesome.HTMLAttributes<T>, T extends HTMLElement>(
  type: keyof Awesome.NodeType,
  props?: Awesome.ClassAttributes<T> & P | null,
  ...children: Awesome.Node[]): Awesome.DetailedAwesomeHTMLElement<P, T>;
function createElement<P extends Awesome.SVGAttributes<T>, T extends Awesome.SVGElement>(
  type: keyof Awesome.SVG,
  props?: Awesome.ClassAttributes<T> & P | null,
  ...children: Awesome.Node[]): Awesome.SVGElement;
function createElement<P extends Awesome.DOMAttributes<T>, T extends Element>(
  type: string,
  props?: Awesome.ClassAttributes<T> & P | null,
  ...children: Awesome.Node[]): Awesome.DOMElement<P, T>;
function createElement<P extends Awesome.DOMAttributes<T>, T extends Element>(
  type: Awesome.FunctionComponent<P, T>,
  props?: Awesome.ClassAttributes<T> & P | null,
  ...children: Awesome.Node[]): Awesome.DOMElement<P, T>;

function createElement<P1 extends Awesome.HTMLAttributes<T1>, T1 extends HTMLElement, P2 extends Awesome.SVGAttributes<T2>, T2 extends Awesome.SVGElement, P3 extends Awesome.DOMAttributes<T3>, T3 extends Element>(
    type: 'input' | keyof (Awesome.NodeType | Awesome.SVG) | Awesome.FunctionComponent<P3, T3> | string,
    props?: (Awesome.InputHTMLAttributes & Awesome.ClassAttributes<HTMLInputElement>) | (Awesome.ClassAttributes<T1> & P1) | (Awesome.ClassAttributes<T2> & P2) | (Awesome.ClassAttributes<T3> & P3) | null,
    ...children: Awesome.Node[]
): Awesome.DetailedAwesomeHTMLElement<Awesome.InputHTMLAttributes, HTMLInputElement> | Awesome.DetailedAwesomeHTMLElement<P1, T1> | Awesome.SVGElement | Awesome.DOMElement<P3, T3> {
  if (typeof type === 'function') {
    return type(props);
  }

  const _return: Awesome.DetailedAwesomeHTMLElement<Awesome.InputHTMLAttributes, HTMLInputElement> | Awesome.DetailedAwesomeHTMLElement<P1, T1> | Awesome.SVGElement | Awesome.DOMElement<P3, T3> = {
    key: null,
    ref: null,
    props: {} as P3,
    type,
  };

  if (props) {
    if (props.key) {
      _return.key = props.key;
      delete props.key;
    }
    if (props.ref) {
      _return.ref = props.ref as Awesome.Ref<T3>;
      delete props.ref;
    }
  }
  if (children && children.length > 0) {
    props = props || {};
    props.children = children;
  }
  _return.props = props as P3;

  Object.defineProperty(_return, '$$type', {
    value: AWESOME_TYPE,
    enumerable: false,
    configurable: false,
  });

  return _return;
}

export default {
  createElement,
};
