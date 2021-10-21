function firstChild(doms: HTMLElement | HTMLElement[]): HTMLElement {
  if (Array.isArray(doms)) {
    for (let i = 0; i < doms.length; ++ i) {
      if (doms[i]) {
        return firstChild(doms[i]);
      }
    }
  } else {
    return doms;
  }
  return null as unknown as HTMLElement;
}


export {
  firstChild,
};
