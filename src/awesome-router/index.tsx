import Awesome from '@/awesome';
import * as AwesomeTypes from '@/types';
import {AwesomeComponent} from '@/component';

const Context = Awesome.createContext('/');

class HashRouter extends AwesomeComponent<{}, {
  hash: string
}> {
  state = {
    hash: '/',
  }

  hashChange  = () => {
    this.setState({
      hash: window.location.hash
    })
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.hashChange)
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.hashChange)
  }

  render() {
    const {hash} = this.state;
    return <Context.Provider value={hash}>
      {this.props.children}
    </Context.Provider>;
  }
}

class Switch extends AwesomeComponent<{
  children: AwesomeTypes.ChildrenNode[]
}> {
  static contextType = Context;

  render() {
    return this.props.children ? this.props.children.some((child) => {
      if (child) {
        return child
      }
    })
  }
}

export {
  HashRouter,
};
