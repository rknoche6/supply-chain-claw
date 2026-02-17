import { describe, expect, it } from "vitest";
import { roadmapFocusAreas } from "../lib/roadmap";

describe("roadmapFocusAreas", () => {
  it("contains key supply-chain milestones", () => {
    expect(roadmapFocusAreas.length).toBeGreaterThanOrEqual(4);
    expect(roadmapFocusAreas[0]).toMatch(/Global map foundation/i);
    expect(roadmapFocusAreas.join(" ")).toMatch(/CPU\/GPU/i);
    expect(roadmapFocusAreas.join(" ")).toMatch(/Raw materials/i);
    expect(roadmapFocusAreas.join(" ")).toMatch(/Food chains/i);
  });
});
