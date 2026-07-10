import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Arrow, Circle, Group, Layer, Line, Rect, Stage, Text, Transformer, Path } from "react-konva";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import useSocket from "../hooks/useSocket";

import {
  fetchCanvasNodes,
  createCanvasNode,
  updateCanvasNode,
  deleteCanvasNode,
  updateNodePositionLocally,
  updateNodeDataLocally,
  upsertNodeLocally,
  removeNodeLocally,
  clearCanvas,
} from "../redux/canvasSlice";
import CanvasToolbar from "../components/canvas/CanvasToolbar";
import StickyNode from "../components/canvas/nodes/StickyNode";
import TextNode from "../components/canvas/nodes/TextNode";
import ShapeNode from "../components/canvas/nodes/ShapeNode";
import ArrowNode from "../components/canvas/nodes/ArrowNode";

const GRID_SIZE = 40;
const GRID_COLOR = "#E4E4E7";
const DARK_GRID_COLOR = "#2A2A31";

// Default data payloads for each node type
const DEFAULT_NODE_DATA = {
  sticky: { color: "yellow", fill: "#FEF3C7", text: "New note", textColor: "#18181B", width: 200, height: 160 },
  text: { text: "Text block", fontSize: 16, color: "#18181B", width: 180, height: 48 },
  rectangle: { width: 160, height: 100, fill: "#DBEAFE", stroke: "#3B82F6", label: "" },
  circle: { radius: 60, fill: "#D1FAE5", stroke: "#10B981", label: "" },
  arrow: { dx: 150, dy: 0, color: "#6366F1", label: "" },
};

const RESIZABLE_NODE_TYPES = new Set(["sticky", "text", "rectangle", "circle"]);

const COLOR_FIELDS = {
  sticky: ["fill", "textColor"],
  text: ["color"],
  rectangle: ["fill", "stroke"],
  circle: ["fill", "stroke"],
  arrow: ["color"],
};

const NODE_TEXT_KEYS = {
  sticky: "text",
  text: "text",
  rectangle: "label",
  circle: "label",
  arrow: "label",
};

const SNAP_ANGLE_THRESHOLD = 6; // degrees

function snapArrowVector(dx, dy, shiftHeld) {
  const distance = Math.hypot(dx, dy);
  if (distance < 4) return { dx, dy };

  const degrees = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Shift dabaya ho toh 45° increments par snap karo, warna sirf horizontal/vertical ke paas
  const snapAngles = shiftHeld
    ? [-180, -135, -90, -45, 0, 45, 90, 135, 180]
    : [-180, -90, 0, 90, 180];

  for (const snapDeg of snapAngles) {
    if (Math.abs(degrees - snapDeg) <= SNAP_ANGLE_THRESHOLD) {
      const rad = (snapDeg * Math.PI) / 180;
      return { dx: Math.cos(rad) * distance, dy: Math.sin(rad) * distance };
    }
  }
  return { dx, dy };
}


function buildGridLines(stageWidth, stageHeight, scale, offsetX, offsetY) {
  const lines = [];

  const startX = Math.floor(-offsetX / scale / GRID_SIZE) * GRID_SIZE;
  const startY = Math.floor(-offsetY / scale / GRID_SIZE) * GRID_SIZE;
  const endX = startX + stageWidth / scale + GRID_SIZE * 2;
  const endY = startY + stageHeight / scale + GRID_SIZE * 2;

  for (let x = startX; x < endX; x += GRID_SIZE) {
    lines.push({ points: [x, startY, x, endY], key: `vl-${x}` });
  }
  for (let y = startY; y < endY; y += GRID_SIZE) {
    lines.push({ points: [startX, y, endX, y], key: `hl-${y}` });
  }

  return lines;
}

export default function CanvasPage() {
  const { id: workspaceId } = useParams();
  const dispatch = useDispatch();
  const { nodes: nodesMap, loading } = useSelector((state) => state.canvas);
  const { activeWorkspace } = useSelector((state) => state.workspace);
  const { user: currentUser } = useSelector((state) => state.auth);
  // status
  const { emit, on, off } = useSocket({ workspaceId, autoJoin: false });

  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [activeTool, setActiveTool] = useState("select");
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [arrowDraft, setArrowDraft] = useState(null);
  const [creationDraft, setCreationDraft] = useState(null);
  const [remoteDraft, setRemoteDraft] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [activeColor, setActiveColor] = useState("#FEF3C7");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const colorTimersRef = useRef({});
  const clipboardNodeRef = useRef(null);
  const dragEmitRef = useRef(0);
  // const resizeEmitRef = useRef(0);
  const cursorEmitRef = useRef(0);
  const textEmitTimerRef = useRef(null);
  const pendingTextValueRef = useRef(null);
  const dragInFlightRef = useRef({});
  const dragPendingRef = useRef({});
  const [remoteCursors, setRemoteCursors] = useState({});

  const emitCursorPosition = useCallback(
    (point) => {
      if (!workspaceId || !emit || !point) {
        return;
      }

      const now = Date.now();
      if (now - cursorEmitRef.current < 120) {
        return;
      }

      cursorEmitRef.current = now;
      emit("workspace:cursor", {
        workspaceId,
        x: Math.round(point.x),
        y: Math.round(point.y),
      });
    },
    [emit, workspaceId]
  );

  // Detect dark mode
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDarkMode(mql.matches || document.documentElement.classList.contains("dark"));
    const handler = (e) => setIsDarkMode(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Fit stage to container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDimensions({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    setDimensions({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Load nodes
  useEffect(() => {
    if (!workspaceId) return;
    dispatch(fetchCanvasNodes(workspaceId));
    return () => {
      dispatch(clearCanvas());
    };
  }, [dispatch, workspaceId]);

  const nodes = Object.values(nodesMap);
  const selectedNodeId = selectedNodeIds[0] || null;
  const selectedNode = selectedNodeId ? nodesMap[selectedNodeId] : null;
  const canEditCanvas = activeWorkspace?.currentUserRole !== "Viewer";
  const gridLines = buildGridLines(
    dimensions.width,
    dimensions.height,
    viewport.scale,
    viewport.x,
    viewport.y
  );
  const gridColor = isDarkMode ? DARK_GRID_COLOR : GRID_COLOR;

  const getCanvasPoint = useCallback(() => {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return null;

    return {
      x: (pointer.x - viewport.x) / viewport.scale,
      y: (pointer.y - viewport.y) / viewport.scale,
    };
  }, [viewport]);

  const getNodeTextValue = useCallback((node) => {
    if (!node) return "";
    const textKey = NODE_TEXT_KEYS[node.type];
    return node.data?.[textKey] || "";
  }, []);

  const getNodeBounds = useCallback((node) => {
    if (!node) return null;

    const data = node.data || {};
    if (node.type === "circle") {
      const radius = data.radius || DEFAULT_NODE_DATA.circle.radius;
      return { x: node.x - radius, y: node.y - radius, width: radius * 2, height: radius * 2 };
    }

    if (node.type === "text") {
      return {
        x: node.x,
        y: node.y,
        width: data.width || DEFAULT_NODE_DATA.text.width,
        height: data.height || DEFAULT_NODE_DATA.text.height,
      };
    }

    if (node.type === "sticky") {
      return {
        x: node.x,
        y: node.y,
        width: data.width || DEFAULT_NODE_DATA.sticky.width,
        height: data.height || DEFAULT_NODE_DATA.sticky.height,
      };
    }

    if (node.type === "rectangle") {
      return {
        x: node.x,
        y: node.y,
        width: data.width || DEFAULT_NODE_DATA.rectangle.width,
        height: data.height || DEFAULT_NODE_DATA.rectangle.height,
      };
    }

    return null;
  }, []);

  const selectedNodeBounds = useMemo(() => getNodeBounds(selectedNode), [getNodeBounds, selectedNode]);

  // const selectedNodeType = selectedNode?.type || null;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;

    if (!transformer || !stage || !selectedNodeId || !selectedNode || !RESIZABLE_NODE_TYPES.has(selectedNode.type)) {
      transformer?.nodes([]);
      return;
    }

    const selectedShape = stage.findOne(`#node-${selectedNodeId}`);
    if (selectedShape) {
      transformer.nodes([selectedShape]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedNode, selectedNodeId]);

  useEffect(() => {
    const handleNodeCreated = (payload) => {
      if (payload?.workspaceId !== workspaceId || payload?.actorId === currentUser?.id) return;
      if (payload?.node) {
        dispatch(upsertNodeLocally(payload.node));
      }
    };

    const handleNodeUpdated = (payload) => {
      if (payload?.workspaceId !== workspaceId || payload?.actorId === currentUser?.id) return;
      if (payload?.node) {
        dispatch(upsertNodeLocally(payload.node));
      }
    };

    const handleNodeDeleted = (payload) => {
      if (payload?.workspaceId !== workspaceId || payload?.actorId === currentUser?.id) return;
      if (payload?.nodeId) {
        dispatch(removeNodeLocally(payload.nodeId));
      }
    };

    const handleNodeDrag = (payload) => {
      if (payload?.workspaceId !== workspaceId || payload?.actorId === currentUser?.id) return;
      if (payload?.nodeId && typeof payload?.x === "number" && typeof payload?.y === "number") {
        dispatch(updateNodePositionLocally({ nodeId: payload.nodeId, x: payload.x, y: payload.y }));
      }
    };

    const handleNodeText = (payload) => {
      if (payload?.workspaceId !== workspaceId || payload?.actorId === currentUser?.id) return;
      if (payload?.nodeId && typeof payload?.value === "string") {
        const node = latestNodesRef.current[payload.nodeId];
        if (!node) return;
        const textKey = NODE_TEXT_KEYS[node.type];
        dispatch(updateNodeDataLocally({ nodeId: payload.nodeId, patch: { [textKey]: payload.value } }));
      }
    };
    const handleNodeResize = (payload) => {
      if (payload?.workspaceId !== workspaceId || payload?.actorId === currentUser?.id) return;
      if (payload?.nodeId) {
        dispatch(updateNodePositionLocally({ nodeId: payload.nodeId, x: payload.x, y: payload.y }));
        dispatch(updateNodeDataLocally({ nodeId: payload.nodeId, patch: payload.data || {} }));
      }
    };

    const handleRemoteDraft = (payload) => {
      if (payload?.workspaceId !== workspaceId || payload?.actorId === currentUser?.id) return;
      setRemoteDraft(payload?.draft || null);
    };
    const handleNodeData = (payload) => {
      if (payload?.workspaceId !== workspaceId || payload?.actorId === currentUser?.id) return;
      if (payload?.nodeId && payload?.patch) {
        dispatch(updateNodeDataLocally({ nodeId: payload.nodeId, patch: payload.patch }));
      }
    };

    const handleCursor = (payload) => {
      if (payload?.workspaceId !== workspaceId || payload?.userId === currentUser?.id) return;
      if (typeof payload?.x !== "number" || typeof payload?.y !== "number") return;

      setRemoteCursors((previous) => ({
        ...previous,
        [payload.userId]: payload,
      }));
    };

    on("canvas:node-created", handleNodeCreated);
    on("canvas:node-updated", handleNodeUpdated);
    on("canvas:node-deleted", handleNodeDeleted);
    on("canvas:drag", handleNodeDrag);
    on("canvas:resize", handleNodeResize);
    on("canvas:text", handleNodeText);
    on("canvas:draft", handleRemoteDraft);
    on("canvas:data", handleNodeData);
    on("workspace:cursor", handleCursor);
    return () => {
      off("canvas:node-created", handleNodeCreated);
      off("canvas:node-updated", handleNodeUpdated);
      off("canvas:node-deleted", handleNodeDeleted);
      off("canvas:drag", handleNodeDrag);
      off("canvas:resize", handleNodeResize);
      off("canvas:text", handleNodeText);
      off("canvas:draft", handleRemoteDraft);
      off("canvas:data", handleNodeData);
      off("workspace:cursor", handleCursor);

    };
  }, [currentUser?.id, dispatch, off, on, workspaceId]);

  useEffect(() => {
    const handleShortcuts = async (event) => {
      const target = event.target;
      const isTextEditingTarget =
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target?.isContentEditable ||
        Boolean(editingNodeId);

      if (isTextEditingTarget) {
        return;
      }

      const isMeta = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (key === "escape") {
        event.preventDefault();
        setSelectedNodeIds([]);
        return;
      }

      if (!canEditCanvas) {
        return;
      }

      if (key === "delete" || key === "backspace") {
        if (!selectedNodeIds.length) return;
        event.preventDefault();
        const ids = [...selectedNodeIds];
        for (const nodeId of ids) {
          const result = await dispatch(deleteCanvasNode({ workspaceId, nodeId }));
          if (deleteCanvasNode.rejected.match(result)) {
            toast.error(result.payload || "Failed to delete node");
            break;
          }
        }
        setSelectedNodeIds([]);
        return;
      }

      if (isMeta && key === "a") {
        event.preventDefault();
        setSelectedNodeIds(nodes.map((node) => node.id));
        return;
      }

      if (isMeta && key === "c") {
        if (!selectedNodeId) return;
        event.preventDefault();
        clipboardNodeRef.current = nodesMap[selectedNodeId] || null;
        return;
      }

      const createDuplicate = async () => {
        const source = clipboardNodeRef.current;
        if (!source) return;

        const payload = {
          type: source.type,
          x: Math.round((source.x || 0) + 24),
          y: Math.round((source.y || 0) + 24),
          data: { ...(source.data || {}) },
        };

        const result = await dispatch(createCanvasNode({ workspaceId, payload }));
        if (createCanvasNode.rejected.match(result)) {
          toast.error(result.payload || "Failed to duplicate node");
        }
      };

      if (isMeta && key === "v") {
        event.preventDefault();
        await createDuplicate();
        return;
      }

      if (isMeta && key === "d") {
        if (!selectedNodeId) return;
        event.preventDefault();
        clipboardNodeRef.current = nodesMap[selectedNodeId] || null;
        await createDuplicate();
      }
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [
    canEditCanvas,
    dispatch,
    editingNodeId,
    nodes,
    nodesMap,
    selectedNodeId,
    selectedNodeIds,
    workspaceId,
  ]);

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.06;
    const newScale = Math.max(0.1, Math.min(5, direction > 0 ? oldScale * factor : oldScale / factor));

    setViewport({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, [viewport]);

  const buildPresetData = useCallback(
    (tool, size = {}) => {
      const width = Math.max(24, size.width || 0);
      const height = Math.max(24, size.height || 0);

      if (tool === "sticky") {
        return {
          ...DEFAULT_NODE_DATA.sticky,
          fill: activeColor,
          textColor: DEFAULT_NODE_DATA.sticky.textColor,
          width: width || DEFAULT_NODE_DATA.sticky.width,
          height: height || DEFAULT_NODE_DATA.sticky.height,
        };
      }

      if (tool === "text") {
        return {
          ...DEFAULT_NODE_DATA.text,
          width: width || DEFAULT_NODE_DATA.text.width,
          height: height || DEFAULT_NODE_DATA.text.height,
        };
      }

      if (tool === "rectangle") {
        return {
          ...DEFAULT_NODE_DATA.rectangle,
          fill: activeColor,
          stroke: activeColor,
          width: width || DEFAULT_NODE_DATA.rectangle.width,
          height: height || DEFAULT_NODE_DATA.rectangle.height,
        };
      }

      if (tool === "circle") {
        const radius = Math.max(24, Math.round(Math.max(width, height) / 2) || DEFAULT_NODE_DATA.circle.radius);
        return {
          ...DEFAULT_NODE_DATA.circle,
          fill: activeColor,
          stroke: activeColor,
          radius,
        };
      }

      return DEFAULT_NODE_DATA[tool] || {};
    },
    [activeColor]
  );

  const commitCreationDraft = useCallback(
    async (draft) => {
      if (!draft) return;

      const point = draft.current || draft.start;
      const width = Math.abs(point.x - draft.start.x);
      const height = Math.abs(point.y - draft.start.y);
      const x = Math.min(draft.start.x, point.x);
      const y = Math.min(draft.start.y, point.y);

      const size = draft.tool === "circle"
        ? { width: Math.max(width, height), height: Math.max(width, height) }
        : { width, height };

      const payload = {
        type: draft.tool,
        x: Math.round(x),
        y: Math.round(y),
        data: buildPresetData(draft.tool, size),
      };

      const result = await dispatch(createCanvasNode({ workspaceId, payload }));
      if (createCanvasNode.rejected.match(result)) {
        toast.error(result.payload || "Failed to create node");
      }
    },
    [buildPresetData, dispatch, workspaceId]
  );

  const handleStagePointerDown = useCallback(
    async (e) => {
      if (!canEditCanvas) {
        return;
      }

      if (e.target !== e.target.getStage()) {
        return;
      }
      if (editingNodeId) {
        await handleEditorSave();
      }
      const point = getCanvasPoint();
      if (!point) return;

      if (activeTool === "arrow") {
        setSelectedNodeIds([]);
        setEditingNodeId(null);
        setCreationDraft(null);
        setArrowDraft({ start: point, end: point });
        return;
      }

      if (activeTool === "select") {
        setSelectedNodeIds([]);
        setEditingNodeId(null);
        return;
      }

      setSelectedNodeIds([]);
      setEditingNodeId(null);
      setArrowDraft(null);
      emit("canvas:draft", { workspaceId, draft: null });
      setCreationDraft({ tool: activeTool, start: point, current: point });
    },
    [activeTool, canEditCanvas, getCanvasPoint]
  );

  const draftEmitTimerRef = useRef(null);
  const handleStagePointerMove = useCallback(() => {
    const point = getCanvasPoint();
    if (!point) return;

    emitCursorPosition(point);

    if (arrowDraft && activeTool === "arrow") {
      const rawDx = point.x - arrowDraft.start.x;
      const rawDy = point.y - arrowDraft.start.y;
      const { dx: snappedDx, dy: snappedDy } = snapArrowVector(rawDx, rawDy, isShiftPressed);

      setArrowDraft((current) =>
        current
          ? { ...current, end: { x: arrowDraft.start.x + snappedDx, y: arrowDraft.start.y + snappedDy } }
          : current
      );

      if (!draftEmitTimerRef.current) {
        draftEmitTimerRef.current = setTimeout(() => {
          emit("canvas:draft", { workspaceId, draft: { type: "arrow", start: arrowDraft.start, end: point } });
          draftEmitTimerRef.current = null;
        }, 50);
      }
    }

    if (creationDraft) {
      setCreationDraft((current) => (current ? { ...current, current: point } : current));

      if (!draftEmitTimerRef.current) {
        draftEmitTimerRef.current = setTimeout(() => {
          emit("canvas:draft", { workspaceId, draft: { ...creationDraft, current: point } });
          draftEmitTimerRef.current = null;
        }, 50);
      }
    }
  }, [activeTool, arrowDraft, creationDraft, emitCursorPosition, getCanvasPoint, isShiftPressed, emit, workspaceId]);
  const handleStagePointerUp = useCallback(async () => {
    if (!canEditCanvas) {
      return;
    }

    if (arrowDraft && activeTool === "arrow") {
      const dx = arrowDraft.end.x - arrowDraft.start.x;
      const dy = arrowDraft.end.y - arrowDraft.start.y;
      if (Math.abs(dx) + Math.abs(dy) < 6) {
        setArrowDraft(null);
        return;
      }

      const payload = {
        type: "arrow",
        x: Math.round(arrowDraft.start.x),
        y: Math.round(arrowDraft.start.y),
        data: {
          ...DEFAULT_NODE_DATA.arrow,
          dx: Math.round(dx),
          dy: Math.round(dy),
        },
      };

      const result = await dispatch(createCanvasNode({ workspaceId, payload }));
      if (createCanvasNode.rejected.match(result)) {
        toast.error(result.payload || "Failed to create node");
      }

      setArrowDraft(null);
      setActiveTool("select");
      return;
    }

    if (creationDraft) {
      const draft = creationDraft;
      setCreationDraft(null);
      emit("canvas:draft", { workspaceId, draft: null });
      await commitCreationDraft(draft);
      setActiveTool("select");
    }
  }, [activeTool, arrowDraft, canEditCanvas, commitCreationDraft, creationDraft, dispatch, workspaceId]);

  // Stage click → place node (if tool !== select)
  const handleStageClick = useCallback(
    (e) => {
      if (!canEditCanvas) {
        setSelectedNodeIds([]);
        return;
      }

      // Only fire on direct stage click (not on child shapes)
      if (e.target !== e.target.getStage()) {
        return;
      }

      if (activeTool === "arrow") {
        return;
      }

      if (activeTool === "select") {
        setSelectedNodeIds([]);
        setEditingNodeId(null);
        return;
      }
    },
    [activeTool, canEditCanvas]
  );

  const sendDragUpdate = useCallback(
    async (nodeId, x, y) => {
      if (dragInFlightRef.current[nodeId]) {
        // isi node ke liye ek request pehle se chal rahi hai — sirf latest value yaad rakho
        dragPendingRef.current[nodeId] = { x, y };
        return;
      }

      dragInFlightRef.current[nodeId] = true;

      const result = await dispatch(
        updateCanvasNode({ workspaceId, nodeId, payload: { x: Math.round(x), y: Math.round(y) } })
      );

      if (updateCanvasNode.rejected.match(result)) {
        toast.error(result.payload || "Failed to update node");
      }

      dragInFlightRef.current[nodeId] = false;
      // remember latest value if  node drag is started
      const pending = dragPendingRef.current[nodeId];
      if (pending) {
        dragPendingRef.current[nodeId] = null;
        sendDragUpdate(nodeId, pending.x, pending.y);
      }
    },
    [dispatch, workspaceId]
  );
  const handleNodeDragEnd = useCallback(
    (nodeId, x, y) => {
      dispatch(updateNodePositionLocally({ nodeId, x, y }));
      emit("canvas:drag", { workspaceId, nodeId, x: Math.round(x), y: Math.round(y) });
      sendDragUpdate(nodeId, x, y);
    },
    [dispatch, emit, workspaceId, sendDragUpdate]
  );



  const handleNodeDragMove = useCallback(
    (nodeId, x, y) => {
      dispatch(updateNodePositionLocally({ nodeId, x, y }));

      const now = Date.now();
      if (now - dragEmitRef.current > 80) {
        dragEmitRef.current = now;
        emit("canvas:drag", { workspaceId, nodeId, x: Math.round(x), y: Math.round(y) });
      }
    },
    [dispatch, emit, workspaceId]
  );

  const handleNodeClick = useCallback(
    async (nodeId, isAdditiveSelection) => {
      if (editingNodeId && editingNodeId !== nodeId) {
        await handleEditorSave();
      }

      setSelectedNodeIds((previous) => {
        if (isAdditiveSelection) {
          if (previous.includes(nodeId)) {
            return previous.filter((id) => id !== nodeId);
          }

          return [...previous, nodeId];
        }

        return previous.length === 1 && previous[0] === nodeId ? [] : [nodeId];
      });
    }, []);

  const handleNodeDoubleClick = useCallback(
    (nodeId) => {
      const node = nodesMap[nodeId];
      if (!node) return;

      setSelectedNodeIds([nodeId]);
      setEditingNodeId(nodeId);
      setEditingValue(getNodeTextValue(node));
    },
    [getNodeTextValue, nodesMap]
  );


  const transformEmitTimersRef = useRef({});

  const handleNodeTransform = useCallback(
    (nodeId, target) => {
      const node = nodesMap[nodeId];
      if (!node) return;

      const data = node.data || {};
      const scaleX = target.scaleX();
      const scaleY = target.scaleY();

      const nextData = { ...data };
      if (node.type === "circle") {
        const nextRadius = Math.max(24, Math.round((data.radius || DEFAULT_NODE_DATA.circle.radius) * Math.max(scaleX, scaleY)));
        nextData.radius = nextRadius;
      } else {
        const baseWidth = data.width || (node.type === "text" ? DEFAULT_NODE_DATA.text.width : DEFAULT_NODE_DATA.sticky.width);
        const baseHeight = data.height || (node.type === "text" ? DEFAULT_NODE_DATA.text.height : DEFAULT_NODE_DATA.sticky.height);
        nextData.width = Math.max(48, Math.round(baseWidth * scaleX));
        nextData.height = Math.max(32, Math.round(baseHeight * scaleY));
      }

      // Local live UI update — sync position AND size so the controlled Group
      // prop doesn't fight with Konva's internal transform on left/top anchors.
      dispatch(updateNodePositionLocally({ nodeId, x: target.x(), y: target.y() }));
      dispatch(updateNodeDataLocally({ nodeId, patch: nextData }));

      // Throttle the broadcast so we don't flood the socket every frame
      if (transformEmitTimersRef.current[nodeId]) return;
      transformEmitTimersRef.current[nodeId] = setTimeout(() => {
        emit("canvas:resize", {
          workspaceId,
          nodeId,
          x: Math.round(target.x()),
          y: Math.round(target.y()),
          data: nextData,
        });
        delete transformEmitTimersRef.current[nodeId];
      }, 50); // ~20fps cap
    },
    [dispatch, emit, nodesMap, workspaceId]
  );

  const handleNodeTransformEnd = useCallback(
    async (nodeId, target) => {
      const node = nodesMap[nodeId];
      if (!node) return;

      const data = node.data || {};
      const scaleX = target.scaleX();
      const scaleY = target.scaleY();

      target.scaleX(1);
      target.scaleY(1);

      const nextData = { ...data };
      if (node.type === "circle") {
        const nextRadius = Math.max(24, Math.round((data.radius || DEFAULT_NODE_DATA.circle.radius) * Math.max(scaleX, scaleY)));
        nextData.radius = nextRadius;
      } else {
        const baseWidth = data.width || (node.type === "text" ? DEFAULT_NODE_DATA.text.width : DEFAULT_NODE_DATA.sticky.width);
        const baseHeight = data.height || (node.type === "text" ? DEFAULT_NODE_DATA.text.height : DEFAULT_NODE_DATA.sticky.height);
        nextData.width = Math.max(48, Math.round(baseWidth * scaleX));
        nextData.height = Math.max(32, Math.round(baseHeight * scaleY));
      }

      dispatch(updateNodeDataLocally({ nodeId, patch: nextData }));

      const result = await dispatch(
        updateCanvasNode({
          workspaceId,
          nodeId,
          payload: {
            x: Math.round(target.x()),
            y: Math.round(target.y()),
            data: nextData,
          },
        })
      );

      emit("canvas:resize", {
        workspaceId,
        nodeId,
        x: Math.round(target.x()),
        y: Math.round(target.y()),
        data: nextData,
      });

      if (updateCanvasNode.rejected.match(result)) {
        toast.error(result.payload || "Failed to update node");
      }
    },
    [dispatch, emit, nodesMap, workspaceId]
  );

  const handleArrowEndpointDragMove = useCallback(
    (nodeId, endpoint, localX, localY) => {
      const node = nodesMap[nodeId];
      if (!node) return;

      const data = node.data || {};
      const currentDx = data.dx ?? 150;
      const currentDy = data.dy ?? 0;

      if (endpoint === "end") {
        const { dx: snappedDx, dy: snappedDy } = snapArrowVector(localX, localY, isShiftPressed);
        dispatch(updateNodeDataLocally({ nodeId, patch: { dx: snappedDx, dy: snappedDy } }));
      } else {
        // start handle: group origin shift, absolute end-point fixed rakhna hai
        const nextX = node.x + localX;
        const nextY = node.y + localY;
        const nextDx = currentDx - localX;
        const nextDy = currentDy - localY;
        dispatch(updateNodePositionLocally({ nodeId, x: nextX, y: nextY }));
        dispatch(updateNodeDataLocally({ nodeId, patch: { dx: nextDx, dy: nextDy } }));
      }
    },
    [dispatch, isShiftPressed, nodesMap]
  );

  const handleArrowEndpointDragEnd = useCallback(
    async (nodeId, endpoint, localX, localY) => {
      handleArrowEndpointDragMove(nodeId, endpoint, localX, localY);

      // dispatch ke baad latest state se hi save karo (redux batching safe)
      const node = nodesMap[nodeId];
      if (!node) return;
      const data = node.data || {};

      let payload;
      if (endpoint === "end") {
        const { dx: snappedDx, dy: snappedDy } = snapArrowVector(localX, localY, isShiftPressed);
        payload = { data: { ...data, dx: snappedDx, dy: snappedDy } };
      } else {
        const currentDx = data.dx ?? 150;
        const currentDy = data.dy ?? 0;
        payload = {
          x: Math.round(node.x + localX),
          y: Math.round(node.y + localY),
          data: { ...data, dx: currentDx - localX, dy: currentDy - localY },
        };
      }

      const result = await dispatch(updateCanvasNode({ workspaceId, nodeId, payload }));
      if (updateCanvasNode.rejected.match(result)) {
        toast.error(result.payload || "Failed to update arrow");
        return;
      }

      emit("canvas:resize", { workspaceId, nodeId, ...payload });
    },
    [dispatch, emit, handleArrowEndpointDragMove, isShiftPressed, nodesMap, workspaceId]
  );

  const latestNodesRef = useRef(nodesMap);

  useEffect(() => {
    latestNodesRef.current = nodesMap;
  }, [nodesMap]);

  const colorEmitTimersRef = useRef({});

  const handleInspectorChange = useCallback(
    (field, value) => {
      if (!selectedNode) return;

      const nodeId = selectedNode.id;

      // Instant UI update (local)
      dispatch(
        updateNodeDataLocally({
          nodeId,
          patch: { [field]: value },
        })
      );

      // Throttled live broadcast (leading + trailing) so no value gets dropped
      if (!colorEmitTimersRef.current[nodeId]) {
        emit("canvas:data", { workspaceId, nodeId, patch: { [field]: value } });
        colorEmitTimersRef.current[nodeId] = {
          timer: setTimeout(() => {
            const pending = colorEmitTimersRef.current[nodeId]?.pending;
            delete colorEmitTimersRef.current[nodeId];
            if (pending) {
              emit("canvas:data", { workspaceId, nodeId, patch: pending });
            }
          }, 60),
          pending: null,
        };
      } else {
        colorEmitTimersRef.current[nodeId].pending = { [field]: value };
      }
      const timerKey = nodeId;

      // Cancel previous debounce timer (unchanged — this still persists to DB)
      if (colorTimersRef.current[timerKey]) {
        clearTimeout(colorTimersRef.current[timerKey]);
      }

      // Wait until user stops moving color picker, then persist + broadcast final state
      colorTimersRef.current[timerKey] = setTimeout(async () => {
        const latestNode = latestNodesRef.current[nodeId];

        if (!latestNode) return;

        const result = await dispatch(
          updateCanvasNode({
            workspaceId,
            nodeId,
            payload: {
              data: latestNode.data,
            },
          })
        );

        if (updateCanvasNode.rejected.match(result)) {
          toast.error(result.payload || "Failed to update node");
        } else {
          emit("node:data:commit", { workspaceId, nodeId, data: latestNode.data });
        }

        delete colorTimersRef.current[timerKey];
      }, 800);
    },
    [dispatch, selectedNode, workspaceId]
  );



  // Guards against double-commit when blur + Enter + selection-change fire close together
  const savingTextRef = useRef(false);

  const handleEditorSave = useCallback(async () => {
    if (!editingNodeId || savingTextRef.current) return;
    savingTextRef.current = true;

    // Cancel any in-flight live-typing broadcast so a stale value can't
    // overwrite the just-committed correct text on remote clients
    if (textEmitTimerRef.current) {
      clearTimeout(textEmitTimerRef.current);
      textEmitTimerRef.current = null;
    }
    pendingTextValueRef.current = null;


    const node = nodesMap[editingNodeId];
    if (!node) {
      savingTextRef.current = false;
      return;
    }

    const textKey = NODE_TEXT_KEYS[node.type];
    const nextData = { ...(node.data || {}), [textKey]: editingValue };

    const result = await dispatch(
      updateCanvasNode({
        workspaceId,
        nodeId: editingNodeId,
        payload: { data: nextData },
      })
    );

    savingTextRef.current = false;

    if (updateCanvasNode.rejected.match(result)) {
      toast.error(result.payload || "Failed to update node");
      return;
    }

    setEditingNodeId(null);
  }, [dispatch, editingNodeId, editingValue, nodesMap, workspaceId]);

  // Commit whatever was being typed whenever selection moves away from the node being edited
  const prevEditingNodeIdRef = useRef(null);

  useEffect(() => {
    const previous = prevEditingNodeIdRef.current;
    if (previous && previous !== editingNodeId) {
      // selection changed away from the node that was being edited — flush it
      handleEditorSave();
    }
    prevEditingNodeIdRef.current = editingNodeId;
  }, [selectedNode?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleEditorKeyDown = useCallback(
    async (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        await handleEditorSave();
      }

      if (event.key === "Escape") {
        setEditingNodeId(null);
      }
    },
    [handleEditorSave]
  );

  const inspectorColors = selectedNode ? COLOR_FIELDS[selectedNode.type] || [] : [];
  // const overlayStyle = selectedNodeBounds
  //   ? {
  //     left: `${selectedNodeBounds.x * viewport.scale + viewport.x}px`,
  //     top: `${selectedNodeBounds.y * viewport.scale + viewport.y}px`,
  //     width: `${selectedNodeBounds.width * viewport.scale}px`,
  //     height: `${selectedNodeBounds.height * viewport.scale}px`,
  //   }
  //   : null;

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedNodeIds.length) return;
    for (const nodeId of selectedNodeIds) {
      const result = await dispatch(deleteCanvasNode({ workspaceId, nodeId }));
      if (deleteCanvasNode.rejected.match(result)) {
        toast.error(result.payload || "Failed to delete node");
        return;
      }
    }

    setSelectedNodeIds([]);
  }, [dispatch, selectedNodeIds, workspaceId]);

  const renderNode = (node) => {
    const commonProps = {
      node,
      isSelected: selectedNodeIds.includes(node.id),
      onDragEnd: handleNodeDragEnd,
      onClick: handleNodeClick,
    };

    switch (node.type) {
      case "sticky": return <StickyNode key={node.id} {...commonProps} onDragMove={handleNodeDragMove} onTransform={handleNodeTransform} onTransformEnd={handleNodeTransformEnd} onDoubleClick={handleNodeDoubleClick} />;
      case "text": return <TextNode key={node.id} {...commonProps} onDragMove={handleNodeDragMove} onTransform={handleNodeTransform} onTransformEnd={handleNodeTransformEnd} onDoubleClick={handleNodeDoubleClick} />;
      case "rectangle":
      case "circle": return <ShapeNode key={node.id} {...commonProps} onDragMove={handleNodeDragMove} onTransform={handleNodeTransform} onTransformEnd={handleNodeTransformEnd} onDoubleClick={handleNodeDoubleClick} />;
      case "arrow": return <ArrowNode key={node.id} {...commonProps} onDragMove={handleNodeDragMove} onTransform={handleNodeTransform} onTransformEnd={handleNodeTransformEnd} onDoubleClick={handleNodeDoubleClick} canEdit={canEditCanvas}
        onEndpointDragMove={handleArrowEndpointDragMove}
        onEndpointDragEnd={handleArrowEndpointDragEnd} />;
      default: return null;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[color:var(--bg-primary)]">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[color:var(--bg-primary)]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-[color:var(--text-secondary)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading canvas…</span>
          </div>
        </div>
      )}

      {/* Delete button for selected node */}
      {selectedNodeIds.length > 0 && canEditCanvas && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[color:var(--bg-surface)] border border-[color:var(--border)] text-[color:var(--danger)] text-sm font-medium shadow-md hover:bg-[color:var(--danger)]/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete node
          </button>
        </div>
      )}

      {/* Cursor hint when tool is active */}
      {activeTool !== "select" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="bg-[color:var(--accent)] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-md">
            Click to place {activeTool}
          </span>
        </div>
      )}

      {/* Konva Stage */}
      <Stage

        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        draggable={activeTool === "select"}
        onWheel={handleWheel}
        onMouseDown={handleStagePointerDown}
        onMouseMove={handleStagePointerMove}
        onMouseUp={handleStagePointerUp}
        onClick={handleStageClick}
        onDragEnd={(e) => {
          if (e.target !== e.target.getStage()) {
            return;
          }
          setViewport((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
        }}



        style={{ cursor: activeTool === "select" ? "grab" : "crosshair" }}
      >
        {/* Grid layer */}
        <Layer listening={false}>
          {gridLines.map((line) => (
            <Line
              key={line.key}
              points={line.points}
              stroke={gridColor}
              strokeWidth={1 / viewport.scale}
              listening={false}
            />
          ))}
        </Layer>

        {/* Nodes layer */}
        <Layer>
          {nodes.map(renderNode)}

          {creationDraft && activeTool !== "arrow" && (() => {
            const current = creationDraft.current || creationDraft.start;
            const left = Math.min(creationDraft.start.x, current.x);
            const top = Math.min(creationDraft.start.y, current.y);
            const width = Math.max(24, Math.abs(current.x - creationDraft.start.x));
            const height = Math.max(24, Math.abs(current.y - creationDraft.start.y));
            const draftData = buildPresetData(creationDraft.tool, { width, height });
            const draftFill = draftData.fill || draftData.color || "#E5E7EB";
            const draftStroke = draftData.stroke || draftData.color || "#A1A1AA";

            return (
              <>
                {creationDraft.tool === "sticky" && (
                  <Rect x={left} y={top} width={width} height={height} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={10} opacity={0.7} listening={false} />
                )}
                {creationDraft.tool === "rectangle" && (
                  <Rect x={left} y={top} width={width} height={height} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={8} opacity={0.7} listening={false} />
                )}
                {creationDraft.tool === "text" && (
                  <>
                    <Rect x={left} y={top} width={Math.max(width, 180)} height={Math.max(height, 48)} fill="transparent" stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={8} opacity={0.7} listening={false} />
                    <Text x={left + 12} y={top + 10} width={Math.max(width, 180) - 24} height={Math.max(height, 48) - 20} text="Text block" fontSize={16} fill={draftStroke} opacity={0.7} listening={false} />
                  </>
                )}
                {creationDraft.tool === "circle" && (
                  <Circle x={left + width / 2} y={top + height / 2} radius={Math.max(width, height) / 2} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} opacity={0.7} listening={false} />
                )}
              </>
            );
          })()}

          {arrowDraft && activeTool === "arrow" && (
            <Arrow
              x={arrowDraft.start.x}
              y={arrowDraft.start.y}
              points={[0, 0, arrowDraft.end.x - arrowDraft.start.x, arrowDraft.end.y - arrowDraft.start.y]}
              stroke="#6366F1"
              fill="#6366F1"
              strokeWidth={2 / viewport.scale}
              dash={[6, 4]}
              pointerLength={10}
              pointerWidth={8}
              listening={false}
            />
          )}
          {remoteDraft && remoteDraft.type === "arrow" && (
            <Arrow
              x={remoteDraft.start.x}
              y={remoteDraft.start.y}
              points={[0, 0, remoteDraft.end.x - remoteDraft.start.x, remoteDraft.end.y - remoteDraft.start.y]}
              stroke="#F97316"
              fill="#F97316"
              strokeWidth={2 / viewport.scale}
              dash={[6, 4]}
              pointerLength={10}
              pointerWidth={8}
              opacity={0.7}
              listening={false}
            />
          )}

          {remoteDraft && remoteDraft.tool && (() => {
            const current = remoteDraft.current || remoteDraft.start;
            const left = Math.min(remoteDraft.start.x, current.x);
            const top = Math.min(remoteDraft.start.y, current.y);
            const width = Math.max(24, Math.abs(current.x - remoteDraft.start.x));
            const height = Math.max(24, Math.abs(current.y - remoteDraft.start.y));
            const draftData = buildPresetData(remoteDraft.tool, { width, height });
            const draftFill = draftData.fill || draftData.color || "#FED7AA";
            const draftStroke = "#F97316";

            return (
              <>
                {remoteDraft.tool === "sticky" && (
                  <Rect x={left} y={top} width={width} height={height} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={10} opacity={0.6} listening={false} />
                )}
                {remoteDraft.tool === "rectangle" && (
                  <Rect x={left} y={top} width={width} height={height} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={8} opacity={0.6} listening={false} />
                )}
                {remoteDraft.tool === "text" && (
                  <Rect x={left} y={top} width={Math.max(width, 180)} height={Math.max(height, 48)} fill="transparent" stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={8} opacity={0.6} listening={false} />
                )}
                {remoteDraft.tool === "circle" && (
                  <Circle x={left + width / 2} y={top + height / 2} radius={Math.max(width, height) / 2} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} opacity={0.6} listening={false} />
                )}
              </>
            );
          })()}


          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            keepRatio={selectedNode?.type === "circle" || isShiftPressed}
            enabledAnchors={
              selectedNode?.type === "circle" || isShiftPressed
                ? ["top-left", "top-right", "bottom-left", "bottom-right"]
                : [
                  "top-left",
                  "top-center",
                  "top-right",
                  "middle-right",
                  "bottom-right",
                  "bottom-center",
                  "bottom-left",
                  "middle-left",
                ]
            }
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 40 || newBox.height < 32) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>

        {/* Remote cursors */}
        <Layer listening={false}>
          {Object.values(remoteCursors).map((cursor) => (
            <Group key={`cursor-group-${cursor.userId}`} listening={false}>
              <Path
                x={cursor.x}
                y={cursor.y}
                data="M0 0 L0 16 L4 12.5 L6.5 18 L8.5 17 L6 11.5 L11 11.5 Z"
                fill="#2563EB"
                stroke="#ffffff"
                strokeWidth={1}
                opacity={0.9}
              />
              <Text
                x={cursor.x + 12}
                y={cursor.y - 10}
                text={cursor.name || "Guest"}
                fontSize={12}
                fill="#ffffff"
                fontStyle="bold"
                listening={false}
              />
            </Group>
          ))}
        </Layer>
      </Stage>

      {selectedNode && selectedNodeBounds && !editingNodeId && (
        <div
          className="absolute z-20 w-72 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-3 shadow-2xl"
          style={{ right: 16, top: 80 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">Node inspector</p>
              <p className="text-xs text-[color:var(--text-secondary)] capitalize">{selectedNode.type}</p>
            </div>
            <button
              onClick={() => setSelectedNodeIds([])}
              className="text-xs font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            >
              Clear
            </button>
          </div>

          <div className="mb-3 text-xs text-[color:var(--text-secondary)]">
            Double-click the node to edit its text. Resize with the corner handles.
          </div>

          {inspectorColors.length > 0 && (
            <div className="space-y-3">
              {inspectorColors.includes("fill") && (
                <div>
                  <p className="mb-2 text-xs font-medium text-[color:var(--text-secondary)]">Fill</p>
                  <HexColorPicker
                    color={selectedNode.data?.fill || "#FFFFFF"}
                    onChange={(color) => handleInspectorChange("fill", color)}
                  />
                </div>
              )}

              {inspectorColors.includes("stroke") && (
                <div>
                  <p className="mb-2 text-xs font-medium text-[color:var(--text-secondary)]">Border</p>
                  <HexColorPicker
                    color={selectedNode.data?.stroke || "#000000"}
                    onChange={(color) => handleInspectorChange("stroke", color)}
                  />
                </div>
              )}

              {inspectorColors.includes("color") && selectedNode.type === "text" && (
                <div>
                  <p className="mb-2 text-xs font-medium text-[color:var(--text-secondary)]">Text color</p>
                  <HexColorPicker
                    color={selectedNode.data?.color || "#18181B"}
                    onChange={(color) => handleInspectorChange("color", color)}
                  />
                </div>
              )}

              {inspectorColors.includes("textColor") && selectedNode.type === "sticky" && (
                <div>
                  <p className="mb-2 text-xs font-medium text-[color:var(--text-secondary)]">Text color</p>
                  <HexColorPicker
                    color={selectedNode.data?.textColor || "#18181B"}
                    onChange={(color) => handleInspectorChange("textColor", color)}
                  />
                </div>
              )}

              {selectedNode.type === "arrow" && (
                <div>
                  <p className="mb-2 text-xs font-medium text-[color:var(--text-secondary)]">Arrow color</p>
                  <HexColorPicker
                    color={selectedNode.data?.color || "#6366F1"}
                    onChange={(color) => handleInspectorChange("color", color)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {editingNodeId && selectedNodeBounds && (
        <div
          className="absolute z-30 rounded-xl border border-[color:var(--accent)] bg-[color:var(--bg-surface)] shadow-2xl"
          style={{
            left: `${selectedNodeBounds.x * viewport.scale + viewport.x}px`,
            top: `${selectedNodeBounds.y * viewport.scale + viewport.y}px`,
            width: `${Math.max(selectedNodeBounds.width * viewport.scale, 220)}px`,
            minHeight: `${Math.max(selectedNodeBounds.height * viewport.scale, 64)}px`,
          }}
        >
          <textarea
            autoFocus
            value={editingValue}
            onChange={(event) => {
              const value = event.target.value;
              setEditingValue(value);

              if (!textEmitTimerRef.current) {
                emit("canvas:text", { workspaceId, nodeId: editingNodeId, value });
                textEmitTimerRef.current = setTimeout(() => {
                  textEmitTimerRef.current = null;
                  if (pendingTextValueRef.current !== null) {
                    const pending = pendingTextValueRef.current;
                    pendingTextValueRef.current = null;
                    emit("canvas:text", { workspaceId, nodeId: editingNodeId, value: pending });
                  }
                }, 120);
              } else {
                pendingTextValueRef.current = value;
              }
            }}
            onBlur={handleEditorSave}
            onKeyDown={handleEditorKeyDown}
            className="h-full w-full resize-none rounded-xl bg-transparent p-3 text-sm text-[color:var(--text-primary)] outline-none"
            placeholder="Enter text"
          />
        </div>
      )}

      {/* Toolbar */}
      <CanvasToolbar activeTool={activeTool} onToolChange={setActiveTool} activeColor={activeColor} onColorChange={setActiveColor} />

      {/* Zoom indicator */}
      <div className="absolute bottom-20 right-4 z-10 text-xs text-[color:var(--text-secondary)] bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg px-2.5 py-1.5 shadow-sm font-mono">
        {Math.round(viewport.scale * 100)}%
      </div>

      {/* Empty state */}
      {!loading && nodes.length === 0 && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center gap-3">
          <p className="text-[color:var(--text-secondary)] text-sm font-medium opacity-60">
            Select a tool and click to place your first node
          </p>
        </div>
      )}
    </div>
  );
}
