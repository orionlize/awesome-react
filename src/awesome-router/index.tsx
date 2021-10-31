import Awesome from '@/awesome';
import * as AwesomeTypes from '@/types';
import {AwesomeComponent} from '@/component';
import {createHashHistory, createBrowserHistory, getUrl} from '@/awesome-router-dom';

const Context = Awesome.createContext('');

class HashRouter extends AwesomeComponent<{}, {
  hash: string
}> {
  state = {
    hash: '',
  }
  history = createHashHistory(this.state.hash);

  hashChange = () => {
    this.setState({
      hash: getUrl(),
    });
  }

  componentDidMount() {
    this.hashChange();
    this.history.listen(this.hashChange);
  }

  componentWillUnmount() {
    this.history.unListen(this.hashChange);
  }

  render() {
    const {hash} = this.state;
    return <Context.Provider value={hash}>
      {this.props.children}
    </Context.Provider>;
  }
}

class BrowserRouter extends AwesomeComponent<{}, {
  path: string
}> {
  state = {
    path: '',
  }

  history = createBrowserHistory(this.state.path);

  pathChange = () => {
    this.setState({
      path: getUrl(),
    });
  }

  componentDidMount() {
    this.pathChange();
    this.history.listen(this.pathChange);
  }

  componentWillUnmount() {
    this.history.unListen(this.pathChange);
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
    let find = false;
    return (this.props.children as AwesomeTypes.ChildrenNode[]).map((child) => {
      if (!find && typeof child === 'object' && 'props' in child) {
        const {exact, path} = child.props;
        if (exact ? this.context === path : path.includes(this.context)) {
          find = true;
          return child;
        }
      }
      return null;
    });
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
    if (Reflect.has(e, 'cache')) {
      const LazyComponent = Reflect.get(e, 'cache');
      this.setState({
        element: <LazyComponent />,
      });
    } else {
      e().then((res: {default: Function}) => {
        Reflect.set(e, 'cache', res.default);
        this.setState({
          element: <res.default />,
        });
      });
    }
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
