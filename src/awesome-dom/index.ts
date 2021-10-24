import * as Awesome from '@/types';
import AwesomeReconciler from '@/awesome-reconciler';
import {cancelHostCallback, requestHostCallback} from '@/utils';

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
  let isDispatching: boolean = false;
  root.dispatchUpdate = function() {
    if (!isDispatching) {
      isDispatching = requestHostCallback(() => {
        const cur: Awesome.VDom = {...root};

        cur.children = [];

        AwesomeReconciler.rebuild((root.children as Awesome.VDom[])[0], cur, 0);
        root.children = cur.children;
        root.patches = [];
        // console.log(root);

        isDispatching = false;
      }, 500);
    } else {
      cancelHostCallback();
      isDispatching = false;
      root.dispatchUpdate!();
    }
  };
  AwesomeReconciler.build(element, root);
  if (container) {
    AwesomeReconciler.renderElement((root.children as Awesome.VDom[])[0], root);
    console.log(root);
  }

  callback && callback();
}

export default {
  render,
};
