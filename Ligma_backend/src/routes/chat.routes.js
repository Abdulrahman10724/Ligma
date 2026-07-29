import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  listChannelsHandler,
  createChannelHandler,
  listMessagesHandler,
  createMessageHandler,
  updateMessageHandler,
  deleteMessageHandler,
} from "../controllers/chat.controller.js";
import {
  createChannelSchema,
  channelIdParamSchema,
  listMessagesSchema,
  createMessageSchema,
  updateMessageSchema,
  deleteMessageSchema,
} from "../validation/chat.validation.js";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

// Channels
router.get("/channels", listChannelsHandler);
router.post("/channels", validate(createChannelSchema), createChannelHandler);

// Messages
// Messages
router.get("/channels/:channelId/messages", validate(listMessagesSchema), listMessagesHandler);
router.post("/channels/:channelId/messages", validate(createMessageSchema), createMessageHandler);
router.patch("/channels/:channelId/messages/:messageId", validate(updateMessageSchema), updateMessageHandler);
router.delete("/channels/:channelId/messages/:messageId", validate(deleteMessageSchema), deleteMessageHandler);

export default router;
