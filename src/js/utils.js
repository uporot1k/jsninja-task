export function getFocusNode() {
  return window.getSelection().focusNode;
}

export function isNodeContainsAnother(parent, child) {
  return parent && parent.contains(child);
}
