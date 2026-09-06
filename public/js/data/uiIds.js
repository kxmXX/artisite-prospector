export function stableUiNumber(...parts) {
  let hash = 2166136261;
  const input = parts.join("|");
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 9000 + 1000;
}

export function getUiId(project, section, role = "component") {
  return `${role}-${stableUiNumber(project?.id || "project", section?.id || "section", role)}`;
}

export function getSectionUiId(section) {
  return `section-${section?.id || "unknown"}`;
}
