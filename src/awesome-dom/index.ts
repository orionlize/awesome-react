import * as AwesomeTypes from '@/types';
import AwesomeReconciler from '@/awesome-reconciler';
import {createRoot} from '@/node';
import {cancelHostCallback, requestHostCallback} from '@/utils';

function render(
    element: AwesomeTypes.DOMElement<AwesomeTypes.DOMAttributes<Element>, Element> | AwesomeTypes.AwesomeElement | AwesomeTypes.Node,
    container: AwesomeTypes.Container | null,
    callback?: () => void) {
  if (container) {
    while (container.childNodes.length) {
      container.childNodes[0].remove();
    }
  }
  const root = createRoot(container);
  let isDispatching: boolean = false;
  root.dispatchUpdate = function() {
    if (!isDispatching) {
      isDispatching = requestHostCallback(() => {
        const cur: AwesomeTypes.VDom = {...root};

        cur.children = [];

        AwesomeReconciler.rebuild((root.children as AwesomeTypes.VDom[])[0], cur, 0);
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
    AwesomeReconciler.renderElement((root.children as AwesomeTypes.VDom[])[0], root.dom!);
    // console.log(root);
  }

  callback && callback();
}

export default {
  render,
};
