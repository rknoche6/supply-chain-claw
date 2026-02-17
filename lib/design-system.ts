export const colorRoleTokens = [
  { role: "Background", token: "--color-bg", value: "#0b1020" },
  { role: "Surface", token: "--color-surface", value: "#111a33" },
  { role: "Elevated surface", token: "--color-surface-elevated", value: "#172447" },
  { role: "Primary text", token: "--color-text-primary", value: "#ecf1ff" },
  { role: "Secondary text", token: "--color-text-secondary", value: "#c5d0f4" },
  { role: "Accent", token: "--color-accent", value: "#78c8ff" },
  { role: "Success", token: "--color-success", value: "#8ef7b1" },
] as const;

export const typographyScale = [
  { label: "XS", token: "--text-xs", sample: "Data labels and compact metadata" },
  { label: "SM", token: "--text-sm", sample: "Helper copy and contextual hints" },
  { label: "MD", token: "--text-md", sample: "Body copy for most content" },
  { label: "LG", token: "--text-lg", sample: "Card headings and key values" },
  { label: "XL", token: "--text-xl", sample: "Page-level headline scale" },
] as const;

export const spacingScale = [
  "--space-1",
  "--space-2",
  "--space-3",
  "--space-4",
  "--space-5",
  "--space-6",
] as const;
