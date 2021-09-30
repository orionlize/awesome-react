import * as Awesome from './type';

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

function createElement<
  P extends Awesome.HTMLAttributes<T> | Awesome.SVGAttributes<T> | Awesome.DOMAttributes<T>,
  T extends HTMLElement | Awesome.SVGElement | Element>(
    type: 'input' | keyof Awesome.NodeType | keyof Awesome.SVG | string,
    props: (Awesome.InputHTMLAttributes & Awesome.ClassAttributes<HTMLInputElement>) | (Awesome.ClassAttributes<T> & P) | null,
    ...children: Awesome.Node[]
): Awesome.DetailedAwesomeHTMLElement<Awesome.InputHTMLAttributes, HTMLInputElement> | Awesome.DetailedAwesomeHTMLElement<P, T> | {

}

export default {
  createElement,
};
