import Awesome from '@/awesome';
import {push} from '@/awesome-router-dom';

export default function Index() {
  return <>
    {/* <a href='#/child'>click</a> */}
    <button onClick={() => {
      push('/child');
    }}>click</button>
    <div>Index</div>
  </>;
}
