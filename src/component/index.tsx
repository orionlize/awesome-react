// import {Map as createMap, is as equal} from 'immutable';
import {dispatchRoot} from '@/node';
import * as AwesomeTypes from '@/types';
import Awesome, {createContext} from '@/awesome';

class CommonComponent <P = {}, S = {}, SS = {}> implements AwesomeTypes.Component<P, S, SS> {
  static defaultProps?: {[key: string]: any}
  props: P extends {children: (value: any) => AwesomeTypes.ChildrenNode | ((value: any) => AwesomeTypes.ChildrenNode)[]} ? P : P & {children?: AwesomeTypes.ChildrenNode | AwesomeTypes.ChildrenNode[]}
  state: S = {} as S
  context: any
  refs: any
  setState(_state: S) {}
  forceUpdate() {}

  _node?: AwesomeTypes.VDom
  _updated?: boolean

  constructor(props: P) {
    const _props = {} as P extends {children: (value: any) => AwesomeTypes.ChildrenNode | ((value: any) => AwesomeTypes.ChildrenNode)[]} ? P : P & {children?: AwesomeTypes.ChildrenNode | AwesomeTypes.ChildrenNode[]};
    const __proto__ = Reflect.get(this, '__proto__');
    if (__proto__.constructor.defaultProps) {
      Object.assign(_props, __proto__.constructor.defaultProps);
    }
    if (props) {
      Object.assign(_props, props);
    }
    this.props = _props;
  }

  render(): AwesomeTypes.Node {
    return null;
  }
}

class AwesomeComponent<P = {}, S = {}, SS = {}> extends CommonComponent<P, S, SS> {
  static defaultProps?: {[key: string]: any}
  // @ts-ignore
  static contextType?: ReturnType<typeof createContext>

  setState(_state: S) {
    this._node?.patches!.push({
      state: _state,
    });

    dispatchRoot().dispatchUpdate!();
  }
  forceUpdate() {
    this._node!.patches!.push({
      state: {...this.state},
    });
    dispatchRoot().dispatchUpdate!();
  }
  refs: {[key: string]: any} = {}

  constructor(props: P) {
    super(props);
  }

  componentDidCatch?(error: any): void
  getDerivedStateFromError?(): void
  shouldComponentUpdate?(nextProps: P, nextState: S): boolean
  // {
  //   return !equal(createMap(this.props), createMap(nextProps)) || !equal(createMap(this.state), createMap(nextState));
  //   // return true;
  // }
  componentDidMount?(): void
  componentDidUpdate?(): void
  componentWillUnmount?(): void

  render(): AwesomeTypes.Node {
    return null;
  }
}

function lazy(func: () => Promise<any>) {
  return class LazyComponent extends AwesomeComponent {
    componentDidMount() {
      throw func;
    }

    render() {
      return null;
    }
  };
}

class Suspense extends AwesomeComponent<{
  fallback: AwesomeTypes.Node
}, {
  element: AwesomeTypes.Node
}> {
  state = {
    element: null,
  }

  componentDidCatch(e: any) {
    e().then((res: {default: Function}) => {
      this.setState({
        element: <res.default />,
      });
    });
  }

  getDerivedStateFromError() {
    this.setState({
      element: this.props.fallback,
    });
  }

  render() {
    const {children} = this.props;
    const {element} = this.state;

    return <>
      {
        element
      }
      {
        !element && children
      }
    </>;
  }
}

class Provider<T = any> extends CommonComponent<AwesomeTypes.ProviderProps<T>> {
  static defaultProps: any = {
    value: undefined,
  }

  render() {
    return this.props.children;
  }
}

class Consumer<T = any> extends AwesomeComponent<AwesomeTypes.ConsumerProps<T>> {
  render() {
    return (this.props.children as unknown as Array<Function>).map((child) => child(this.context));
  }
}

export {
  CommonComponent,
  AwesomeComponent,
  lazy,
  Suspense,
  Provider,
  Consumer,
};
