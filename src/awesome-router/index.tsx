import Awesome from '@/awesome';
import * as AwesomeTypes from '@/types';
import {AwesomeComponent} from '@/component';
import {registerEvent} from '@/utils';

const Context = Awesome.createContext('/');

class HashRouter extends AwesomeComponent<{}, {
  hash?: string
}> {
  state = {
    hash: undefined,
  }

  hashChange = () => {
    this.setState({
      hash: window.location.hash.slice(1),
    });
  }

  componentDidMount() {
    this.hashChange();
    window.addEventListener('hashchange', this.hashChange);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.hashChange);
  }

  render() {
    const {hash} = this.state;
    return <Context.Provider value={hash}>
      {this.props.children}
    </Context.Provider>;
  }
}

class BrowserRouter extends AwesomeComponent<{}, {
  path?: string
}> {
  state = {
    path: undefined,
  }

  pathChange = () => {
    this.setState({
      path: window.location.pathname,
    });
  }

  componentDidMount() {
    this.pathChange();

    const _pushState = registerEvent('pushState');
    const _replaceState = registerEvent('replaceState');
    window.history.pushState = _pushState;
    window.history.replaceState = _replaceState;
    window.addEventListener('popstate', this.pathChange);
    window.addEventListener('pushstate', this.pathChange);
    window.addEventListener('replacestate', this.pathChange);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.pathChange);
    window.removeEventListener('pushstate', this.pathChange);
    window.removeEventListener('replacestate', this.pathChange);
  }

  render() {
    const {path} = this.state;

    return <Context.Provider value={path}>
      {this.props.children}
    </Context.Provider>;
  }
}

class Switch extends AwesomeComponent<{
  children: AwesomeTypes.ChildrenNode[] | AwesomeTypes.ChildrenNode
}> {
  static contextType = Context;

  render() {
    return this.props.children;
  }
}

class Route extends AwesomeComponent<{
  exact?: boolean
  path: string
  component: Function,
}, {
  element: AwesomeTypes.Node
}> {
  static contextType = Context;

  componentDidCatch(e: any) {
    console.log(e);
    e().then((res: {default: Function}) => {
      this.setState({
        element: <res.default />,
      });
    });
  }

  render() {
    const {path, exact, component: RouteComponent} = this.props;
    const {element} = this.state;

    const visible = exact ? this.context === path : path.includes(this.context);
    return <>
      {
        (visible && element) || (visible && <RouteComponent />)
      }
    </>;
  }
}

export {
  HashRouter,
  Switch,
  Route,
  BrowserRouter,
};
