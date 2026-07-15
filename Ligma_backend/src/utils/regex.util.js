const URL_REGEX = /(?:https?:)?\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g;
const WWW_REGEX = /www\.[^\s/$.?#].[^\s]*/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const extractReferences = (text = "") => {
  const found = new Set();
  const urls = [];

  const run = (rx) => {
    let m;
    while ((m = rx.exec(text))) {
      const val = m[0];
      if (!found.has(val)) {
        found.add(val);
        urls.push(val);
      }
    }
  };

  run(URL_REGEX);
  run(WWW_REGEX);
  // normalize www to https
  const normalized = urls.map((u) => (u.startsWith("www.") ? `https://${u}` : u));

  const emails = Array.from(new Set((text.match(EMAIL_REGEX) || []).map((e) => e)));

  // remove matches from text to get cleaned content
  let cleaned = text;
  for (const u of urls) {
    cleaned = cleaned.replace(u, "");
  }
  for (const e of emails) {
    cleaned = cleaned.replace(e, "");
  }

  return { references: normalized, emails, cleanedText: cleaned.trim() };
};

export { extractReferences };

export default { extractReferences };
