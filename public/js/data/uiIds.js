function stableUiHash(...parts) {
  let hash = 2166136261;
  const input = parts.join("|");
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function stableUiNumber(...parts) {
  return stableUiHash(...parts) % 9000 + 1000;
}

export function getUiCode(...parts) {
  // Short, stable, human-facing reference. Keep the full hash entropy rather than
  // collapsing every editable component into the old 01–99 badge space.
  const token = stableUiHash(...parts).toString(36).toUpperCase().padStart(7, "0").slice(-5);
  return `E${token}`;
}

export function getUiId(project, section, role = "component") {
  return `${role}-${stableUiNumber(project?.id || "project", section?.id || "section", role)}`;
}

export function getSectionUiId(section) {
  return `section-${section?.id || "unknown"}`;
}
