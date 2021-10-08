import {AwesomeComponent} from '@/component';
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
type JSXElementConstructor<P extends {children: ChildrenNode | string}> =
| ((props: P) => AwesomeElement<any, any> | null)
| (new (props: P) => AwesomeComponent<P, any>);
type AwesomeElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> = React.ReactElement<P, T>

type ChildrenNode = React.ReactChild
type FunctionComponent<P> = React.FunctionComponent<P>
type Attributes = React.Attributes
type FunctionComponentElement<P> = React.FunctionComponentElement<P>

interface VDom<P extends {children: ChildrenNode | string} = {children: ChildrenNode | string}> {
  type?: string | JSXElementConstructor<P> | symbol
  parent: VDom<P> | null
  children: VDom<P>[] | string
  brother: VDom<P> | null
  hooks?: Function[]
  props: any
  instance?: AwesomeComponent<P>
  patches: {instance: AwesomeComponent<P>, state?: {}, isForce?: boolean}[]
  dispatchUpdate?: () => void
  dom?: HTMLElement | null
}

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
  ChildrenNode,
  FunctionComponent,
  FunctionComponentElement,
  Attributes,
  VDom,
};
