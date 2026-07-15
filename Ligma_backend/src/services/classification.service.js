import { extractReferences } from "../utils/regex.util.js";
import { classifyWithOpenRouter } from "./ai.service.js";
import logger from "../utils/logger.util.js";

const PLACEHOLDERS = ["Double click to edit", "Click to edit", "Untitled", ""];

const parseTitleAndDescription = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const title = lines.length ? lines[0] : "";
  const description = lines.length > 1 ? lines.slice(1).join("\n\n") : "";
  return { title, description };
};

const classifyNodeContent = async (rawText) => {
  const { references, emails, cleanedText } = extractReferences(rawText || "");

  logger.info(`classification.service: rawText='${String(rawText).slice(0, 200)}' cleaned='${String(cleanedText).slice(0, 200)}' refs=${(references || []).length} emails=${(emails || []).length}`);

  // Use rawText for placeholder detection (cleanedText may be empty if the whole
  // content was a URL, which would incorrectly skip classification)
  const textForPlaceholderCheck = (rawText || "").trim();
  if (!textForPlaceholderCheck || PLACEHOLDERS.includes(textForPlaceholderCheck)) {
    logger.info(`classification.service: skipping classification due to placeholder/empty`);
    return { classification: null, references, emails, title: "", description: "" };
  }

  // ── Parse title/description from the ORIGINAL rawText so that URLs/emails
  //    remain in the description as the user typed them.
  //    cleanedText (URLs stripped) is only used as input to the AI so it can
  //    focus on natural-language intent rather than raw URLs.
  const { title, description } = parseTitleAndDescription(rawText);

  // Skip AI call if there's no meaningful text content even after stripping refs
  if (!cleanedText || cleanedText.length < 3) {
    // Still may have references — return them with the original title/description
    return { classification: null, references, emails, title, description };
  }

  try {
    const cls = await classifyWithOpenRouter(cleanedText);
    logger.info(`classification.service: ai returned='${String(cls)}'`);
    return { classification: cls, references, emails, title, description };
  } catch (err) {
    logger.warn("classification failed", err?.message || err);
    return { classification: null, references, emails, title, description };
  }
};

export { classifyNodeContent };

export default { classifyNodeContent };
