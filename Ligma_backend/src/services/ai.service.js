import axios from "axios";
import config from "../config/env.config.js";
import logger from "../utils/logger.util.js";

const classifyWithOpenRouter = async (text) => {
  // Short-circuit when no API key is configured (development mode)
  if (!config.OPENROUTER_API_KEY) return null;

  const url = `${config.OPENROUTER_BASE_URL}${config.OPENROUTER_CHAT_ENDPOINT}`;

  const system = {
    role: "system",
    content: "You are a classifier. Reply with exactly one word: Action, Decision, or Information.",
  };

  const user = { role: "user", content: `Classify the following text: \n\n${text}\n\nRespond only with one of: Action, Decision, Information` };

  try {
    const resp = await axios.post(
      url,
      {
        model: config.OPENROUTER_MODEL,
        messages: [system, user],
        max_tokens: 8,
        temperature: 0.0,
      },
      {
        headers: {
          Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const choices = resp?.data?.choices || resp?.data?.output || null;
    const textOut = choices && choices[0] && (choices[0].message?.content || choices[0].text || "");
    if (!textOut) return null;

    const cleaned = textOut.trim();
    if (/Action/i.test(cleaned)) return "Action";
    if (/Decision/i.test(cleaned)) return "Decision";
    if (/Information/i.test(cleaned)) return "Information";
    return null;
  } catch (err) {
      logger.warn("AI classify failed", {
    status: err.response?.status,
    data: err.response?.data,
    message: err.message,
    });
    return null;
  }
};

export { classifyWithOpenRouter };

export default { classifyWithOpenRouter };
