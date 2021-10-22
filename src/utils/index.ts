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
      findParent(newNode).dom?.insertBefore(newNode.dom, first);
      return;
    }
  }

  if (parent.dom instanceof DocumentFragment && parent.parent) {
    appendNextNode(newNode, parent.parent, parent.visitor + 1);
  } else {
    parent.dom?.appendChild(newNode.dom);
  }
}

export {
  appendNextNode,
};
