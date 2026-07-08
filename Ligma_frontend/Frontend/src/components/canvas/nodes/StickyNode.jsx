import { Group, Rect, Text } from "react-konva";

const STICKY_COLORS = {
  yellow: "#FEF3C7",
  pink: "#FCE7F3",
  blue: "#DBEAFE",
  green: "#D1FAE5",
  orange: "#FFEDD5",
};

const WIDTH = 200;
const HEIGHT = 160;
const PADDING = 12;
const CORNER_RADIUS = 10;

export default function StickyNode({ node, isSelected, onDragEnd, onDragMove, onClick, onDoubleClick, onTransformEnd }) {
  const { x, y, data = {} } = node;
  const color = data.fill || STICKY_COLORS[data.color] || STICKY_COLORS.yellow;
  const text = data.text || "Double-click to edit";
  const textColor = data.textColor || "#18181B";
  const width = data.width || WIDTH;
  const height = data.height || HEIGHT;

  return (
    <Group
      id={`node-${node.id}`}
      x={x}
      y={y}
      draggable
      onDragMove={(e) => onDragMove(node.id, e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEnd(node.id, e.target.x(), e.target.y())}
      onClick={() => onClick(node.id)}
      onDblClick={() => onDoubleClick(node.id)}
      onTransformEnd={(e) => onTransformEnd(node.id, e.target)}
    >
      {/* Shadow */}
      <Rect
        x={3}
        y={4}
        width={width}
        height={height}
        cornerRadius={CORNER_RADIUS}
        fill="rgba(0,0,0,0.08)"
      />
      {/* Card body */}
      <Rect
        width={width}
        height={height}
        fill={color}
        cornerRadius={CORNER_RADIUS}
        stroke={isSelected ? "#6366F1" : "transparent"}
        strokeWidth={isSelected ? 2 : 0}
      />
      {/* Text content */}
      <Text
        x={PADDING}
        y={PADDING}
        width={width - PADDING * 2}
        height={height - PADDING * 2}
        text={text}
        fontSize={13}
        fontFamily="Inter, system-ui, sans-serif"
        fill={textColor}
        wrap="word"
        ellipsis
      />
    </Group>
  );
}
