import Awesome from './awesome/index';
import AwesomeDOM from './awesome-dom/index';
import {CSSProperties} from 'react';
import {AwesomeComponent} from './component';

function App(props: {data: string, style: CSSProperties}) {
  return <div>
    {
      new Array(10).fill(0).map(() => {
        return <div style={props.style}>
        456
          <div>{props.data}</div>
        </div>;
      })
    }
  </div>;
}

class Bpp extends AwesomeComponent<{data: string, style: CSSProperties}, {}> {
  constructor(props: any) {
    super(props);
  }

  render() {
    const {data, style} = this.props;

    return <div>
      {
        new Array(10).fill(0).map(() => {
          return <div style={style}>
        456
            <div>{data}</div>
          </div>;
        })
      }
    </div>;
  }
}

AwesomeDOM.render(<App style={{fontSize: '25px', color: 'red'}} data='123'>12356</App>, document.getElementById('root'));
