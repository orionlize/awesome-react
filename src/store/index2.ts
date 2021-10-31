import Awesome from '@/awesome';
import {observable} from '@/awesome-mobx';

class Store {
  @observable b = 100
}

export default Awesome.createContext(new Store());
