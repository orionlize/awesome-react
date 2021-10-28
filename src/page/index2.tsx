import Awesome from '@/awesome';

export default function Index2() {
  return <>
    {/* <a href='#/'>click</a> */}
    <button onClick={() => {
      window.history.pushState(null, '', '/');
    }}>click</button>
    <div>Index2</div>
  </>;
}
