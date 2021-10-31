import Awesome from '@/awesome';
import {AwesomeComponent} from '@/component';
import {Context} from '@/types';
class Provider<T extends {} = {}> extends AwesomeComponent<{store: T}, {
  store: T
}> {
  _store = Awesome.createContext<{}>(this.props.store)
  state = {
    store: this.props.store,
  }

  constructor(props: any) {
    super(props);
    for (const key in props.store) {
      if (Reflect.has(props.store, key)) {
        if (!Reflect.has(props.store[key].Provider.value, 'update')) {
          Object.defineProperty(props.store[key].Provider.value.__proto__, 'update', {
            value: this.update,
            configurable: false,
            enumerable: true,
          });
        }
      }
    }
  }

  update = () => {
    this.setState({
      store: this.state.store,
    });
  }

  render() {
    const {store} = this.state;

    return <this._store.Provider value={store}>
      {this.props.children}
    </this._store.Provider>;
  }
}

function observer<T>(store: {[key: string]: Context<T>}) {
  const contextType = Object.values(store)[0];
  const attribute = Object.keys(store)[0];

  return function(Target: typeof AwesomeComponent) {
    return class _StoreComponent extends AwesomeComponent<{
      [attribute: string]: T
    }> {
      static contextType = contextType

      render() {
        return <Target {...{[attribute]: this.context}} {...this.props} />;
      }
    };
  };
}

function observable(target: Object, varible: string) {
  let value = Reflect.get(target, varible);
  Object.defineProperty(target, varible, {
    set: function(_value: any) {
      if (value !== _value) {
        value = _value;
        if (Reflect.has(target, 'update')) {
          Reflect.get(target, 'update')();
        }
      }
    },
    get: function() {
      return value;
    },
  });
}

function computed(target: Object, varible: string) {
  const getFunc = Reflect.get(target, varible);
  let oldValue: any = null;
  Object.defineProperty(target, varible, {
    get() {
      const newValue = getFunc();
      if (newValue !== oldValue) {
        oldValue = newValue;
        if (Reflect.has(target, 'update')) {
          Reflect.get(target, 'update')();
        }
      } else {
        return oldValue;
      }
    },
    set() {

    },
  });
}

export default {
  Provider,
  observable,
};

export {
  Provider,
  observer,
  observable,
  computed,
};
