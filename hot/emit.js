export default function emit(port) {
  const ws = new WebSocket(`ws://localhost:${port}/hmr`);
  ws.onopen = () => {
    console.log('HMR opened!');
  };
  ws.onmessage = (e) => {
    const arr = JSON.parse(e.data);
    const scripts = document.querySelectorAll('script');
    for (let i = 0; i < arr.length; ++ i) {
      let script = document.createElement('script');
      if (scripts.length - 1 >= i + 1) {
        scripts[i + 1].remove();
        script.src = arr[i];
        document.body.append(script);
      } else {
        scripts.src = arr[i];
        document.body.append(script);
      }
      script = null;
    }
  };
  ws.onclose = () => {
    console.log('HMR closed');
  };
  ws.onerror = () => {
    console.error('HMR error');
  };
}
