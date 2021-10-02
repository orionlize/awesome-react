import * as Awesome from '@/types';


export class AwesomeComponent<P extends {[key: string]: any}, T extends {[key: string]: any}> {
    static readonly _isClass = true

  props: P
  state: T | null = null
  constructor(props: P) {
    this.props = props;
  }

  render(): Awesome.Node {
    return null;
  }
}
