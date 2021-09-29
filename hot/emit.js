export default function emit (port) {
  const ws = new WebSocket(`ws://localhost:${port}/hmr`)
  ws.onopen = () => {
    console.log('HMR opened!')
  }
  ws.onmessage = (e) => {
    console.log(e.data)
  }
  ws.onclose = () => {
    console.log('HMR closed')
  }
  ws.onerror = () => {
    console.error('HMR error')
  }
}