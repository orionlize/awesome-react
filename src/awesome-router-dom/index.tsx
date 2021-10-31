import * as AwesomeTypes from '@/types';
import {registerEvent} from '@/utils';

const history: AwesomeTypes.HashHistory & AwesomeTypes.BrowserHistory = {} as AwesomeTypes.HashHistory & AwesomeTypes.BrowserHistory;

function hashListener(listener: (e: Event) => void) {
  window.addEventListener('hashchange', listener);
}

function removeHashListener(listener: (e: Event) => void) {
  window.removeEventListener('hashchange', listener);
}

function createHashHistory(_history: string) {
  history.hash = _history;
  history.listen = hashListener;
  history.unListen = removeHashListener;
  return history;
}

function browserListener(listener: (e: Event) => void) {
  const _pushState = registerEvent('pushState');
  const _replaceState = registerEvent('replaceState');
  window.history.pushState = _pushState;
  window.history.replaceState = _replaceState;
  window.addEventListener('popstate', listener);
  window.addEventListener('pushstate', listener);
  window.addEventListener('replacestate', listener);
}

function removeBrowserListener(listener: (e: Event) => void) {
  window.removeEventListener('popstate', listener);
  window.removeEventListener('pushstate', listener);
  window.removeEventListener('replacestate', listener);
}

function createBrowserHistory(_history: string) {
  history.path = _history;
  history.listen = browserListener;
  history.unListen = removeBrowserListener;
  return history;
}

function push(url: string) {
  if ('hash' in history) {
    window.history.pushState(null, '', `#${url}`);
  } else {
    window.history.pushState(null, '', url);
  }
}

function replace(url: string) {
  if ('hash' in history) {
    window.history.replaceState(null, '', `#${url}`);
  } else {
    window.history.replaceState(null, '', url);
  }
}

function forward() {
  window.history.forward();
}

function back() {
  window.history.back();
}

function go(delta: number) {
  window.history.go(delta);
}

function getUrl() {
  if ('hash' in history) {
    return window.location.hash;
  } else {
    return window.location.pathname;
  }
}

export default {
  createHashHistory,
  createBrowserHistory,
  push,
  replace,
  forward,
  back,
  go,
  getUrl,
};

export {
  createHashHistory,
  createBrowserHistory,
  push,
  replace,
  forward,
  back,
  go,
  getUrl,
};
