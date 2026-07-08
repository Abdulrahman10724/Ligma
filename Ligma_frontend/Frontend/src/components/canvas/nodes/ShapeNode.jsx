import { Group, Rect, Circle, Text } from "react-konva";

const DEFAULTS = {
  rectangle: { width: 160, height: 100, fill: "#DBEAFE", stroke: "#3B82F6" },
  circle: { radius: 60, fill: "#D1FAE5", stroke: "#10B981" },
};

export default function ShapeNode({
  node,
  isSelected,
  onDragEnd,
  onDragMove,
  onClick,
  onDoubleClick,
  onTransformEnd,
}) {
  const { x, y, type, data = {} } = node;

  const handleDragEnd = (e) => onDragEnd(node.id, e.target.x(), e.target.y());
  const handleClick = () => onClick(node.id);

  const selectionStroke = isSelected ? "#6366F1" : null;
  const selectionWidth = isSelected ? 2.5 : 0;

  if (type === "rectangle") {
    const { width, height, fill, stroke } = { ...DEFAULTS.rectangle, ...data };
    return (
      <Group
        id={`node-${node.id}`}
        x={x}
        y={y}
        draggable
        onDragMove={(e) => onDragMove(node.id, e.target.x(), e.target.y())}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDblClick={() => onDoubleClick(node.id)}
        onTransformEnd={(e) => onTransformEnd(node.id, e.target)}
      >
        <Rect
          width={width}
          height={height}
          fill={fill}
          stroke={selectionStroke || stroke}
          strokeWidth={selectionWidth || 1.5}
          cornerRadius={8}
        />
        {data.label && (
          <Text
            x={8}
            y={8}
            width={width - 16}
            text={data.label}
            fontSize={13}
            fontFamily="Inter, system-ui, sans-serif"
            fill="#18181B"
            wrap="word"
          />
        )}
      </Group>
    );
  }

  if (type === "circle") {
    const { radius, fill, stroke } = { ...DEFAULTS.circle, ...data };
    return (
      <Group
        id={`node-${node.id}`}
        x={x}
        y={y}
        draggable
        onDragMove={(e) => onDragMove(node.id, e.target.x(), e.target.y())}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDblClick={() => onDoubleClick(node.id)}
        onTransformEnd={(e) => onTransformEnd(node.id, e.target)}
      >
        <Circle
          radius={radius}
          fill={fill}
          stroke={selectionStroke || stroke}
          strokeWidth={selectionWidth || 1.5}
        />
        {data.label && (
          <Text
            x={-radius + 8}
            y={-10}
            width={radius * 2 - 16}
            text={data.label}
            fontSize={13}
            fontFamily="Inter, system-ui, sans-serif"
            fill="#18181B"
            align="center"
            wrap="word"
          />
        )}
      </Group>
    );
  }

  return null;
}
