import {
  createCanvasNode,
  deleteCanvasNode,
  listCanvasNodes,
  updateCanvasNode,
} from "../services/canvas-node.service.js";
import { emitWorkspaceEvent } from "../socket/socket.service.js";
import { sendSuccess } from "../utils/api-response.util.js";

const listNodesHandler = async (req, res, next) => {
  try {
    const nodes = await listCanvasNodes(req.params.workspaceId, req.user.id);
    return sendSuccess(res, 200, "Canvas nodes retrieved successfully", { nodes });
  } catch (error) {
    return next(error);
  }
};

const createNodeHandler = async (req, res, next) => {
  try {
    const node = await createCanvasNode(req.params.workspaceId, req.user.id, req.body);

    emitWorkspaceEvent(req.params.workspaceId, "canvas:node-created", {
      workspaceId: req.params.workspaceId,
      node,
      actorId: req.user.id,
    });

    return sendSuccess(res, 201, "Canvas node created successfully", { node });
  } catch (error) {
    return next(error);
  }
};

const updateNodeHandler = async (req, res, next) => {
  try {
    const node = await updateCanvasNode(
      req.params.workspaceId,
      req.user.id,
      req.params.nodeId,
      req.body
    );

    emitWorkspaceEvent(req.params.workspaceId, "canvas:node-updated", {
      workspaceId: req.params.workspaceId,
      node,
      actorId: req.user.id,
    });

    return sendSuccess(res, 200, "Canvas node updated successfully", { node });
  } catch (error) {
    return next(error);
  }
};

const deleteNodeHandler = async (req, res, next) => {
  try {
    await deleteCanvasNode(req.params.workspaceId, req.user.id, req.params.nodeId);

    emitWorkspaceEvent(req.params.workspaceId, "canvas:node-deleted", {
      workspaceId: req.params.workspaceId,
      nodeId: req.params.nodeId,
      actorId: req.user.id,
    });

    return sendSuccess(res, 200, "Canvas node deleted successfully");
  } catch (error) {
    return next(error);
  }
};

export { listNodesHandler, createNodeHandler, updateNodeHandler, deleteNodeHandler };

export default { listNodesHandler, createNodeHandler, updateNodeHandler, deleteNodeHandler };
