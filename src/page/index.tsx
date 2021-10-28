import Awesome from '@/awesome';

export default function Index() {
  return <>
    {/* <a href='#/child'>click</a> */}
    <button onClick={() => {
      window.history.pushState(null, '', '/child');
    }}>click</button>
    <div>Index</div>
  </>;
}
