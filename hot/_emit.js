'use strict';

function emit(e){var o=new WebSocket("ws://localhost:".concat(e,"/hmr")),n=new Map;o.onopen=function(){console.log("HMR is running!");},o.onmessage=function(e){JSON.parse(e.data).map((function(e){var o=document.createElement("script"),t=n.get(e.key);t&&(t.remove(),t=null,n.delete(e.key)),o.type="module",o.src="./".concat(e.value,"?date=").concat(Date.now()),document.body.append(o),n.set(e.key,o);}));},o.onclose=function(){console.log("HMR is closed");},o.onerror=function(){console.error("HMR is broken");};}

module.exports = emit;
