import React from "react";
import { Group, Rect, Text } from "react-konva";

const WIDTH = 180;
const MIN_HEIGHT = 36;
const PADDING = 8;

function TextNode({
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
  const { x, y, data = {} } = node;
  const text = data.text ?? "Text block";
  const fontSize = data.fontSize || 16;
  const color = data.color || "#18181B";
  const width = data.width || WIDTH;
  const height = data.height || MIN_HEIGHT;
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
      onTransform={(e) => permissions?.canResize && onTransform?.(node.id, e.target)}
      onTransformEnd={(e) => permissions?.canResize && onTransformEnd?.(node.id, e.target)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
 {!isEditing && (
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

function areEqual(prevProps, nextProps) {
  return (
    prevProps.node === nextProps.node &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.permissions?.canMove === nextProps.permissions?.canMove &&
    prevProps.permissions?.canEdit === nextProps.permissions?.canEdit &&
    prevProps.permissions?.canResize === nextProps.permissions?.canResize &&
    prevProps.permissions?.isLocked === nextProps.permissions?.isLocked
  );
}

export default React.memo(TextNode, areEqual);