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
type RefObject<T> = React.RefObject<T>

type Container = Element | Document | DocumentFragment
type JSXElementConstructor<P extends {children: ChildrenNode | string}> =
| ((props: P) => AwesomeElement<any, any> | null)
| (new (props: P) => AwesomeComponent<P, any>);
type AwesomeElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any> > = React.ReactElement<P, T>

type ChildrenNode = React.ReactChild
type FunctionComponent<P> = React.FunctionComponent<P>
type Attributes = React.Attributes
type FunctionComponentElement<P> = React.FunctionComponentElement<P>

type ProviderProps<T> = React.ProviderProps<T>
type ConsumerProps<T> = {
  children: (value: T) => ChildrenNode | ((value: T) => ChildrenNode)[]
}
type Component<P = {}, S = {}, SS = {}> = React.Component<P, S, SS>

interface VDom<P extends {children: ChildrenNode | string} = {children: ChildrenNode | string}> {
  type?: string | JSXElementConstructor<P> | symbol
  parent: VDom<P> | null
  children: VDom<P>[] | string
  brother: VDom<P> | null
  stateStart?: ListNode<any>
  stateEnd?: ListNode<any>
  props: any
  instance?: AwesomeComponent
  patches?: {state?: {}, isForce?: boolean}[]
  dispatchUpdate?: () => void
  dom?: HTMLElement
  effectStart?: ListNode<any[] | null>
  effectEnd?: ListNode<any[] | null>
  memoStart?: ListNode<any>
  memoEnd?: ListNode<any>
  callbackStart?: ListNode<any>
  callbackEnd?: ListNode<any>
  refStart?: ListNode<any>
  refEnd?: ListNode<any>
  contextStart?: ListNode<any>
  contextEnd?: ListNode<any>
  visitor: number
}

interface ListNode<T> {
  value: T
  future?: T
  next?: ListNode<T>
  perv?: ListNode<T>
}

interface HashHistory {
  hash: string,
  listen: (func: (e: Event) => void) => void
  unListen:(func: (e: Event) => void) => void
}

interface BrowserHistory {
  path: string
  listen: (func: (e: Event) => void) => void
  unListen:(func: (e: Event) => void) => void
}

interface Provider<T> {
  (props: ProviderProps<T>): any
}
interface Consumer<T> {
  (props: ConsumerProps<T>): any
}

interface Context<T> {
  Provider: Provider<T>,
  Consumer: Consumer<T>,
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
  RefObject,
  Ref,
  Container,
  AwesomeElement,
  ChildrenNode,
  FunctionComponent,
  FunctionComponentElement,
  Attributes,
  VDom,
  ListNode,
  Component,
  Provider,
  Consumer,
  Context,
  ProviderProps,
  ConsumerProps,
  HashHistory,
  BrowserHistory,
};
