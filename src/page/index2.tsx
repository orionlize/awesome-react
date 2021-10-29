import Awesome from '@/awesome';
import {push} from '@/awesome-router-dom';

export default function Index2() {
  return <>
    {/* <a href='#/'>click</a> */}
    <button onClick={() => {
      push('/');
    }}>click</button>
    <div>Index2</div>
  </>;
}
