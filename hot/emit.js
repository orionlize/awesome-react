export default function emit (port) {
  const ws = new WebSocket(`ws://localhost:${port}/hmr`)
  ws.onopen = () => {
    console.log('HMR opened!')
  }
  ws.onmessage = (e) => {
    let script = document.createElement('script')
    script.src = e.data
    document.body.append(script)
  }
  ws.onclose = () => {
    console.log('HMR closed')
  }
  ws.onerror = () => {
    console.error('HMR error')
  }
}