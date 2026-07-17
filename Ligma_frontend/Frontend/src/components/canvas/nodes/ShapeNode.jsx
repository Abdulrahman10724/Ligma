import { Group, Rect, Circle, Text } from "react-konva";

const DEFAULTS = {
  rectangle: { width: 160, height: 100, fill: "#DBEAFE", stroke: "#3B82F6" },
  circle: { radius: 60, fill: "#D1FAE5", stroke: "#10B981" },
};

export default function ShapeNode({
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
  const { x, y, type, data = {} } = node;
  const isLocked = Boolean(permissions?.isLocked);

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
        onClick={handleClick}
        onDblClick={() => permissions?.canEdit && onDoubleClick(node.id)}
        onTransform={(e) => permissions?.canResize && onTransform(node.id, e.target)}
        onTransformEnd={(e) => permissions?.canResize && onTransformEnd(node.id, e.target)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Rect
          width={width}
          height={height}
          fill={fill}
          stroke={selectionStroke || stroke}
          strokeWidth={selectionWidth || 1.5}
          cornerRadius={8}
          opacity={isLocked ? 0.82 : 1}
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

  if (type === "circle") {
    const { radius, fill, stroke } = { ...DEFAULTS.circle, ...data };
    return (
      <Group
        id={`node-${node.id}`}
        x={x}
        y={y}
        draggable={permissions?.canMove}
        onDragMove={(e) => permissions?.canMove && onDragMove(node.id, e.target.x(), e.target.y())}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDblClick={() => permissions?.canEdit && onDoubleClick(node.id)}
        onTransform={(e) => permissions?.canResize && onTransform(node.id, e.target)}
        onTransformEnd={(e) => permissions?.canResize && onTransformEnd(node.id, e.target)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Circle
          radius={radius}
          fill={fill}
          stroke={selectionStroke || stroke}
          strokeWidth={selectionWidth || 1.5}
          opacity={isLocked ? 0.82 : 1}
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
        {isLocked && (
          <Text
            x={-38}
            y={-radius - 20}
            width={76}
            text="Locked"
            fontSize={10}
            fontFamily="Inter, system-ui, sans-serif"
            fill="#991B1B"
            align="center"
            listening={false}
          />
        )}
      </Group>
    );
  }

  return null;
}
