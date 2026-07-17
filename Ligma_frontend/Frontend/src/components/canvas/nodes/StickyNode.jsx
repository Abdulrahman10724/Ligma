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

export default function StickyNode({
  node,
  isSelected,
  permissions,
  onDragEnd,
  onDragMove,
  onClick,
  onDoubleClick,
  onTransform,
  onTransformEnd,
  onMouseEnter,
  onMouseLeave,
}) {
  const { x, y, data = {} } = node;
  const color = data.fill || STICKY_COLORS[data.color] || STICKY_COLORS.yellow;
  const text = data.text || "Double-click to edit";
  const textColor = data.textColor || "#18181B";
  const width = data.width || WIDTH;
  const height = data.height || HEIGHT;
  const isLocked = Boolean(permissions?.isLocked);

  return (
    <Group
      id={`node-${node.id}`}
      x={x}
      y={y}
      draggable={permissions?.canMove}
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
      onDblClick={() => permissions?.canEdit && onDoubleClick(node.id)}
      onTransform={(e) => onTransform(node.id, e.target)}
      onTransformEnd={(e) => onTransformEnd(node.id, e.target)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
        opacity={isLocked ? 0.82 : 1}
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
      {isLocked && (
        <Text
          x={width - 52}
          y={8}
          width={44}
          text="Locked"
          fontSize={10}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#991B1B"
          align="right"
          listening={false}
        />
      )}
    </Group>
  );
}
