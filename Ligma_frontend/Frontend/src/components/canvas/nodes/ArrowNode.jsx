import { Group, Arrow, Circle, Text } from "react-konva";

// ArrowNode renders as a directed arrow from (x,y) to (x+dx, y+dy)
// data.dx and data.dy encode the vector; defaults to a 150px horizontal arrow
export default function ArrowNode({
  node,
  isSelected,
  canEdit = true,
  permissions,
  onDragEnd,
  onDragMove,
  onClick,
  onDoubleClick,
  onEndpointDragMove,
  onEndpointDragEnd,
  onMouseEnter,
  onMouseLeave,
}) {
  const { x, y, data = {} } = node;
  const dx = data.dx ?? 150;
  const dy = data.dy ?? 0;
  const stroke = data.color || "#6366F1";
  const isLocked = Boolean(permissions?.isLocked);

  return (
    <Group
      id={`node-${node.id}`}
      x={x}
      y={y}
      draggable={permissions?.canMove ?? canEdit}
      onDragStart={(e) => {
        if (e.target.name() === "endpoint-handle") return;
        e.cancelBubble = true;
      }}
      onDragMove={(e) => {
        if (e.target.name() === "endpoint-handle") return; // handle manages its own drag
        e.cancelBubble = true;
        onDragMove(node.id, e.target.x(), e.target.y());
      }}
      onDragEnd={(e) => {
        if (e.target.name() === "endpoint-handle") return;
        e.cancelBubble = true;
        onDragEnd(node.id, e.target.x(), e.target.y());
      }}
      onClick={() => onClick(node.id)}
      onDblClick={() => permissions?.canEdit && onDoubleClick(node.id)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Wider invisible hit-area so thin arrows are easy to click/select */}
      <Arrow
        points={[0, 0, dx, dy]}
        stroke="transparent"
        strokeWidth={16}
        hitStrokeWidth={16}
        listening
      />

      <Arrow
        points={[0, 0, dx, dy]}
        stroke={isSelected ? "#4F46E5" : stroke}
        strokeWidth={isSelected ? 3 : 2}
        fill={isSelected ? "#4F46E5" : stroke}
        pointerLength={10}
        pointerWidth={8}
        listening={false}
        opacity={isLocked ? 0.82 : 1}
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
          listening={false}
        />
      )}

      {isLocked && (
        <Text
          x={dx / 2 - 28}
          y={dy / 2 - 28}
          width={56}
          text="Locked"
          fontSize={10}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#991B1B"
          align="center"
          listening={false}
        />
      )}

      {/* Endpoint handles — only when selected + editable, replaces box-Transformer */}
      {isSelected && canEdit && (
        <>
          <Circle
            name="endpoint-handle"
            x={0}
            y={0}
            radius={6}
            fill="#FFFFFF"
            stroke="#4F46E5"
            strokeWidth={2}
            draggable
            onDragStart={(e) => { e.cancelBubble = true; }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              onEndpointDragMove?.(node.id, "start", e.target.x(), e.target.y());
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              onEndpointDragEnd?.(node.id, "start", e.target.x(), e.target.y());
            }}
          />
          <Circle
            name="endpoint-handle"
            x={dx}
            y={dy}
            radius={6}
            fill="#FFFFFF"
            stroke="#4F46E5"
            strokeWidth={2}
            draggable
            onDragStart={(e) => { e.cancelBubble = true; }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              onEndpointDragMove?.(node.id, "end", e.target.x(), e.target.y());
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              onEndpointDragEnd?.(node.id, "end", e.target.x(), e.target.y());
            }}
          />
        </>
      )}
    </Group>
  );
}