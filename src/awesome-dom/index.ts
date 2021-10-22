import * as Awesome from '@/types';
import AwesomeReconciler from '@/awesome-reconciler';
import {Fragment} from '@/const';

function render(
    element: Awesome.DOMElement<Awesome.DOMAttributes<Element>, Element> | Awesome.AwesomeElement | Awesome.Node,
    container: Awesome.Container | null,
    callback?: () => void) {
  if (container) {
    while (container.childNodes.length) {
      container.childNodes[0].remove();
    }
  }
  const root = AwesomeReconciler.createRoot(container);
  AwesomeReconciler.build(element, root);
  let isDispatching: null | number = null;
  root.dispatchUpdate = function() {
    if (!isDispatching) {
      isDispatching = setTimeout(() => {
        const cur: Awesome.VDom = {...root};

        cur.children = [];

        AwesomeReconciler.rebuild((root.children as Awesome.VDom[])[0], cur, 0);
        root.children = cur.children;
        root.patches = [];
        console.log(root);

        isDispatching = null;
      }, 0);
    } else {
      clearTimeout(isDispatching);
      isDispatching = null;
      root.dispatchUpdate!();
    }
  };
  if (container) {
    AwesomeReconciler.renderElement((root.children as Awesome.VDom[])[0], root);
    console.log(root);
  }

  callback && callback();
}

export default {
  render,
};
