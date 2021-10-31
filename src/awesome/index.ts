import * as AwesomeTypes from '@/types';
import {dispatchEffect, dispatchRoot, dispatchState, dispatchRef, dispatchMemo, dispatchCallback, dispatchContext} from '@/node';
import {AwesomeType, AwesomeFragment} from '@/const';
import {Consumer, Provider} from '@/component';

function createElement(
  type: 'input',
  props?: AwesomeTypes.InputHTMLAttributes & AwesomeTypes.ClassAttributes<HTMLInputElement> | null,
  ...children: AwesomeTypes.Node[]): AwesomeTypes.DetailedAwesomeHTMLElement<AwesomeTypes.InputHTMLAttributes, HTMLInputElement>;
function createElement<P extends AwesomeTypes.HTMLAttributes<T>, T extends HTMLElement>(
  type: keyof AwesomeTypes.NodeType,
  props?: AwesomeTypes.ClassAttributes<T> & P | null,
  ...children: AwesomeTypes.Node[]): AwesomeTypes.DetailedAwesomeHTMLElement<P, T>;
function createElement<P extends AwesomeTypes.SVGAttributes<T>, T extends AwesomeTypes.SVGElement>(
  type: keyof AwesomeTypes.SVG,
  props?: AwesomeTypes.ClassAttributes<T> & P | null,
  ...children: AwesomeTypes.Node[]): AwesomeTypes.SVGElement;
function createElement<P extends AwesomeTypes.DOMAttributes<T>, T extends Element>(
  type: string,
  props?: AwesomeTypes.ClassAttributes<T> & P | null,
  ...children: AwesomeTypes.Node[]): AwesomeTypes.DOMElement<P, T>;
function createElement<P extends {}>(
  type: AwesomeTypes.FunctionComponent<P>,
  props?: AwesomeTypes.Attributes & P | null,
  ...children: AwesomeTypes.Node[]): AwesomeTypes.FunctionComponentElement<P>;

function createElement<P1 extends AwesomeTypes.HTMLAttributes<T1>, T1 extends HTMLElement, P2 extends AwesomeTypes.SVGAttributes<T2>, T2 extends AwesomeTypes.SVGElement, P3 extends AwesomeTypes.DOMAttributes<T3>, T3 extends Element, P4 extends {
  children: AwesomeTypes.Node[]
}>(
    type: 'input' | keyof (AwesomeTypes.NodeType | AwesomeTypes.SVG) | AwesomeTypes.FunctionComponent<P4> | symbol | string,
    props?: (AwesomeTypes.InputHTMLAttributes & AwesomeTypes.ClassAttributes<HTMLInputElement>) | (AwesomeTypes.ClassAttributes<T1> & P1) | (AwesomeTypes.ClassAttributes<T2> & P2) | (AwesomeTypes.ClassAttributes<T3> & P3) | (AwesomeTypes.Attributes & P4) | null,
    ...children: AwesomeTypes.Node[]
): AwesomeTypes.DetailedAwesomeHTMLElement<AwesomeTypes.InputHTMLAttributes, HTMLInputElement> | AwesomeTypes.DetailedAwesomeHTMLElement<P1, T1> | AwesomeTypes.SVGElement | AwesomeTypes.DOMElement<P3, T3> | AwesomeTypes.FunctionComponentElement<P4> {
  const _return: any = {
    props: {},
    type,
  };

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

  return _return as AwesomeTypes.DetailedAwesomeHTMLElement<AwesomeTypes.InputHTMLAttributes, HTMLInputElement> | AwesomeTypes.DetailedAwesomeHTMLElement<P1, T1> | AwesomeTypes.SVGElement | AwesomeTypes.DOMElement<P3, T3> | AwesomeTypes.FunctionComponentElement<P4>;
}

function createRef<T>() {
  const ref = (node: T) => {
    Object.defineProperty(ref, 'current', {
      value: node,
      configurable: true,
    });
  };
  Object.defineProperty(ref, 'current', {
    value: null,
    configurable: true,
  });

  return ref as unknown as AwesomeTypes.RefObject<T>;
}

function createContext<T = any>(value: T) {
  const _providerClass = class ProviderInstance extends Provider<T> {};
  const _consumerClass = class ConsumerInstance extends Consumer<T> {};

  const context = {
    Provider: _providerClass,
    Consumer: _consumerClass,
  } as unknown as AwesomeTypes.Context<T>;

  if (value) {
    Reflect.set(_providerClass, 'value', value);
  }
  _consumerClass.contextType = context;

  return context;
}


function defaultCompare<P extends {}>(props: P, nextProps: P): boolean {
  const keys = Object.keys(props);
  const nextKeys = Object.keys(nextProps);

  if (keys.length !== nextKeys.length) {
    return true;
  } else {
    for (const key in keys) {
      if (Reflect.get(props, key) !== Reflect.get(nextKeys, key)) {
        return true;
      }
    }
  }

  return false;
}

function memo<P>(fc: Function, compare?: (props: P, nextProps: P) => boolean) {
  const diff = compare || defaultCompare;
  Object.defineProperty(fc, 'compare', {
    value: diff,
    configurable: false,
  });

  return fc;
}

function useState<T>(initial: T | (() => T)): [T, (val: T) => void] {
  const {getState, appendState} = dispatchState();
  const state = getState();

  if (state.value == null) {
    if (typeof initial === 'function') {
      state.value = (initial as Function)();
    } else {
      state.value = initial;
    }
    state.future = state.value;
  }

  const set = (function(_: AwesomeTypes.ListNode<T>) {
    return (val: T) => {
      if (_.value === val) return;
      _.future = val;
      dispatchRoot().dispatchUpdate!();
    };
  })(state);

  appendState(state);

  return [state.value, set];
}

function useEffect(cb: () => (() => void) | void, dependencies?: any[]) {
  const {getEffectHooks, appendEffect} = dispatchEffect();
  const effectHooks = getEffectHooks();

  if (effectHooks.value == null) {
    effectHooks.value = [cb].concat(dependencies || []);
  } else {
    if (Array.isArray(dependencies)) {
      for (let i = 1; i < effectHooks.value.length; ++ i) {
        if (effectHooks.value[i] !== dependencies[i - 1]) {
          if (effectHooks.value[0]) {
            effectHooks.value[0]();
          }
          effectHooks.value= [cb()].concat(dependencies);
        }
      }
    } else {
      effectHooks.value= [cb()].concat(dependencies);
    }
  }

  appendEffect(effectHooks);
}

function useMemo<T>(cb: () => (() => T) | T, dependencies?: any[]) {
  const {getMemo, appendMemo} = dispatchMemo();
  const memo = getMemo();

  if (memo.value == null) {
    memo.value = [cb()].concat(dependencies || []);
  } else {
    if (Array.isArray(dependencies)) {
      for (let i = 1; i < memo.value.length; ++ i) {
        if (memo.value[i] !== dependencies[i - 1]) {
          memo.value= [cb()].concat(dependencies);
        }
      }
    } else {
      memo.value = [cb()].concat(dependencies || []);
    }
  }

  appendMemo(memo);
  return memo.value[0];
}

function useCallback<T>(cb: () => (() => T) | T, dependencies?: any[]) {
  const {getCallback, appendCallback} = dispatchCallback();
  const callback = getCallback();

  if (callback.value == null) {
    callback.value = [cb].concat(dependencies || []);
  } else {
    if (Array.isArray(dependencies)) {
      for (let i = 1; i < callback.value.length; ++ i) {
        if (callback.value[i] !== dependencies[i - 1]) {
          callback.value= [cb].concat(dependencies || []);
        }
      }
    } else {
      callback.value = [cb].concat(dependencies || []);
    }
  }

  appendCallback(callback);
  return callback.value[0];
}

function useRef<T>():AwesomeTypes.RefObject<T> {
  const {getRef, appendRef} = dispatchRef();
  const ref = getRef();

  if (ref.value == null) {
    ref.value = createRef<T>();
  }

  appendRef(ref);
  return ref.value;
}

function useContext<T>(_context: AwesomeTypes.Context<T>) {
  const {getContext, appendContext} = dispatchContext();
  const context = getContext();

  if (context.value == null) {
    context.value = _context;
  }

  appendContext(context);
  return Reflect.get(context.value.Provider, 'value') as T;
}

export default {
  createElement,
  createRef,
  createContext,
  memo,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
  AwesomeFragment,
};

export {
  createElement,
  createRef,
  createContext,
  memo,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
  AwesomeFragment,
};
