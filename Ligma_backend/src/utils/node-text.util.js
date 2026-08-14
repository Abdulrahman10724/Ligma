const NODE_TEXT_KEYS = {
  sticky: "text",
  text: "text",
  rectangle: "label",
  circle: "label",
  arrow: "label",
  diamond: "label",
  triangle: "label",
  line: "label",
};

const getNodeText = (node) => {
  if (!node?.data) return "";
  const key = NODE_TEXT_KEYS[node.type];
  if (!key) return "";
  return node.data[key] || "";
};

export { NODE_TEXT_KEYS, getNodeText };

export default { NODE_TEXT_KEYS, getNodeText };