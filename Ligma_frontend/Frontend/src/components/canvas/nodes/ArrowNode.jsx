import { Group, Arrow, Text } from "react-konva";

// ArrowNode renders as a directed arrow from (x,y) to (x+dx, y+dy)
// data.dx and data.dy encode the vector; defaults to a 150px horizontal arrow
export default function ArrowNode({
  node,
  isSelected,
  onDragEnd,
  onDragMove,
  onClick,
  onDoubleClick,
  onTransformEnd,
}) {
  const { x, y, data = {} } = node;
  const dx = data.dx ?? 150;
  const dy = data.dy ?? 0;
  const stroke = data.color || "#6366F1";

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
      <Arrow
        points={[0, 0, dx, dy]}
        stroke={isSelected ? "#4F46E5" : stroke}
        strokeWidth={isSelected ? 3 : 2}
        fill={isSelected ? "#4F46E5" : stroke}
        pointerLength={10}
        pointerWidth={8}
      />
      {data.label && (
        <Text
          x={dx / 2 - 40}
          y={dy / 2 - 18}
          width={80}
          text={data.label}
          fontSize={11}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#71717A"
          align="center"
        />
      )}
    </Group>
  );
}
