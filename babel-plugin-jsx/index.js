module.exports = function({types: t}) {
  return {
    visitor: {
      JSXElement(path) {
        const node = path.node;
        const {openingElement} = node;
        const tagName = openingElement.name.name;
        const attributes = t.objectExpression([]);
        for (const attribute of openingElement.attributes) {
          attributes.properties.push(
              t.objectProperty(t.identifier(attribute.name.name), attribute.value),
          );
        };

        const awesomeIdentifier = t.identifier('Awesome');
        const createElementIdentifier = t.identifier('createElement');
        const callee = t.memberExpression(
            awesomeIdentifier,
            createElementIdentifier,
        );
        const args = [t.stringLiteral(tagName), attributes];
        const callAwExpression = t.callExpression(callee, args);
        callAwExpression.arguments = callAwExpression.arguments.concat(path.node.children);
        path.replaceWith(callAwExpression, path.node);
      },
      JSXText(path) {
        const nodeText = path.node.value.replace(/[\r\n]+/g, '').trim();
        if (nodeText) {
          path.replaceWith(t.stringLiteral(nodeText), path.node);
        } else {
          path.remove(path.node);
        }
      },
    },
  };
};
