export default function emit(port) {
  const ws = new WebSocket(`ws://localhost:${port}/hmr`);
  const map = new Map();

  ws.onopen = () => {
    console.log('HMR is running!');
  };
  ws.onmessage = (e) => {
    const scripts = document.head.querySelectorAll('script');
    scripts.forEach((script) => {
      script.remove();
    });
    const arr = JSON.parse(e.data);

    arr.map((js) => {
      const script = document.createElement('script');
      let oldScript = map.get(js.key);
      if (oldScript) {
        oldScript.remove();
        oldScript = null;
        map.delete(js.key);
      }

      script.src = 'https://unpkg.com/requirejs@2.3.6/require.js';
      script.setAttribute('data-main', js.value);
      document.body.append(script);
      map.set(js.key, script);
    });
  };
  ws.onclose = () => {
    console.log('HMR is closed');
  };
  ws.onerror = () => {
    console.error('HMR is broken');
  };
}
