import { Group, Rect, Text } from "react-konva";

const WIDTH = 180;
const MIN_HEIGHT = 36;
const PADDING = 8;

export default function TextNode({
  node,
  isSelected,
  onDragEnd,
  onDragMove,
  onClick,
  onDoubleClick,
  onTransform,
  onTransformEnd,
}) {
  const { x, y, data = {} } = node;
  const text = data.text ?? "Text block";
  const fontSize = data.fontSize || 16;
  const color = data.color || "#18181B";
  const width = data.width || WIDTH;
  const height = data.height || MIN_HEIGHT;

  return (
    <Group
      id={`node-${node.id}`}
      x={x}
      y={y}
      draggable
      onDragStart={(e) => { e.cancelBubble = true; }}
      onDragMove={(e) => {
        e.cancelBubble = true;
        onDragMove(node.id, e.target.x(), e.target.y());
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true;
        onDragEnd(node.id, e.target.x(), e.target.y());
      }}
      onClick={() => onClick(node.id)}
      onDblClick={() => onDoubleClick(node.id)}
      onTransform={(e) => onTransform?.(node.id, e.target)}
      onTransformEnd={(e) => onTransformEnd?.(node.id, e.target)}
    >
      {isSelected && (
        <Rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          cornerRadius={6}
          stroke="#6366F1"
          strokeWidth={2}
          fill="rgba(99, 102, 241, 0.05)"
          dash={[4, 3]}
        />
      )}
      <Text
        x={PADDING}
        y={PADDING}
        width={width - PADDING * 2}
        height={height - PADDING * 2}
        text={text}
        fontSize={fontSize}
        fontFamily="Inter, system-ui, sans-serif"
        fill={color}
        wrap="word"
      />
    </Group>
  );
}