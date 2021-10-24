import * as Awesome from '@/types';

function firstChild(node: Awesome.VDom): HTMLElement | null {
  if (node.dom instanceof DocumentFragment) {
    for (const child of node.children) {
      if (typeof child !== 'string') {
        const ret = firstChild(child);
        if (ret) {
          return ret;
        }
      }
    }
    return null;
  } else {
    if (node.dom) {
      return node.dom;
    } else {
      return null;
    }
  }
}

function findParent(node: Awesome.VDom): Awesome.VDom {
  let parent = node.parent;
  while (parent?.dom instanceof DocumentFragment) {
    parent = parent?.parent;
  }

  return parent!;
}


function appendNextNode(
    newNode: Awesome.VDom,
    parent: Awesome.VDom,
    visitor: number,
) {
  for (let i = visitor; i < parent.children.length; ++ i) {
    const first = firstChild(parent.children[i] as Awesome.VDom);
    if (first) {
      findParent(newNode).dom?.insertBefore(newNode.dom!, first);
      return;
    }
  }

  if (parent.dom instanceof DocumentFragment && parent.parent) {
    appendNextNode(newNode, parent.parent, parent.visitor + 1);
  } else {
    parent.dom?.appendChild(newNode.dom!);
  }
}

const AMIMATION_WAITING_TIME = 100;
let rAFID: number;
let rAFTimeoutID: number;

function getCurrentTime() {
  return performance.now();
}

function requestAnimationFrameWithoutTimeout(callback: (timestamp: number) => void) {
  rAFID = requestAnimationFrame(function(timestamp: number) {
    clearTimeout(rAFTimeoutID);
    callback(timestamp);
  });
  rAFTimeoutID = setTimeout(() => {
    cancelAnimationFrame(rAFID);
    callback(getCurrentTime());
  }, AMIMATION_WAITING_TIME) as unknown as number;
}

let scheduledHostCallback: Function | null = null;
let isMessageEventScheduled = false;
let timeoutTime = -1;

let isAnimationFrameScheduled = false;

let isFLushingHostCallback = false;

let frameDeadline = 0;

let previousFrameTime = 33;
let activeFrameTime = 33;

const channel = new MessageChannel();
const port = channel.port2;

channel.port1.onmessage = function(event) {
  isMessageEventScheduled = false;

  const prevScheduledCallback = scheduledHostCallback;
  const prevTimeoutTime = timeoutTime;
  scheduledHostCallback = null;
  timeoutTime = -1;

  const currentTime = getCurrentTime();
  let didTimeout = false;
  if (frameDeadline - currentTime <= 0) {
    if (prevTimeoutTime !== -1 && prevTimeoutTime <= currentTime) {
      didTimeout = true;
    } else {
      if (!isAnimationFrameScheduled) {
        isAnimationFrameScheduled = true;
        requestAnimationFrameWithoutTimeout(animationTick);
      }
      scheduledHostCallback = prevScheduledCallback;
      timeoutTime = prevTimeoutTime;
      return;
    }
  }

  if (prevScheduledCallback !== null) {
    isFLushingHostCallback = true;
    try {
      prevScheduledCallback(didTimeout);
    } finally {
      isFLushingHostCallback = false;
    }
  }
};

function animationTick(timestamp: number) {
  if (scheduledHostCallback) {
    requestAnimationFrameWithoutTimeout(animationTick);
  } else {
    isAnimationFrameScheduled = false;
    return;
  }

  const nextFrameTime = timestamp - frameDeadline + activeFrameTime;
  if (nextFrameTime < activeFrameTime && previousFrameTime < activeFrameTime) {
    activeFrameTime = nextFrameTime < previousFrameTime ? previousFrameTime : nextFrameTime;
  } else {
    previousFrameTime = nextFrameTime;
  }
  frameDeadline = timestamp + activeFrameTime;
  if (!isMessageEventScheduled) {
    isMessageEventScheduled = true;
    port.postMessage(undefined);
  }
}

function requestHostCallback(callback: Function, maxWaiting: number) {
  scheduledHostCallback = callback;
  if (isFLushingHostCallback || maxWaiting < 0) {
    port.postMessage(undefined);
  } else if (!isAnimationFrameScheduled) {
    isAnimationFrameScheduled = true;
    requestAnimationFrameWithoutTimeout(animationTick);
  }

  return true;
}

function cancelHostCallback() {
  scheduledHostCallback = null;
  isMessageEventScheduled = false;
  timeoutTime = -1;
}

export {
  appendNextNode,
  requestHostCallback,
  cancelHostCallback,
};
