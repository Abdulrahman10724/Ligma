import { sendSuccess, sendError } from "../utils/api-response.util.js";
import * as zoneService from "../services/zone.service.js";
import { createZoneSchema, updateZoneSchema, deleteZoneSchema } from "../validation/zone.validation.js";

const listZonesHandler = async (req, res, next) => {
  try {
    const zones = await zoneService.listZones(req.params.workspaceId, req.user.id);
    return sendSuccess(res, 200, "Zones retrieved", { zones });
  } catch (error) {
    return next(error);
  }
};

const createZoneHandler = async (req, res, next) => {
  try {
    createZoneSchema.parse({
      params: req.params,
      body: req.body || {},
    });
    const zone = await zoneService.createZone(
      req.params.workspaceId,
      req.user.id,
      req.body || {}
    );
    return sendSuccess(res, 201, "Zone created", { zone });
  } catch (error) {
    if (error?.issues) {
      return sendError(res, 400, "Invalid request", error.issues);
    }
    return next(error);
  }
};

const updateZoneHandler = async (req, res, next) => {
  try {
    updateZoneSchema.parse({ params: req.params, body: req.body || {} });
    const zone = await zoneService.updateZone(
      req.params.workspaceId,
      req.params.zoneId,
      req.user.id,
      req.body || {}
    );
    return sendSuccess(res, 200, "Zone updated", { zone });
  } catch (error) {
    if (error?.issues) {
      return sendError(res, 400, "Invalid request", error.issues);
    }
    return next(error);
  }
};

const deleteZoneHandler = async (req, res, next) => {
  try {
    deleteZoneSchema.parse({ params: req.params });
    await zoneService.deleteZone(
      req.params.workspaceId,
      req.params.zoneId,
      req.user.id
    );
    return sendSuccess(res, 200, "Zone deleted");
  } catch (error) {
    if (error?.issues) {
      return sendError(res, 400, "Invalid request", error.issues);
    }
    return next(error);
  }
};

export { listZonesHandler, createZoneHandler, updateZoneHandler, deleteZoneHandler };

export default {
  listZonesHandler,
  createZoneHandler,
  updateZoneHandler,
  deleteZoneHandler,
};
