'use strict';

function emit(e){var n=new WebSocket("ws://localhost:".concat(e,"/hmr")),o=new Map;n.onopen=function(){console.log("HMR is running!");},n.onmessage=function(e){JSON.parse(e.data).map((function(e){var n=document.createElement("script"),t=o.get(e.key);t&&(t.remove(),t=null,o.delete(e.key)),n.src="https://unpkg.com/requirejs@2.3.6/require.js",n.setAttribute("data-main",e.value),document.body.append(n),o.set(e.key,n);}));},n.onclose=function(){console.log("HMR is closed");},n.onerror=function(){console.error("HMR is broken");};}

module.exports = emit;
