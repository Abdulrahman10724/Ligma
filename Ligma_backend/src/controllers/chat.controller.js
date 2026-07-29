import { sendSuccess, sendError } from "../utils/api-response.util.js";
import * as channelService from "../services/channel.service.js";
import * as messageService from "../services/message.service.js";
import { createChannelSchema } from "../validation/chat.validation.js";

const listChannelsHandler = async (req, res, next) => {
  try {
    const channels = await channelService.listChannels(req.params.workspaceId, req.user.id);
    return sendSuccess(res, 200, "Channels retrieved", { channels });
  } catch (error) {
    return next(error);
  }
};

const createChannelHandler = async (req, res, next) => {
  try {
    createChannelSchema.parse({ params: req.params, body: req.body || {} });
    const channel = await channelService.createChannel(
      req.params.workspaceId,
      req.user.id,
      req.body || {}
    );
    return sendSuccess(res, 201, "Channel created", { channel });
  } catch (error) {
    if (error?.issues) {
      return sendError(res, 400, "Invalid request", error.issues);
    }
    return next(error);
  }
};

const listMessagesHandler = async (req, res, next) => {
  try {
    const messages = await messageService.listMessages(
      req.params.workspaceId,
      req.params.channelId,
      req.user.id,
      {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        before: req.query.before,
      }
    );
    return sendSuccess(res, 200, "Messages retrieved", { messages });
  } catch (error) {
    return next(error);
  }
};
const createMessageHandler = async (req, res, next) => {
  try {
    const message = await messageService.createMessage(
      req.params.workspaceId,
      req.params.channelId,
      req.user,        
      req.body || {}
    );
    return sendSuccess(res, 201, "Message sent", { message });
  } catch (error) {
    if (error?.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    return next(error);
  }
};

const updateMessageHandler = async (req, res, next) => {
  try {
    const message = await messageService.updateMessage(
      req.params.workspaceId,
      req.params.channelId,
      req.params.messageId,
      req.user.id,
      req.body || {}
    );
    return sendSuccess(res, 200, "Message updated", { message });
  } catch (error) {
    if (error?.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    return next(error);
  }
};

const deleteMessageHandler = async (req, res, next) => {
  try {
    await messageService.deleteMessage(
      req.params.workspaceId,
      req.params.channelId,
      req.params.messageId,
      req.user.id
    );
    return sendSuccess(res, 200, "Message deleted");
  } catch (error) {
    if (error?.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    return next(error);
  }
};

export {
  listChannelsHandler,
  createChannelHandler,
  listMessagesHandler,
  createMessageHandler,
  updateMessageHandler,
  deleteMessageHandler,
};

export default {
  listChannelsHandler,
  createChannelHandler,
  listMessagesHandler,
  createMessageHandler,
  updateMessageHandler,
  deleteMessageHandler,
};
