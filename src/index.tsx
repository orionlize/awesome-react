import Awesome from './awesome/index';
import AwesomeDOM from './awesome-dom/index';
import {AwesomeComponent} from './component';

function App() {
  const [n, setN] = Awesome.useState(5);
  const [n1, setN1] = Awesome.useState(5);
  const [n2, setN2] = Awesome.useState(5);
  const [show, setShow] = Awesome.useState(true);

  return <div>
    <button onClick={() => {
      setN(n + 1);
    }}>click</button>
    <button onClick={() => {
      setN1(n1 + 1);
    }}>click1</button>
    <button onClick={() => {
      setN2(n2 + 1);
    }}>click2</button>
    <button onClick={() => {
      setShow(!show);
    }}>click3</button>
    <div>{n}-{n1}-{n2}</div>
    {show && <Dpp n={n} />}
  </div>;
}
function Dpp(props: any) {
  Awesome.useEffect(() => {
    console.log('========');

    return () => {
      console.log('--------');
    };
  }, [props.n]);

  return <>
    <button onClick={() => {
    }}>click</button>
    <div>{props.n}</div>
  </>;
}

class Cpp extends AwesomeComponent<{
  data: number
  cb: (update: any) => void
}, {}, {}> {
  componentDidMount() {
    console.log('==========componentDidMount-----Cpp');
  }

  componentDidUpdate() {
    console.log('==========componentDidUpdate-----Cpp');
  }

  componentWillUnmount() {
    console.log('==========componentWillUnmount-----Cpp');
  }

  render() {
    const {data, cb} = this.props;

    return <div onClick={() => {
      cb(Date.now());
    }}>{data}</div>;
  }
}

class Bpp extends AwesomeComponent<{}, {}, {}> {
  state = {
    data: Date.now(),
    show: true,
  }

  componentDidMount() {
    console.log('==========componentDidMount-----Bpp');
  }

  componentDidUpdate() {
    console.log('==========componentDidUpdate-----Bpp');
  }

  change = (update: any) => {
    this.setState({
      data: update,
    });
  }

  render() {
    const {data, show} = this.state;

    return <div>
      <h1 onClick={() => {
        this.setState({
          show: !show,
        });
      }}>{data}</h1>
      {
        show && new Array(10).fill(0).map((_, index) => <Cpp cb={this.change} data={data} />)
      }
      <img style={{width: '250px', height: 'auto'}} src='https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fpic1.zhimg.com%2Fv2-3d0e684c05c81488f916134c4a09e90d_1440w.jpg%3Fsource%3D172ae18b&refer=http%3A%2F%2Fpic1.zhimg.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1636551529&t=3654dee15970cfb3953ff96c73b19e0f' />
    </div>;
  }
}

AwesomeDOM.render(<>
  <App></App>
  <Bpp></Bpp>
</>, document.getElementById('root'));
// console.log(AwesomeDOM.build(<App style={{fontSize: '25px', color: 'red'}} data='123'>12356</App>, null, 0));
