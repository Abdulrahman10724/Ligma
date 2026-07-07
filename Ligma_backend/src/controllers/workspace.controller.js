import { createUserWorkspace, getWorkspace, listUserWorkspaces, updateUserWorkspace } from "../services/workspace.service.js";
import { sendSuccess } from "../utils/api-response.util.js";

const listWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await listUserWorkspaces(req.user.id);
    return sendSuccess(res, 200, "Workspaces retrieved successfully", { workspaces });
  } catch (error) {
    return next(error);
  }
};

const createWorkspaceHandler = async (req, res, next) => {
  try {
    const workspace = await createUserWorkspace(req.body, req.user.id);
    return sendSuccess(res, 201, "Workspace created successfully", { workspace });
  } catch (error) {
    return next(error);
  }
};

const getWorkspaceHandler = async (req, res, next) => {
  try {
    const workspace = await getWorkspace(req.params.workspaceId, req.user.id);
    return sendSuccess(res, 200, "Workspace retrieved successfully", { workspace });
  } catch (error) {
    return next(error);
  }
};

const updateWorkspaceHandler = async (req, res, next) => {
  try {
    const workspace = await updateUserWorkspace(req.params.workspaceId, req.user.id, req.body);
    return sendSuccess(res, 200, "Workspace updated successfully", { workspace });
  } catch (error) {
    return next(error);
  }
};

export { listWorkspaces, createWorkspaceHandler, getWorkspaceHandler, updateWorkspaceHandler };

export default {
  listWorkspaces,
  createWorkspaceHandler,
  getWorkspaceHandler,
  updateWorkspaceHandler,
};