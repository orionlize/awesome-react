import Awesome from './awesome/index';
import AwesomeDOM from './awesome-dom/index';
import {AwesomeComponent, lazy, Suspense} from './component';

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
}, {
  size: number
}, {}> {
  state = {
    size: 20,
  }
  componentDidMount() {
    console.log('==========componentDidMount-----Cpp');
    throw (new Error('123'));
  }

  componentDidUpdate() {
    console.log('==========componentDidUpdate-----Cpp');
  }

  componentWillUnmount() {
    console.log('==========componentWillUnmount-----Cpp');
  }

  render() {
    const {data, cb, children} = this.props;
    const {size} = this.state;

    return <div style={{fontSize: `${size}px`}} onClick={() => {
      cb(Date.now());
      this.setState({
        size: size + 1,
      });
    }}>{data}-{children}</div>;
  }
}

class Bpp extends AwesomeComponent<{}, {}, {}> {
  state = {
    data: Date.now(),
    show: false,
  }

  componentDidCatch(e: any) {
    console.log(e);
  }

  componentDidMount() {
    console.log(this.ref.current);
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

  change2 = () => {
    const {show} = this.state;
    this.setState({
      show: !show,
    });
  }

  ref = Awesome.createRef<HTMLDivElement>();

  render() {
    const {data, show} = this.state;

    return <div ref={this.ref}>
      <h1 onClick={this.change2}>{data}</h1>
      {
        show && new Array(10).fill(0).map((_, index) => <Cpp cb={this.change} data={data}>
          123
        </Cpp>)
      }
      <App />
      <App></App>
    </div>;
  }
}

function FC(props: {data: number}) {
  return <div>
    {
      props.data
    }
  </div>;
}

const PureFC = Awesome.memo<{data: number}>(FC, (props, nextProps) => {
  return nextProps.data - props.data > 5;
});

function Test() {
  const [state, setState] = Awesome.useState(0);
  const ref = Awesome.useRef<HTMLButtonElement>();
  const callback = Awesome.useCallback(() => {
    console.log(ref.current);
    setState(state + 1);
  }, [state]);

  const result = Awesome.useMemo(() => {
    return state + 10;
  }, [state]);

  return <>
    <button ref={ref} onClick={callback}>click</button>
    {
      state >= 1 && <PureFC data={result}></PureFC>
    }
    {
      state >= 2 && <PureFC data={result}></PureFC>
    }
    {
      state >= 3 && <PureFC data={result}></PureFC>
    }
  </>;
}

function Node(props: {
  children: any[]
}) {
  const [size, setSize] = Awesome.useState(10);
  const [margin, setMargin] = Awesome.useState(10);

  Awesome.useEffect(() => {
    let size = 10;
    let margin = 10;
    let sub = false;
    const anim = () => {
      if (margin > 40) {
        sub = true;
      } else if (margin === 10) {
        sub = false;
      }

      if (sub) {
        setMargin(-- margin);
        setSize(-- size);
      } else {
        setMargin(++ margin);
        setSize(++ size);
      }
      window.requestAnimationFrame(anim);
    };

    window.requestAnimationFrame(anim);
  }, []);

  return <div style={{width: `${size}px`, height: `${size}px`, background: 'red', margin: `${margin}px`}}>
    {props.children}
  </div>;
}


function tree(i: number) {
  if (i < 8) {
    return <Node>
      {
        new Array(Math.pow(2, 1)).fill(0).map(() => {
          return tree(i + 1);
        })
      }
    </Node>;
  } else {
    return null;
  }
}
function Example() {
  return <>
    <div style={{width: 500}}>
      <Node>
        {tree(0)}
      </Node>
    </div>
  </>;
}

const LazyNode = lazy(() => import('@/page/index'));

AwesomeDOM.render(
    <>
      {/* {
        <>
          {
            new Array(2).fill(0).map(() =>
              <Example />,
            )
          }
        </>
      } */}
      {/* <App />
      <Bpp />
      <Test /> */}
      <Suspense fallback={<div>loading...</div>}>
        <LazyNode />
      </Suspense>
    </>, document.getElementById('root'));
// console.log(AwesomeDOM.build(<App style={{fontSize: '25px', color: 'red'}} data='123'>12356</App>, null, 0));
