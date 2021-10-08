import Awesome from './awesome/index';
import AwesomeDOM from './awesome-dom/index';
import {CSSProperties} from 'react';
import {AwesomeComponent} from './component';
import {ChildrenNode} from './types';

function App(props: {data: string, style: CSSProperties, children: ChildrenNode}) {
  return <div>
    {
      new Array(10).fill(0).map((_, index) => {
        return <div key={index} style={props.style}>
        456
          <div>{props.data}</div>
        </div>;
      })
    }
  </div>;
}

class Bpp extends AwesomeComponent<{}, {}, {}> {
  state = {
    data: 0,
  }

  render() {
    const {data} = this.state;

    return <div>
      <div onClick={() => {
        this.setState({
          data: data + 4,
        });
      }}>123</div>
      <>
        {
          new Array(1000).fill(0).map(() => <div style={{transition: 'all 0.5s linear', marginTop: `${data}px`}}>456</div>)
        }
      </>
    </div>;
  }
}

AwesomeDOM.render(<Bpp></Bpp>, document.getElementById('root'));
// console.log(AwesomeDOM.build(<App style={{fontSize: '25px', color: 'red'}} data='123'>12356</App>, null, 0));
