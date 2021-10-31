import Awesome from '@/awesome';
import {observable, computed} from '@/awesome-mobx';

class Store {
  @observable a = 10

  @computed get computedA() {
    return this.a * 2;
  }
}

const store = Awesome.createContext(new Store());

export default store;
