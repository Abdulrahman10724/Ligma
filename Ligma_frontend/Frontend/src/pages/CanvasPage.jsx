import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Check, MessageSquare } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Arrow, Circle, Group, Layer, Line, Rect, Stage, Text, Transformer, Path } from "react-konva";
import ToolStylePanel, { STROKE_COLORS, BACKGROUND_COLORS } from "../components/canvas/ToolStylePanel";
import ColorSwatchPicker from "../components/canvas/ColorSwatchPicker";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import useSocket from "../hooks/useSocket";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { computeNodePermissions, useNodePermissions } from "../hooks/useNodePermissions";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import CanvasChatDrawer from "../components/chat/CanvasChatDrawer";

import { fetchWorkspaceMembers } from "../redux/memberSlice";

import { Button } from "../components/ui/button";



import {
  fetchCanvasNodes,
  createCanvasNode,
  updateCanvasNode,
  deleteCanvasNode,
  lockCanvasNode,
  unlockCanvasNode,
  updateCanvasNodePermissions,
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
import CanvasPresenceLayer from "../components/presence/CanvasPresenceLayer";
import usePresenceZones from "../hooks/usePresenceZones";

const GRID_SIZE = 40;
// Grid color read from CSS custom property so it respects the active theme
function getCanvasGridColor() {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--canvas-grid")
      .trim() || "rgba(50,70,65,0.10)"
  );
}

// Default data payloads for each node type
const DEFAULT_NODE_DATA = {
  sticky: { color: "yellow", fill: "#FEF3C7", text: "New note", textColor: "#18181B", width: 200, height: 160 },
  text: { text: "Text block", fontSize: 16, color: "#18181B", width: 180, height: 48 },
  rectangle: { width: 160, height: 100, fill: "rgba(0,0,0,0)", stroke: "#000000", label: "" },
  circle: { radius: 60, fill: "rgba(0,0,0,0)", stroke: "#000000", label: "" },
  arrow: { dx: 150, dy: 0, color: "#0F766E", label: "" },
  diamond: { width: 160, height: 160, fill: "rgba(0,0,0,0)", stroke: "#000000", label: "" },
  triangle: { width: 160, height: 160, fill: "rgba(0,0,0,0)", stroke: "#000000", label: "" },
  line: { dx: 150, dy: 0, color: "#0F766E", label: "" },
};

const MIN_DIMENSIONS = {
  sticky: { width: 140, height: 110, maxAspect: 2.2 },
  text: { width: 100, height: 32 },
  rectangle: { width: 40, height: 32 },
  circle: { width: 40, height: 40 },
  diamond: { width: 40, height: 40 },
  triangle: { width: 40, height: 40 },
};

const RESIZABLE_NODE_TYPES = new Set(["sticky", "text", "rectangle", "circle", "diamond", "triangle"]);

const COLOR_FIELDS = {
  sticky: ["fill", "textColor"],
  text: ["color"],
  rectangle: ["fill", "stroke"],
  circle: ["fill", "stroke"],
  arrow: ["color"],
  diamond: ["fill", "stroke"],
  triangle: ["fill", "stroke"],
  line: ["color"],
};

const NODE_TEXT_KEYS = {
  sticky: "text",
  text: "text",
  rectangle: "label",
  circle: "label",
  arrow: "label",
  diamond: "label",
  triangle: "label",
  line: "label",
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
  const [searchParams, setSearchParams] = useSearchParams();
const nodesMap = useSelector((state) => state.canvas.nodes);
const loading = useSelector((state) => state.canvas.loading);
  // const { activeWorkspace } = useSelector((state) => state.workspace);
  const { user: currentUser } = useSelector((state) => state.auth);
  const { workspaceRole, isLead, canEditWorkspace } = useWorkspaceRole();
  const { items: zones, saving: zonesSaving, createZone, updateZone, removeZone } = usePresenceZones(workspaceId);
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
  const [toolStrokeColor, setToolStrokeColor] = useState("#1e1e1e");
  const [toolFillColor, setToolFillColor] = useState("#FEF3C7");
  const [toolStrokeWidth, setToolStrokeWidth] = useState(2);
  const [toolEdges, setToolEdges] = useState("round");
  const [toolOpacity, setToolOpacity] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Presentational-only chat drawer state — does not touch canvas, socket, or Redux canvas logic
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [draftAllowedUserIds, setDraftAllowedUserIds] = useState([]);
const [savingPermissions, setSavingPermissions] = useState(false);
  const { list: members } = useSelector((state) => state.members);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [presenceUsers, setPresenceUsers] = useState([]);
  const [localCursor, setLocalCursor] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const colorTimersRef = useRef({});
  const clipboardNodeRef = useRef(null);
  const dragEmitRef = useRef(0);
  const pendingNodeUpdatesRef = useRef({}); // nodeId -> { x, y, dataPatch }
const updateRafRef = useRef(null);

const flushPendingNodeUpdates = useCallback(() => {
  updateRafRef.current = null;
  const pending = pendingNodeUpdatesRef.current;
  pendingNodeUpdatesRef.current = {};
  Object.entries(pending).forEach(([nodeId, update]) => {
    if (update.x !== undefined && update.y !== undefined) {
      dispatch(updateNodePositionLocally({ nodeId, x: update.x, y: update.y }));
    }
    if (update.dataPatch) {
      dispatch(updateNodeDataLocally({ nodeId, patch: update.dataPatch }));
    }
  });
}, [dispatch]);

const scheduleNodeUpdate = useCallback((nodeId, update) => {
  pendingNodeUpdatesRef.current[nodeId] = {
    ...pendingNodeUpdatesRef.current[nodeId],
    ...update,
  };
  if (!updateRafRef.current) {
    updateRafRef.current = requestAnimationFrame(flushPendingNodeUpdates);
  }
}, [flushPendingNodeUpdates]);
  const draggingNodeRef = useRef(false);
  const editingNodeIdRef = useRef(null);
  const localCursorRafRef = useRef(null);
  const draftRectRef = useRef(null);       // sticky / rectangle
  const draftPolygonRef = useRef(null);    // diamond / triangle
  const draftCircleRef = useRef(null);
  const draftTextRectRef = useRef(null);
  const draftTextLabelRef = useRef(null);
  const draftLineRef = useRef(null);       // "line" tool
  const arrowShapeRef = useRef(null);
  const creationDraftRef = useRef(null);   // mutable {tool, start, current}
  const arrowDraftRef = useRef(null);      // mutable {start, end}
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
  dispatch(fetchWorkspaceMembers(workspaceId));
  return () => {
    dispatch(clearCanvas());
  };
}, [dispatch, workspaceId]);



const nodes = useMemo(() => Object.values(nodesMap), [nodesMap]);
const sortedNodes = useMemo(
  () => [...nodes].sort((a, b) => (a.parentNodeId ? 1 : 0) - (b.parentNodeId ? 1 : 0)),
  [nodes]
);
  const selectedNodeId = selectedNodeIds[0] || null;
  const selectedNode = selectedNodeId ? nodesMap[selectedNodeId] : null;
  const selectedNodePermissions = useNodePermissions(selectedNode);
  const canEditCanvas = canEditWorkspace;
  const gridLines = useMemo(
    () => buildGridLines(dimensions.width, dimensions.height, viewport.scale, viewport.x, viewport.y),
    [dimensions.width, dimensions.height, viewport.scale, viewport.x, viewport.y]
  );
  // Re-compute from CSS property on each render (reactive to isDarkMode state changes)
  const gridColor = getCanvasGridColor();

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

  useEffect(() => {
    const handlePresence = (payload) => {
      if (payload?.workspaceId !== workspaceId) return;
      setPresenceUsers(payload?.users || []);
    };

    on("workspace:presence", handlePresence);
    return () => {
      off("workspace:presence", handlePresence);
    };
  }, [off, on, workspaceId]);

  const getNodeBounds = useCallback((node) => {
    if (!node) return null;

    const data = node.data || {};
    if (node.type === "circle") {
      const radius = data.radius || DEFAULT_NODE_DATA.circle.radius;
      return { x: node.x - radius, y: node.y - radius, width: radius * 2, height: radius * 2 };
    }

    if (node.type === "line") {
      const dx = data.dx ?? DEFAULT_NODE_DATA.line.dx;
      const dy = data.dy ?? DEFAULT_NODE_DATA.line.dy;
      return {
        x: node.x + Math.min(0, dx),
        y: node.y + Math.min(0, dy),
        width: Math.max(1, Math.abs(dx)),
        height: Math.max(1, Math.abs(dy)),
      };
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

    if (node.type === "rectangle" || node.type === "diamond" || node.type === "triangle") {
      return {
        x: node.x,
        y: node.y,
        width: data.width || DEFAULT_NODE_DATA[node.type]?.width || DEFAULT_NODE_DATA.rectangle.width,
        height: data.height || DEFAULT_NODE_DATA[node.type]?.height || DEFAULT_NODE_DATA.rectangle.height,
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
  const currentNode = latestNodesRef.current[selectedNodeId];   // ref se, dependency nahi

  if (
    !transformer ||
    !stage ||
    !selectedNodeId ||
    !currentNode ||
    !RESIZABLE_NODE_TYPES.has(currentNode.type) ||
    !selectedNodePermissions.canResize
  ) {
    transformer?.nodes([]);
    return;
  }

  const selectedShape = stage.findOne(`#node-${selectedNodeId}`);
  if (selectedShape) {
    transformer.nodes([selectedShape]);
    transformer.getLayer()?.batchDraw();
  }
}, [selectedNodeId, selectedNode?.type, selectedNodePermissions.canResize]);useEffect(() => {
    if (editingNodeId && !selectedNodePermissions.canEdit) {
      setEditingNodeId(null);
    }
  }, [editingNodeId, selectedNodePermissions.canEdit]);

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

    const handleNodeLocked = (payload) => {
      if (payload?.workspaceId !== workspaceId || payload?.actorId === currentUser?.id) return;
      if (payload?.node) {
        dispatch(upsertNodeLocally(payload.node));
      }
    };

    const handleNodeUnlocked = (payload) => {
      if (payload?.workspaceId !== workspaceId || payload?.actorId === currentUser?.id) return;
      if (payload?.node) {
        dispatch(upsertNodeLocally(payload.node));
      }
    };

    const handleNodePermissionsUpdated = (payload) => {
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

        // Collaborative live-sync: if we are ALSO currently editing this exact
        // node, mirror the incoming keystroke into our own textarea so both
        // editors see each other's changes in real time instead of only
        // after save (Google-Docs-style live preview).
        if (editingNodeIdRef.current === payload.nodeId) {
          setEditingValue(payload.value);
        }
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
    on("canvas:node-locked", handleNodeLocked);
    on("canvas:node-unlocked", handleNodeUnlocked);
    on("canvas:node-permissions-updated", handleNodePermissionsUpdated);
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
      off("canvas:node-locked", handleNodeLocked);
      off("canvas:node-unlocked", handleNodeUnlocked);
      off("canvas:node-permissions-updated", handleNodePermissionsUpdated);
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

  useEffect(() => {
    if (!canEditCanvas && activeTool !== "select") {
      setActiveTool("select");
    }
  }, [activeTool, canEditCanvas]);

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
          fill: toolFillColor === "transparent" ? DEFAULT_NODE_DATA.sticky.fill : toolFillColor,
          textColor: DEFAULT_NODE_DATA.sticky.textColor,
          width: width || DEFAULT_NODE_DATA.sticky.width,
          height: height || DEFAULT_NODE_DATA.sticky.height,
        };
      }

      if (tool === "text") {
        return {
          ...DEFAULT_NODE_DATA.text,
          color: toolStrokeColor,
          width: width || DEFAULT_NODE_DATA.text.width,
          height: height || DEFAULT_NODE_DATA.text.height,
        };
      }

      if (tool === "rectangle") {
        return {
          ...DEFAULT_NODE_DATA.rectangle,
          fill: toolFillColor === "transparent" ? "rgba(0,0,0,0)" : toolFillColor,
          stroke: toolStrokeColor,
          strokeWidth: toolStrokeWidth,
          cornerRadius: toolEdges === "round" ? 8 : 0,
          opacity: toolOpacity,
          width: width || DEFAULT_NODE_DATA.rectangle.width,
          height: height || DEFAULT_NODE_DATA.rectangle.height,
        };
      }

      if (tool === "diamond" || tool === "triangle") {
        const sizeValue = Math.max(width, height) || DEFAULT_NODE_DATA[tool].width;
        return {
          ...DEFAULT_NODE_DATA[tool],
          fill: toolFillColor === "transparent" ? "rgba(0,0,0,0)" : toolFillColor,
          stroke: toolStrokeColor,
          strokeWidth: toolStrokeWidth,
          opacity: toolOpacity,
          width: sizeValue,
          height: sizeValue,
        };
      }

      if (tool === "circle") {
        const radius = Math.max(24, Math.round(Math.max(width, height) / 2) || DEFAULT_NODE_DATA.circle.radius);
        return {
          ...DEFAULT_NODE_DATA.circle,
          fill: toolFillColor === "transparent" ? "rgba(0,0,0,0)" : toolFillColor,
          stroke: toolStrokeColor,
          strokeWidth: toolStrokeWidth,
          opacity: toolOpacity,
          radius,
        };
      }

      if (tool === "arrow") {
        return {
          ...DEFAULT_NODE_DATA.arrow,
          color: toolStrokeColor,
        };
      }

      if (tool === "line") {
        return {
          ...DEFAULT_NODE_DATA.line,
          color: toolStrokeColor,
          dx: size.dx ?? DEFAULT_NODE_DATA.line.dx,
          dy: size.dy ?? DEFAULT_NODE_DATA.line.dy,
        };
      }

      return DEFAULT_NODE_DATA[tool] || {};
    },
    [toolFillColor, toolStrokeColor, toolStrokeWidth, toolEdges, toolOpacity]
  );

  const commitCreationDraft = useCallback(
    async (draft) => {
      if (!draft) return;

      const point = draft.current || draft.start;
      const width = Math.abs(point.x - draft.start.x);
      const height = Math.abs(point.y - draft.start.y);
      const x = Math.min(draft.start.x, point.x);
      const y = Math.min(draft.start.y, point.y);

      if (draft.tool === "line") {
        const payload = {
          type: "line",
          x: Math.round(draft.start.x),
          y: Math.round(draft.start.y),
          data: buildPresetData("line", {
            dx: Math.round(point.x - draft.start.x),
            dy: Math.round(point.y - draft.start.y),
          }),
        };

        const result = await dispatch(createCanvasNode({ workspaceId, payload }));
        if (createCanvasNode.rejected.match(result)) {
          toast.error(result.payload || "Failed to create node");
        }
        return;
      }

      const size = draft.tool === "circle" || draft.tool === "diamond" || draft.tool === "triangle"
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

    if (!computeNodePermissions(node, workspaceRole,currentUser?.id).canEdit) {
      savingTextRef.current = false;
      setEditingNodeId(null);
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
  }, [dispatch, editingNodeId, editingValue, nodesMap, workspaceId, workspaceRole,currentUser?.id]);


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
        creationDraftRef.current = null;
        setArrowDraft({ start: point, end: point });
        arrowDraftRef.current = { start: point, end: point };
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
      arrowDraftRef.current = null;
      emit("canvas:draft", { workspaceId, draft: null });
      setCreationDraft({ tool: activeTool, start: point, current: point });
      creationDraftRef.current = { tool: activeTool, start: point, current: point };
    },
    [activeTool, canEditCanvas, getCanvasPoint]
  );

  const draftEmitTimerRef = useRef(null);
  const handleStagePointerMove = useCallback(() => {
    const point = getCanvasPoint();
    if (!point) return;

    emitCursorPosition(point);

    if (!localCursorRafRef.current) {
      localCursorRafRef.current = requestAnimationFrame(() => {
        localCursorRafRef.current = null;
        setLocalCursor(point);
      });
    }

    if (arrowDraft && activeTool === "arrow") {
      const rawDx = point.x - arrowDraft.start.x;
      const rawDy = point.y - arrowDraft.start.y;
      const { dx: snappedDx, dy: snappedDy } = snapArrowVector(rawDx, rawDy, isShiftPressed);

      arrowDraftRef.current = {
        start: arrowDraft.start,
        end: { x: arrowDraft.start.x + snappedDx, y: arrowDraft.start.y + snappedDy },
      };
      arrowShapeRef.current?.setAttrs({ points: [0, 0, snappedDx, snappedDy] });
      stageRef.current?.batchDraw();

      if (!draftEmitTimerRef.current) {
        draftEmitTimerRef.current = setTimeout(() => {
          emit("canvas:draft", { workspaceId, draft: { type: "arrow", start: arrowDraft.start, end: point } });
          draftEmitTimerRef.current = null;
        }, 50);
      }
    }

    if (creationDraft) {
      creationDraftRef.current = { ...creationDraft, current: point };

      const { tool, start } = creationDraft;
      const width = Math.max(24, Math.abs(point.x - start.x));
      const height = Math.max(24, Math.abs(point.y - start.y));
      const left = Math.min(start.x, point.x);
      const top = Math.min(start.y, point.y);

      if (tool === "sticky" || tool === "rectangle") {
        draftRectRef.current?.setAttrs({ x: left, y: top, width, height });
      } else if (tool === "diamond" || tool === "triangle") {
        const points = tool === "diamond"
          ? [width / 2, 0, width, height / 2, width / 2, height, 0, height / 2]
          : [width / 2, 0, width, height, 0, height];
        draftPolygonRef.current?.setAttrs({ x: left, y: top, points });
      } else if (tool === "text") {
        const boxW = Math.max(width, 180);
        const boxH = Math.max(height, 48);
        draftTextRectRef.current?.setAttrs({ x: left, y: top, width: boxW, height: boxH });
        draftTextLabelRef.current?.setAttrs({ x: left + 12, y: top + 10, width: boxW - 24, height: boxH - 20 });
      } else if (tool === "circle") {
        const radius = Math.max(width, height) / 2;
        draftCircleRef.current?.setAttrs({ x: left + width / 2, y: top + height / 2, radius });
      } else if (tool === "line") {
        draftLineRef.current?.setAttrs({ points: [0, 0, point.x - start.x, point.y - start.y] });
      }

      stageRef.current?.batchDraw();

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
      const finalEnd = arrowDraftRef.current?.end || arrowDraft.end;
      const dx = finalEnd.x - arrowDraft.start.x;
      const dy = finalEnd.y - arrowDraft.start.y;
      if (Math.abs(dx) + Math.abs(dy) < 6) {
        setArrowDraft(null);
        arrowDraftRef.current = null;
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
      arrowDraftRef.current = null;
      setActiveTool("select");
      return;
    }

    if (creationDraft) {
      const draft = creationDraftRef.current || creationDraft;
      setCreationDraft(null);
      creationDraftRef.current = null;
      emit("canvas:draft", { workspaceId, draft: null });
      await commitCreationDraft(draft);
      setActiveTool("select");
    }
  }, [activeTool, arrowDraft, canEditCanvas, commitCreationDraft, creationDraft, dispatch, workspaceId, emit]);
  // Stage click → place node (if tool !== select)
  const handleStageClick = useCallback(
    (e) => {
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
    [activeTool]
  );

 const sendDragUpdate = useCallback(
    async (nodeId, x, y, parentNodeId) => {
      const node = nodesMap[nodeId];
      if (!computeNodePermissions(node, workspaceRole,currentUser?.id).canMove) {
        return;
      }

      if (dragInFlightRef.current[nodeId]) {
        // isi node ke liye ek request pehle se chal rahi hai — sirf latest value yaad rakho
        dragPendingRef.current[nodeId] = { x, y, parentNodeId };
        return;
      }

      dragInFlightRef.current[nodeId] = true;

      const payload = { x: Math.round(x), y: Math.round(y) };
      if (parentNodeId !== undefined) {
        payload.parentNodeId = parentNodeId;
      }

      const result = await dispatch(
        updateCanvasNode({ workspaceId, nodeId, payload })
      );

      if (updateCanvasNode.rejected.match(result)) {
        toast.error(result.payload || "Failed to update node");
      }

      dragInFlightRef.current[nodeId] = false;
      // remember latest value if  node drag is started
      const pending = dragPendingRef.current[nodeId];
      if (pending) {
        dragPendingRef.current[nodeId] = null;
        dispatch(updateNodePositionLocally({ nodeId, x: pending.x, y: pending.y }));
        
        sendDragUpdate(nodeId, pending.x, pending.y, pending.parentNodeId);
      }
    },
    [dispatch, nodesMap, workspaceId, workspaceRole,currentUser?.id]
  );
 const handleNodeDragEnd = useCallback(
    (nodeId, x, y) => {
      const node = nodesMap[nodeId];
      if (!computeNodePermissions(node, workspaceRole,currentUser?.id).canMove) {
        return;
      }

      draggingNodeRef.current = false;
      const stage = stageRef.current;
      if (stage) {
        stage.container().style.cursor = activeTool === "select" ? "grab" : "crosshair";
      }

      const deltaX = x - node.x;
      const deltaY = y - node.y;

     delete pendingNodeUpdatesRef.current[nodeId];
dispatch(updateNodePositionLocally({ nodeId, x, y }));
emit("canvas:drag", { workspaceId, nodeId, x: Math.round(x), y: Math.round(y) });

      // Text nodes can be nested inside sticky/rectangle/circle containers.
      let parentNodeId = node.parentNodeId || null;
      if (node.type === "text") {
        const dropTarget = nodes.find((n) => {
          if (n.id === nodeId) return false;
          if (!["sticky", "rectangle", "circle"].includes(n.type)) return false;
          const bounds = getNodeBounds(n);
          if (!bounds) return false;
          return x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height;
        });
        parentNodeId = dropTarget?.id || null;
      }

      sendDragUpdate(nodeId, x, y, parentNodeId);

      // Carry any children (nested text nodes) along with a dragged container.
      if (node.type !== "text") {
        const children = nodes.filter((n) => n.parentNodeId === nodeId);
        children.forEach((child) => {
          const childNextX = child.x + deltaX;
          const childNextY = child.y + deltaY;
          dispatch(updateNodePositionLocally({ nodeId: child.id, x: childNextX, y: childNextY }));
          sendDragUpdate(child.id, childNextX, childNextY, child.parentNodeId);
        });
      }
    },
    [activeTool, dispatch, emit, getNodeBounds, nodes, nodesMap, sendDragUpdate, workspaceId, workspaceRole,currentUser?.id]
  );


  const handleNodeDragMove = useCallback(
    (nodeId, x, y) => {
      const node = nodesMap[nodeId];
      if (!computeNodePermissions(node, workspaceRole,currentUser?.id).canMove) {
        return;
      }

      // A node drag is in progress — force the "move" cursor and stop the
      // hover handlers of other nodes (e.g. drop-target sticky) from
      // overwriting it mid-drag.
      draggingNodeRef.current = true;
      const stage = stageRef.current;
      if (stage && stage.container().style.cursor !== "move") {
        stage.container().style.cursor = "move";
      }

     const deltaX = x - node.x;
const deltaY = y - node.y;

scheduleNodeUpdate(nodeId, { x, y });

if (node.type !== "text") {
  const children = nodes.filter((n) => n.parentNodeId === nodeId);
  children.forEach((child) => {
    scheduleNodeUpdate(child.id, { x: child.x + deltaX, y: child.y + deltaY });
  });
}

      const now = Date.now();
      if (now - dragEmitRef.current > 80) {
        dragEmitRef.current = now;
        emit("canvas:drag", { workspaceId, nodeId, x: Math.round(x), y: Math.round(y) });
      }
    },
    [dispatch, emit, nodes, nodesMap, workspaceId, workspaceRole,currentUser?.id]
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
      if (!computeNodePermissions(node, workspaceRole,currentUser?.id).canEdit) return;

      setSelectedNodeIds([nodeId]);
      setEditingNodeId(nodeId);
      setEditingValue(getNodeTextValue(node));
    },
    [getNodeTextValue, nodesMap, workspaceRole,currentUser?.id]
  );


  const transformEmitTimersRef = useRef({});

  const handleNodeTransform = useCallback(
    (nodeId, target) => {
      const node = nodesMap[nodeId];
      if (!node) return;
      if (!computeNodePermissions(node, workspaceRole,currentUser?.id).canResize) return;

      const data = node.data || {};
      const scaleX = target.scaleX();
      const scaleY = target.scaleY();

      const min = MIN_DIMENSIONS[node.type] || { width: 40, height: 32 };
      const nextData = { ...data };
      if (node.type === "circle") {
        const nextRadius = Math.max(min.width / 2, Math.round((data.radius || DEFAULT_NODE_DATA.circle.radius) * Math.max(scaleX, scaleY)));
        nextData.radius = nextRadius;
      } else if (node.type === "diamond" || node.type === "triangle") {
        const baseWidth = data.width || DEFAULT_NODE_DATA[node.type]?.width || 160;
        const baseHeight = data.height || DEFAULT_NODE_DATA[node.type]?.height || 160;
        const nextSize = Math.max(min.width, Math.max(baseWidth * scaleX, baseHeight * scaleY));
        nextData.width = Math.round(nextSize);
        nextData.height = Math.round(nextSize);
      } else {
        const baseWidth = data.width || DEFAULT_NODE_DATA[node.type]?.width || 160;
        const baseHeight = data.height || DEFAULT_NODE_DATA[node.type]?.height || 100;
        let nextWidth = Math.max(min.width, Math.round(baseWidth * scaleX));
        let nextHeight = Math.max(min.height, Math.round(baseHeight * scaleY));

        if (node.type === "sticky" && min.maxAspect) {
          const ratio = nextWidth / nextHeight;
          if (ratio > min.maxAspect) nextWidth = Math.round(nextHeight * min.maxAspect);
          if (ratio < 1 / min.maxAspect) nextHeight = Math.round(nextWidth * min.maxAspect);
        }

        nextData.width = nextWidth;
        nextData.height = nextHeight;
      }

      // Reset scale immediately so x/y aren't combined with a stale scale
      // factor on the next drag tick (fixes left/top anchor jump).
      target.scaleX(1);
      target.scaleY(1);

    scheduleNodeUpdate(nodeId, { x: target.x(), y: target.y(), dataPatch: nextData });

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
    [dispatch, emit, nodesMap, workspaceId, workspaceRole,currentUser?.id]
  );

  const handleNodeTransformEnd = useCallback(
    async (nodeId, target) => {
      const node = nodesMap[nodeId];
      if (!node) return;
      if (!computeNodePermissions(node, workspaceRole,currentUser?.id).canResize) return;

      const data = node.data || {};
      const scaleX = target.scaleX();
      const scaleY = target.scaleY();

      target.scaleX(1);
      target.scaleY(1);

      const min = MIN_DIMENSIONS[node.type] || { width: 40, height: 32 };
      const nextData = { ...data };
      if (node.type === "circle") {
        const nextRadius = Math.max(min.width / 2, Math.round((data.radius || DEFAULT_NODE_DATA.circle.radius) * Math.max(scaleX, scaleY)));
        nextData.radius = nextRadius;
      } else if (node.type === "diamond" || node.type === "triangle") {
        const baseWidth = data.width || DEFAULT_NODE_DATA[node.type]?.width || 160;
        const baseHeight = data.height || DEFAULT_NODE_DATA[node.type]?.height || 160;
        const nextSize = Math.max(min.width, Math.max(baseWidth * scaleX, baseHeight * scaleY));
        nextData.width = Math.round(nextSize);
        nextData.height = Math.round(nextSize);
      } else {
        const baseWidth = data.width || DEFAULT_NODE_DATA[node.type]?.width || 160;
        const baseHeight = data.height || DEFAULT_NODE_DATA[node.type]?.height || 100;
        let nextWidth = Math.max(min.width, Math.round(baseWidth * scaleX));
        let nextHeight = Math.max(min.height, Math.round(baseHeight * scaleY));

        if (node.type === "sticky" && min.maxAspect) {
          const ratio = nextWidth / nextHeight;
          if (ratio > min.maxAspect) nextWidth = Math.round(nextHeight * min.maxAspect);
          if (ratio < 1 / min.maxAspect) nextHeight = Math.round(nextWidth * min.maxAspect);
        }

        nextData.width = nextWidth;
        nextData.height = nextHeight;
      }

delete pendingNodeUpdatesRef.current[nodeId];
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
    [dispatch, emit, nodesMap, workspaceId, workspaceRole,currentUser?.id]
  );

  const handleArrowEndpointDragMove = useCallback(
    (nodeId, endpoint, localX, localY) => {
      const node = nodesMap[nodeId];
      if (!node) return;
      if (!computeNodePermissions(node, workspaceRole,currentUser?.id).canResize) return;

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
    [dispatch, isShiftPressed, nodesMap, workspaceRole,currentUser?.id]
  );

  const handleArrowEndpointDragEnd = useCallback(
    async (nodeId, endpoint, localX, localY) => {
      const node = nodesMap[nodeId];
      if (!computeNodePermissions(node, workspaceRole,currentUser?.id).canResize) return;

      handleArrowEndpointDragMove(nodeId, endpoint, localX, localY);

      // dispatch ke baad latest state se hi save karo (redux batching safe)
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
    [dispatch, emit, handleArrowEndpointDragMove, isShiftPressed, nodesMap, workspaceId, workspaceRole,currentUser?.id]
  );

 const latestNodesRef = useRef(nodesMap);

  useEffect(() => {
    latestNodesRef.current = nodesMap;
  }, [nodesMap]);

  useEffect(() => {
    editingNodeIdRef.current = editingNodeId;
  }, [editingNodeId]);
  const colorEmitTimersRef = useRef({});

  const handleInspectorChange = useCallback(
    (field, value) => {
      if (!selectedNode) return;
      if (!selectedNodePermissions.canEdit) return;

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
    [dispatch, selectedNode, selectedNodePermissions.canEdit, workspaceId, emit]
  );



  // Guards against double-commit when blur + Enter + selection-change fire close together
  const savingTextRef = useRef(false);

  
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
      const node = nodesMap[nodeId];
      const permissions = computeNodePermissions(node, workspaceRole,currentUser?.id);
      if (!permissions.canDelete) {
        toast.error("You don't have permission to delete this node");
        return;
      }
      const result = await dispatch(deleteCanvasNode({ workspaceId, nodeId }));
      if (deleteCanvasNode.rejected.match(result)) {
        toast.error(result.payload || "Failed to delete node");
        return;
      }
    }

    setSelectedNodeIds([]);
  }, [dispatch, nodesMap, selectedNodeIds, workspaceId, workspaceRole,currentUser?.id]);

  const handleToggleSelectedNodeLock = useCallback(async () => {
    if (!selectedNode?.id || !isLead) return;

    const thunk = selectedNode.locked ? unlockCanvasNode : lockCanvasNode;
    const result = await dispatch(thunk({ workspaceId, nodeId: selectedNode.id }));
    if (thunk.rejected.match(result)) {
      toast.error(result.payload || "Failed to update lock state");
    }
  }, [dispatch, isLead, selectedNode, workspaceId]);

// Fetch members once when the dialog is opened
useEffect(() => {
  if (isPermissionsOpen && workspaceId) {
    dispatch(fetchWorkspaceMembers(workspaceId));
  }
}, [isPermissionsOpen, workspaceId, dispatch]);

// Seed the draft selection from the currently-selected node whenever the dialog opens
useEffect(() => {
  if (isPermissionsOpen && selectedNode) {
    setDraftAllowedUserIds(selectedNode.allowedUserIds || []);
  }
}, [isPermissionsOpen, selectedNode]);

const toggleDraftPermission = useCallback((userId) => {
  setDraftAllowedUserIds((prev) =>
    prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
  );
}, []);

const handleSavePermissions = useCallback(async () => {
  if (!selectedNode?.id || !isLead) return;
  setSavingPermissions(true);

  const result = await dispatch(
    updateCanvasNodePermissions({
      workspaceId,
      nodeId: selectedNode.id,
      payload: { allowedUserIds: draftAllowedUserIds },
    })
  );

  setSavingPermissions(false);

  if (updateCanvasNodePermissions.rejected.match(result)) {
    toast.error(result.payload || "Failed to update permissions");
    return;
  }

  toast.success("Permissions updated");
  setIsPermissionsOpen(false);
}, [dispatch, draftAllowedUserIds, isLead, selectedNode, workspaceId]);

//  const handlePermissionsChange = useCallback(
//   async (userId, checked) => {
//     if (!selectedNode?.id || !isLead) return;

//     const currentUserIds = Array.isArray(selectedNode.allowedUserIds) ? selectedNode.allowedUserIds : [];
//     const nextUserIds = checked
//       ? Array.from(new Set([...currentUserIds, userId]))
//       : currentUserIds.filter((id) => id !== userId);

//     const result = await dispatch(
//       updateCanvasNodePermissions({
//         workspaceId,
//         nodeId: selectedNode.id,
//         payload: { allowedUserIds: nextUserIds },
//       })
//     );

//     if (updateCanvasNodePermissions.rejected.match(result)) {
//       toast.error(result.payload || "Failed to update permissions");
//     }
//   },
//   [dispatch, isLead, selectedNode, workspaceId]
// );
const handleNodeMouseEnter = useCallback((nodeId, canEdit) => {
  setHoveredNodeId(nodeId);
  const stage = stageRef.current;
  if (stage && !draggingNodeRef.current) {
    stage.container().style.cursor = canEdit ? "move" : "not-allowed";
  }
}, []);

const handleNodeMouseLeave = useCallback((nodeId) => {
  setHoveredNodeId((current) => (current === nodeId ? null : current));
  const stage = stageRef.current;
  if (stage && !draggingNodeRef.current) {
    stage.container().style.cursor = activeTool === "select" ? "grab" : "crosshair";
  }
}, [activeTool]);
  const renderNode = (node) => {
    const permissions = computeNodePermissions(node, workspaceRole,currentUser?.id);
    const commonProps = {
  node,
  isSelected: selectedNodeIds.includes(node.id),
  permissions,
  isEditing: node.id === editingNodeId,
  onDragEnd: handleNodeDragEnd,
  onClick: handleNodeClick,
  onMouseEnter: () => handleNodeMouseEnter(node.id, permissions.canEdit),
  onMouseLeave: () => handleNodeMouseLeave(node.id),
};
    switch (node.type) {
      case "sticky": return <StickyNode key={node.id} {...commonProps} onDragMove={handleNodeDragMove} onTransform={handleNodeTransform} onTransformEnd={handleNodeTransformEnd} onDoubleClick={handleNodeDoubleClick} />;
      case "text": return <TextNode key={node.id} {...commonProps} onDragMove={handleNodeDragMove} onTransform={handleNodeTransform} onTransformEnd={handleNodeTransformEnd} onDoubleClick={handleNodeDoubleClick} />;
      case "rectangle":
      case "circle":
      case "diamond":
      case "triangle": return <ShapeNode key={node.id} {...commonProps} onDragMove={handleNodeDragMove} onTransform={handleNodeTransform} onTransformEnd={handleNodeTransformEnd} onDoubleClick={handleNodeDoubleClick} />;
      case "arrow": return <ArrowNode key={node.id} {...commonProps} onDragMove={handleNodeDragMove} onTransform={handleNodeTransform} onTransformEnd={handleNodeTransformEnd} onDoubleClick={handleNodeDoubleClick} canEdit={canEditCanvas}
        onEndpointDragMove={handleArrowEndpointDragMove}
        onEndpointDragEnd={handleArrowEndpointDragEnd} />;
      case "line": return <ArrowNode key={node.id} {...commonProps} onDragMove={handleNodeDragMove} onTransform={handleNodeTransform} onTransformEnd={handleNodeTransformEnd} onDoubleClick={handleNodeDoubleClick} canEdit={canEditCanvas}
        onEndpointDragMove={handleArrowEndpointDragMove}
        onEndpointDragEnd={handleArrowEndpointDragEnd} />;
      default: return null;
    }
  };
 useEffect(() => () => {
  if (localCursorRafRef.current) cancelAnimationFrame(localCursorRafRef.current);
  if (updateRafRef.current) cancelAnimationFrame(updateRafRef.current);
}, []);

  useEffect(() => {
    const targetNodeId = searchParams.get("node");
    if (!targetNodeId) return;

    const targetNode = nodesMap[targetNodeId];
    if (!targetNode) return;

    const bounds = getNodeBounds(targetNode);
    if (!bounds) return;

    setSelectedNodeIds([targetNodeId]);
    setFocusedNodeId(targetNodeId);
    setViewport((current) => ({
      ...current,
      x: dimensions.width / 2 - (bounds.x + bounds.width / 2) * current.scale,
      y: dimensions.height / 2 - (bounds.y + bounds.height / 2) * current.scale,
    }));

    const timer = setTimeout(() => setFocusedNodeId(null), 1800);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("node");
    setSearchParams(nextParams, { replace: true });
    return () => clearTimeout(timer);
  }, [dimensions.height, dimensions.width, getNodeBounds, nodesMap, searchParams, setSearchParams]);

  const hoveredNode = hoveredNodeId ? nodesMap[hoveredNodeId] : null;
  const hoveredPermissions = hoveredNode ? computeNodePermissions(hoveredNode, workspaceRole,currentUser?.id) : null;
  const hoveredBounds = hoveredNode ? getNodeBounds(hoveredNode) : null;
  const hoveredTooltip = hoveredNode && hoveredBounds && (!hoveredPermissions?.canEdit || hoveredPermissions?.isLocked)
    ? hoveredPermissions.isLocked
      ? "Locked node"
      : "You don't have permission to edit this node."
    : null;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[color:var(--canvas-background)]">
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
      

      <ToolStylePanel
        tool={activeTool}
        strokeColor={toolStrokeColor}
        onStrokeColorChange={setToolStrokeColor}
        fillColor={toolFillColor}
        onFillColorChange={setToolFillColor}
        strokeWidth={toolStrokeWidth}
        onStrokeWidthChange={setToolStrokeWidth}
        edges={toolEdges}
        onEdgesChange={setToolEdges}
        opacity={toolOpacity}
        onOpacityChange={setToolOpacity}
      />

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
     onDragMove={(e) => {
          if (e.target !== e.target.getStage()) {
            return;
          }
          setViewport((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
        }}
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
  {sortedNodes.map(renderNode)}

         {creationDraft && activeTool !== "arrow" && (() => {
            const { tool, start } = creationDraft;
            const draftData = buildPresetData(tool, { width: 24, height: 24 });
            const draftFill = draftData.fill || draftData.color || "#E5E7EB";
            const draftStroke = draftData.stroke || draftData.color || "#A1A1AA";

            return (
              <>
                {tool === "sticky" && (
                  <Rect ref={draftRectRef} x={start.x} y={start.y} width={24} height={24} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={10} opacity={0.7} listening={false} />
                )}
                {tool === "rectangle" && (
                  <Rect ref={draftRectRef} x={start.x} y={start.y} width={24} height={24} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={8} opacity={0.7} listening={false} />
                )}
                {(tool === "diamond" || tool === "triangle") && (
                  <Line
                    ref={draftPolygonRef}
                    x={start.x}
                    y={start.y}
                    points={tool === "diamond" ? [12, 0, 24, 12, 12, 24, 0, 12] : [12, 0, 24, 24, 0, 24]}
                    closed
                    fill={draftFill}
                    stroke={draftStroke}
                    strokeWidth={1.5 / viewport.scale}
                    dash={[6, 4]}
                    opacity={0.7}
                    listening={false}
                  />
                )}
                {tool === "text" && (
                  <>
                    <Rect ref={draftTextRectRef} x={start.x} y={start.y} width={180} height={48} fill="transparent" stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={8} opacity={0.7} listening={false} />
                    <Text ref={draftTextLabelRef} x={start.x + 12} y={start.y + 10} width={156} height={28} text="Text block" fontSize={16} fill={draftStroke} opacity={0.7} listening={false} />
                  </>
                )}
                {tool === "circle" && (
                  <Circle ref={draftCircleRef} x={start.x} y={start.y} radius={12} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} opacity={0.7} listening={false} />
                )}
                {tool === "line" && (
                  <Line
                    ref={draftLineRef}
                    x={start.x}
                    y={start.y}
                    points={[0, 0, 0, 0]}
                    stroke={draftStroke}
                    strokeWidth={1.5 / viewport.scale}
                    dash={[6, 4]}
                    lineCap="round"
                    lineJoin="round"
                    opacity={0.7}
                    listening={false}
                  />
                )}
              </>
            );
          })()}

          {arrowDraft && activeTool === "arrow" && (
            <Arrow
              ref={arrowShapeRef}
              x={arrowDraft.start.x}
              y={arrowDraft.start.y}
              points={[0, 0, 0, 0]}
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
            const lineDx = current.x - remoteDraft.start.x;
            const lineDy = current.y - remoteDraft.start.y;

            return (
              <>
                {remoteDraft.tool === "sticky" && (
                  <Rect x={left} y={top} width={width} height={height} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={10} opacity={0.6} listening={false} />
                )}
                {remoteDraft.tool === "rectangle" && (
                  <Rect x={left} y={top} width={width} height={height} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={8} opacity={0.6} listening={false} />
                )}
                {(remoteDraft.tool === "diamond" || remoteDraft.tool === "triangle") && (
                  <Line
                    x={left}
                    y={top}
                    points={remoteDraft.tool === "diamond"
                      ? [width / 2, 0, width, height / 2, width / 2, height, 0, height / 2]
                      : [width / 2, 0, width, height, 0, height]}
                    closed
                    fill={draftFill}
                    stroke={draftStroke}
                    strokeWidth={1.5 / viewport.scale}
                    dash={[6, 4]}
                    opacity={0.6}
                    listening={false}
                  />
                )}
                {remoteDraft.tool === "text" && (
                  <Rect x={left} y={top} width={Math.max(width, 180)} height={Math.max(height, 48)} fill="transparent" stroke={draftStroke} strokeWidth={1.5 / viewport.scale} dash={[6, 4]} cornerRadius={8} opacity={0.6} listening={false} />
                )}
                {remoteDraft.tool === "circle" && (
                  <Circle x={left + width / 2} y={top + height / 2} radius={Math.max(width, height) / 2} fill={draftFill} stroke={draftStroke} strokeWidth={1.5 / viewport.scale} opacity={0.6} listening={false} />
                )}
                {remoteDraft.tool === "line" && (
                  <Line
                    x={remoteDraft.start.x}
                    y={remoteDraft.start.y}
                    points={[0, 0, lineDx, lineDy]}
                    stroke={draftStroke}
                    strokeWidth={1.5 / viewport.scale}
                    dash={[6, 4]}
                    lineCap="round"
                    lineJoin="round"
                    opacity={0.6}
                    listening={false}
                  />
                )}
              </>
            );
          })()}


         <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            keepRatio={selectedNode?.type === "circle" || selectedNode?.type === "diamond" || selectedNode?.type === "triangle" || isShiftPressed}
            enabledAnchors={
              selectedNode?.type === "circle" || selectedNode?.type === "diamond" || selectedNode?.type === "triangle" || isShiftPressed
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
              const min = MIN_DIMENSIONS[selectedNode?.type] || { width: 40, height: 32 };
              if (newBox.width < min.width || newBox.height < min.height) {
                return oldBox;
              }
              if (selectedNode?.type === "sticky" && min.maxAspect) {
                const ratio = newBox.width / newBox.height;
                if (ratio > min.maxAspect || ratio < 1 / min.maxAspect) {
                  return oldBox;
                }
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

      <CanvasPresenceLayer
        viewport={viewport}
        dimensions={dimensions}
        onViewportChange={setViewport}
        members={members}
        presenceUsers={presenceUsers}
        remoteCursors={remoteCursors}
        localCursor={localCursor}
        currentUser={currentUser}
        currentUserRole={workspaceRole}
        canManage={canEditCanvas}
        zones={zones}
        saving={zonesSaving}
        createZone={createZone}
        updateZone={updateZone}
        removeZone={removeZone}
      />

      {focusedNodeId && selectedNodeBounds && selectedNode?.id === focusedNodeId ? (
        <div
          className="pointer-events-none absolute z-20 rounded-3xl border-2 border-[color:var(--accent)] shadow-[0_0_0_8px_rgba(99,102,241,0.12)] animate-pulse"
          style={{
            left: `${selectedNodeBounds.x * viewport.scale + viewport.x - 10}px`,
            top: `${selectedNodeBounds.y * viewport.scale + viewport.y - 10}px`,
            width: `${selectedNodeBounds.width * viewport.scale + 20}px`,
            height: `${selectedNodeBounds.height * viewport.scale + 20}px`,
          }}
        />
      ) : null}

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
            <div className="space-y-4">
              {inspectorColors.includes("fill") && (
                <ColorSwatchPicker
                  label="Background"
                  value={selectedNode.data?.fill && selectedNode.data.fill !== "rgba(0,0,0,0)" ? selectedNode.data.fill : "transparent"}
                  onChange={(color) => handleInspectorChange("fill", color === "transparent" ? "rgba(0,0,0,0)" : color)}
                  colors={BACKGROUND_COLORS}
                  allowTransparent
                />
              )}

              {inspectorColors.includes("stroke") && (
                <ColorSwatchPicker
                  label="Border"
                  value={selectedNode.data?.stroke || "#000000"}
                  onChange={(color) => handleInspectorChange("stroke", color)}
                  colors={STROKE_COLORS}
                />
              )}

              {inspectorColors.includes("color") && selectedNode.type === "text" && (
                <ColorSwatchPicker
                  label="Text color"
                  value={selectedNode.data?.color || "#18181B"}
                  onChange={(color) => handleInspectorChange("color", color)}
                  colors={STROKE_COLORS}
                />
              )}

              {inspectorColors.includes("textColor") && selectedNode.type === "sticky" && (
                <ColorSwatchPicker
                  label="Text color"
                  value={selectedNode.data?.textColor || "#18181B"}
                  onChange={(color) => handleInspectorChange("textColor", color)}
                  colors={STROKE_COLORS}
                />
              )}

              {selectedNode.type === "arrow" && (
                <ColorSwatchPicker
                  label="Arrow color"
                  value={selectedNode.data?.color || "#6366F1"}
                  onChange={(color) => handleInspectorChange("color", color)}
                  colors={STROKE_COLORS}
                />
              )}
            </div>
          )}</div>
      )}

      {hoveredTooltip && hoveredBounds && (
        <div
          className="pointer-events-none absolute z-30 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-2 text-xs text-[color:var(--text-primary)] shadow-lg"
          style={{
            left: `${hoveredBounds.x * viewport.scale + viewport.x}px`,
            top: `${Math.max(8, hoveredBounds.y * viewport.scale + viewport.y - 36)}px`,
          }}
        >
          {hoveredTooltip}
        </div>
      )}

   {editingNodeId && selectedNodeBounds && (() => {
        const editingNode = nodesMap[editingNodeId];
        const isCircleEdit = editingNode?.type === "circle";
        const isPolygonEdit = editingNode?.type === "diamond" || editingNode?.type === "triangle";
        const boxWidth = Math.max(selectedNodeBounds.width * viewport.scale, editingNode?.type === "line" ? 160 : 0);
        const boxHeight = Math.max(selectedNodeBounds.height * viewport.scale, editingNode?.type === "line" ? 72 : 0);
        const circleInset = isCircleEdit ? Math.max(14, Math.round(Math.min(boxWidth, boxHeight) * 0.12)) : 0;
        const editingPadding = editingNode?.type === "sticky" || editingNode?.type === "rectangle"
          ? 12
          : isCircleEdit || isPolygonEdit
            ? 16
            : 12;

        return (
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
            className="absolute z-30 block resize-none bg-transparent outline-none border-0 m-0 p-0 shadow-2xl"
            style={{
              left: `${selectedNodeBounds.x * viewport.scale + viewport.x}px`,
              top: `${selectedNodeBounds.y * viewport.scale + viewport.y}px`,
              width: `${boxWidth}px`,
              height: `${Math.max(boxHeight, 64)}px`,
              color: editingNode?.type === "sticky" ? editingNode?.data?.textColor || "#18181B" : "#000000",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: editingNode?.type === "text" ? `${editingNode?.data?.fontSize || 16}px` : "13px",
              lineHeight: 1.4,
              textAlign: editingNode?.type === "sticky" || editingNode?.type === "rectangle" ? "left" : "center",
              overflow: "hidden",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              boxSizing: "border-box",
              padding: editingPadding,
              borderRadius: isCircleEdit ? "50%" : isPolygonEdit ? 0 : "0.75rem",
              clipPath: editingNode?.type === "diamond"
                ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                : editingNode?.type === "triangle"
                  ? "polygon(50% 0%, 100% 100%, 0% 100%)"
                  : undefined,
              background: "transparent",
              caretColor: editingNode?.type === "sticky" ? editingNode?.data?.textColor || "#18181B" : "#000000",
              opacity: editingNode?.locked ? 0.82 : 1,
            }}
            placeholder="Enter text"
          />
        );
      })()}

      {/* Toolbar */}
     <CanvasToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        activeColor={toolFillColor}
        onColorChange={setToolFillColor}
        canEdit={canEditCanvas}
        selectedNode={selectedNode}
        isLead={isLead}
        onToggleLock={handleToggleSelectedNodeLock}
        onOpenPermissions={() => setIsPermissionsOpen(true)}
      />

   <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Node permissions</DialogTitle>
      <DialogDescription>
        Choose which workspace members can edit this node. Leave everyone unchecked to allow all contributors.
      </DialogDescription>
    </DialogHeader>

    <div className="max-h-72 space-y-1 overflow-y-auto py-2">
      {members
        .filter((member) => member.isOwner || member.role === "Lead")
        .map((leadMember) => (
          <div
            key={leadMember.userId}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[color:var(--text-secondary)]"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-[color:var(--text-primary)]">{leadMember.name}</span>
              <span className="text-xs">(Lead)</span>
            </div>
            <span className="text-xs italic">Always has access</span>
          </div>
        ))}

      {members.filter((member) => member.role === "Contributor").length === 0 && (
        <p className="px-3 py-4 text-center text-sm text-[color:var(--text-secondary)]">
          No contributors in this workspace yet.
        </p>
      )}

      {members
        .filter((member) => member.role === "Contributor")
        .map((member) => {
          const isSelected = draftAllowedUserIds.includes(member.userId);
          return (
            <button
              key={member.userId}
              type="button"
              onClick={() => toggleDraftPermission(member.userId)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--bg-primary)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[color:var(--text-primary)]">{member.name}</span>
                <span className="text-xs text-[color:var(--text-secondary)]">{member.email}</span>
              </div>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? "bg-[color:var(--accent)] border-[color:var(--accent)]"
                    : "border-[color:var(--border)]"
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
    </div>

   <DialogFooter>
  <Button variant="outline" onClick={() => setIsPermissionsOpen(false)} disabled={savingPermissions}>
    Cancel
  </Button>
  <Button onClick={handleSavePermissions} disabled={savingPermissions}>
    {savingPermissions ? "Saving..." : "Save"}
  </Button>
</DialogFooter>
  </DialogContent>
</Dialog>
  {/* Zoom indicator */}
      <div className="absolute bottom-6 right-16 z-10 text-xs text-[color:var(--foreground-muted)] bg-[color:var(--surface)] border border-[color:var(--border)] rounded-lg px-2.5 py-1.5 shadow-sm font-mono select-none">
        {Math.round(viewport.scale * 100)}%
      </div>

      {/* Chat drawer toggle button — bottom-right, does not overlap zoom controls */}
      <button
        type="button"
        onClick={() => setIsChatDrawerOpen((v) => !v)}
        title={isChatDrawerOpen ? "Close team chat" : "Open team chat"}
        aria-label={isChatDrawerOpen ? "Close team chat" : "Open team chat"}
        className={[
          "absolute bottom-6 right-4 z-20 w-9 h-9 rounded-xl flex items-center justify-center border shadow-[var(--shadow-sm)] transition-all duration-150",
          isChatDrawerOpen
            ? "bg-[color:var(--primary)] border-[color:var(--primary)] text-[color:var(--primary-foreground)]"
            : "bg-[color:var(--surface)] border-[color:var(--border)] text-[color:var(--foreground-secondary)] hover:border-[color:var(--primary)]/50 hover:text-[color:var(--primary)]",
        ].join(" ")}
      >
        <MessageSquare className="w-4 h-4" />
      </button>

      {/* Empty state */}
      {!loading && nodes.length === 0 && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center gap-3">
          <p className="text-[color:var(--text-secondary)] text-sm font-medium opacity-60">
            Select a tool and click to place your first node
          </p>
        </div>
      )}
      {/* CanvasChatDrawer — presentational open/close, reuses existing chat components */}
      <CanvasChatDrawer
        workspaceId={workspaceId}
        open={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
