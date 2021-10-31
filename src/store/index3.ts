import Awesome from '@/awesome';
import {observable, computed} from '@/awesome-mobx';

class Store3 {
  @observable a = 10

  @computed get computedA() {
    return this.a * 2;
  }
}

export default Awesome.createContext(new Store3());

export {
  Store3,
};
