export default function emit(port) {
  const ws = new WebSocket(`ws://localhost:${port}/hmr`);
  const map = new Map();

  ws.onopen = () => {
    console.log('HMR is running!');
  };
  ws.onmessage = (e) => {
    const arr = JSON.parse(e.data);
    for (let i = 0; i < arr.length; ++ i) {
      const script = document.createElement('script');
      let oldScript = map.get(e.data[i]);
      if (oldScript) {
        oldScript.remove();
        oldScript = null;
        map.delete(e.data[i]);
      }

      script.src = arr[i];
      document.body.append(script);
      map.set(e.data[i], script);
    }
  };
  ws.onclose = () => {
    console.log('HMR is closed');
  };
  ws.onerror = () => {
    console.error('HMR is broken');
  };
}
