import * as Awesome from '@/types';
import AwesomeDOM from '@/awesome-dom';
import AwesomeReconciler from '@/awesome-reconciler';
import {AwesomeType, Fragment} from '@/const';

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
function createElement<P extends {}>(
  type: Awesome.FunctionComponent<P>,
  props?: Awesome.Attributes & P | null,
  ...children: Awesome.Node[]): Awesome.FunctionComponentElement<P>;

function createElement<P1 extends Awesome.HTMLAttributes<T1>, T1 extends HTMLElement, P2 extends Awesome.SVGAttributes<T2>, T2 extends Awesome.SVGElement, P3 extends Awesome.DOMAttributes<T3>, T3 extends Element, P4 extends {
  children: Awesome.Node[]
}>(
    type: 'input' | keyof (Awesome.NodeType | Awesome.SVG) | Awesome.FunctionComponent<P4> | symbol | string,
    props?: (Awesome.InputHTMLAttributes & Awesome.ClassAttributes<HTMLInputElement>) | (Awesome.ClassAttributes<T1> & P1) | (Awesome.ClassAttributes<T2> & P2) | (Awesome.ClassAttributes<T3> & P3) | (Awesome.Attributes & P4) | null,
    ...children: Awesome.Node[]
): Awesome.DetailedAwesomeHTMLElement<Awesome.InputHTMLAttributes, HTMLInputElement> | Awesome.DetailedAwesomeHTMLElement<P1, T1> | Awesome.SVGElement | Awesome.DOMElement<P3, T3> | Awesome.FunctionComponentElement<P4> {
  const _return: any = {
    key: null,
    ref: null,
    props: {},
    type,
  };

  if (props) {
    if (props.key) {
      _return.key = props.key;
      delete props.key;
    }

    if ('ref' in props) {
      _return.ref = props.ref;
      delete props.ref;
    }
  }
  if (children && children.length > 0) {
    props = props || {};
    props.children = children;
  }
  _return.props = props as any;

  Object.defineProperty(_return, '$$type', {
    value: AwesomeType,
    enumerable: false,
    configurable: false,
  });

  return _return as Awesome.DetailedAwesomeHTMLElement<Awesome.InputHTMLAttributes, HTMLInputElement> | Awesome.DetailedAwesomeHTMLElement<P1, T1> | Awesome.SVGElement | Awesome.DOMElement<P3, T3> | Awesome.FunctionComponentElement<P4>;
}


function useState<T>(initial: T | (() => T)): [T, (val: T) => void] {
  const {state, appendState} = AwesomeReconciler.dispatchState();

  if (state.value == null) {
    if (typeof initial === 'function') {
      state.value = (initial as Function)();
    } else {
      state.value = initial;
    }
    state.future = state.value;
  }

  const set = (function(_: Awesome.ListNode<T>) {
    return (val: T) => {
      if (_.value === val) return;
      _.future = val;
      const root = AwesomeReconciler.dispatchRoot();
      const cur = {...root};
      cur.children = [];
      AwesomeReconciler.rebuild(root.children[0], cur, 0);
      root.children = cur.children;
      console.log(root);
    };
  })(state);

  appendState(state);

  return [state.value, set];
}

function useEffect(cb: () => (() => void) | void, dependencies: any[]) {
  const {effectHooks, appendEffect} = AwesomeReconciler.dispatchEffect();
  if (effectHooks.value == null) {
    effectHooks.value = [cb()].concat(dependencies);
  } else {
    for (let i = 1; i < effectHooks.value.length; ++ i) {
      if (effectHooks.value[i] !== dependencies[i - 1]) {
        if (effectHooks.value[0]) {
          effectHooks.value[0]();
        }
        effectHooks.value= [cb()].concat(dependencies);
      }
    }
  }

  appendEffect(effectHooks);
}

export default {
  createElement,
  useState,
  useEffect,
  Fragment,
};

export {
  createElement,
  useState,
  useEffect,
  Fragment,
};
