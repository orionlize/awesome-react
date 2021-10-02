import React from 'react';

type Node = React.ReactNode
type NodeType = React.ReactHTML

type HTMLAttributes<T> = React.HTMLAttributes<T>
type ClassAttributes<T> = React.ClassAttributes<T>
type InputHTMLAttributes = React.InputHTMLAttributes<HTMLInputElement>
type DetailedAwesomeHTMLElement<P extends HTMLAttributes<T>, T extends HTMLElement> = React.DetailedReactHTMLElement<P, T>
type SVG = React.ReactSVG
type SVGAttributes<T> = React.SVGAttributes<T>
type SVGElement = React.ReactSVGElement
type DOMAttributes<T> = React.DOMAttributes<T>
type DOMElement<P extends HTMLAttributes<T> | SVGAttributes<T>, T extends Element> = React.DOMElement<P, T>
type Ref<T> = React.LegacyRef<T>

type Container = Element | Document | DocumentFragment
type AwesomeElement = React.ReactElement

type FunctionComponent<P> = React.FunctionComponent<P>
type Attributes = React.Attributes
type FunctionComponentElement<P> = React.FunctionComponentElement<P>

export {
  Node,
  NodeType,
  HTMLAttributes,
  ClassAttributes,
  InputHTMLAttributes,
  DetailedAwesomeHTMLElement,
  SVG,
  SVGAttributes,
  SVGElement,
  DOMAttributes,
  DOMElement,
  Ref,
  Container,
  AwesomeElement,
  FunctionComponent,
  FunctionComponentElement,
  Attributes,
};

// Custom components

// function createElement<P extends {}>(
//   type: FunctionComponent<P>,
//   props?: Attributes & P | null,
//   ...children: ReactNode[]): FunctionComponentElement<P>;
// function createElement<P extends {}>(
//   type: ClassType<P, ClassicComponent<P, ComponentState>, ClassicComponentClass<P>>,
//   props?: ClassAttributes<ClassicComponent<P, ComponentState>> & P | null,
//   ...children: ReactNode[]): CElement<P, ClassicComponent<P, ComponentState>>;
// function createElement<P extends {}, T extends Component<P, ComponentState>, C extends ComponentClass<P>>(
//   type: ClassType<P, T, C>,
//   props?: ClassAttributes<T> & P | null,
//   ...children: ReactNode[]): CElement<P, T>;
// function createElement<P extends {}>(
//   type: FunctionComponent<P> | ComponentClass<P> | string,
//   props?: Attributes & P | null,
//   ...children: ReactNode[]): ReactElement<P>;
