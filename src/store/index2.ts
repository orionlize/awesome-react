import Awesome from '@/awesome';
import {observable} from '@/awesome-mobx';

class Store2 {
  @observable b = 100
}

export default Awesome.createContext(new Store2());
export {
  Store2,
};
