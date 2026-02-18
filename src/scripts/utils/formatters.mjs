export function formatSourceLabel(source) {
  const value = String(source || "").trim();
  if (!value) return "Publisher";
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function toTitleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function toSlugKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
