import { extractReferences } from "../utils/regex.util.js";
import { classifyWithOpenRouter } from "./ai.service.js";
import logger from "../utils/logger.util.js";

const PLACEHOLDERS = [
  "New note",
  "Text block",
  "Double click to edit",
  "Double-click to edit",
  "Click to edit",
  "Untitled",
  "",
];

const parseTitleAndDescription = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const title = lines.length ? lines[0] : "";
  const description = lines.length > 1 ? lines.slice(1).join("\n\n") : "";
  return { title, description };
};

const classifyNodeContent = async (rawText) => {
  // References/emails are detected across the WHOLE text (title + description),
  // so a link anywhere in the node still produces a Reference entry —
  // this is independent of and additive to the title-based category below.
  const { references, emails, cleanedText } = extractReferences(rawText || "");

  logger.info(`classification.service: rawText='${String(rawText).slice(0, 200)}' cleaned='${String(cleanedText).slice(0, 200)}' refs=${(references || []).length} emails=${(emails || []).length}`);

  const textForPlaceholderCheck = (rawText || "").trim();
  if (!textForPlaceholderCheck || PLACEHOLDERS.includes(textForPlaceholderCheck)) {
    logger.info(`classification.service: skipping classification due to placeholder/empty`);
    return { classification: null, references, emails, title: "", description: "" };
  }

  // Title = first line, Description = everything after — the description
  // must NEVER influence which category (Action/Decision/Information) the
  // node lands in; only the title's intent decides the category.
  const { title, description } = parseTitleAndDescription(rawText);

  // Strip any URLs out of the TITLE ONLY before sending to the AI, so the
  // model focuses on the natural-language intent of the title alone.
  const titleForClassification = extractReferences(title || "").cleanedText;

  if (!titleForClassification || titleForClassification.length < 3) {
    // No meaningful title to classify — references/description still returned as-is
    return { classification: null, references, emails, title, description };
  }

  try {
    const cls = await classifyWithOpenRouter(titleForClassification);
    logger.info(`classification.service: ai returned='${String(cls)}' (based on title only: '${titleForClassification}')`);
    return { classification: cls, references, emails, title, description };
  } catch (err) {
    logger.warn("classification failed", err?.message || err);
    return { classification: null, references, emails, title, description };
  }
};

export { classifyNodeContent };

export default { classifyNodeContent };