import { Group, Rect, Circle, Text, Line } from "react-konva";

const DEFAULTS = {
  rectangle: { width: 160, height: 100, fill: "#DBEAFE", stroke: "#3B82F6" },
  circle: { radius: 60, fill: "#D1FAE5", stroke: "#10B981" },
  diamond: { width: 160, height: 160, fill: "#E0E7FF", stroke: "#6366F1" },
  triangle: { width: 160, height: 160, fill: "#FEE2E2", stroke: "#EF4444" },
};

function getPolygonPoints(type, width, height) {
  if (type === "diamond") {
    return [width / 2, 0, width, height / 2, width / 2, height, 0, height / 2];
  }

  if (type === "triangle") {
    return [width / 2, 0, width, height, 0, height];
  }

  return [];
}

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
  isEditing,
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
          strokeWidth={selectionWidth || data.strokeWidth || 1.5}
          cornerRadius={data.cornerRadius ?? 8}
          opacity={isLocked ? 0.82 : data.opacity ?? 1}
        />
        {data.label && !isEditing && (
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
          strokeWidth={selectionWidth || data.strokeWidth || 1.5}
          opacity={isLocked ? 0.82 : data.opacity ?? 1}
        />
        {data.label && !isEditing && (() => {
          // Inscribed-square width keeps wrapped text inside the circle's edge.
          const inscribedWidth = Math.max(24, radius * Math.SQRT2 - 16);
          return (
            <Text
              x={-inscribedWidth / 2}
              y={-9}
              width={inscribedWidth}
              text={data.label}
              fontSize={13}
              fontFamily="Inter, system-ui, sans-serif"
              fill="#18181B"
              align="center"
              wrap="word"
            />
          );
        })()}
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

  if (type === "diamond" || type === "triangle") {
    const defaults = type === "diamond" ? DEFAULTS.diamond : DEFAULTS.triangle;
    const { width, height, fill, stroke } = { ...defaults, ...data };
    const points = getPolygonPoints(type, width, height);

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
        <Line
          points={points}
          closed
          fill={fill}
          stroke={selectionStroke || stroke}
          strokeWidth={selectionWidth || data.strokeWidth || 1.5}
          opacity={isLocked ? 0.82 : data.opacity ?? 1}
          listening
        />
        {data.label && !isEditing && (
          <Text
            x={12}
            y={Math.max(0, (height - 16) / 2)}
            width={width - 24}
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

  return null;
}
