import Awesome from '@/awesome';
import * as AwesomeTypes from '@/types'
import {AwesomeComponent} from '@/component';

const Context = Awesome.createContext('/');

class HashRouter extends AwesomeComponent<{}, {
  hash: string
}> {
  state = {
    hash: '/',
  }

  render() {
    const {hash} = this.state;
    return <Context.Provider value={hash}>
      {this.props.children}
    </Context.Provider>;
  }
}

class Switch extends AwesomeComponent<{
  children: awe
}> {
  static contextType = Context;

  render() {
    return this.props.children ? (this.props.children as Array)
  }
}

export {
  HashRouter,
};
