import { describe, expect, it } from "vitest";
import { validateProject } from "@ams/project-schema";
import { SAMPLE_PROJECT } from "../packages/animation-engine/src/sample";

describe("project-schema", () => {
  it("پروژه نمونه معتبر است", () => {
    expect(validateProject(SAMPLE_PROJECT).ok).toBe(true);
  });
  it("صحنه‌ای که از انتهای پروژه بیرون بزند رد می‌شود", () => {
    const bad = { ...SAMPLE_PROJECT, durationFrames: 100 };
    const r = validateProject(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toContain("بیرون می‌زند");
  });
  it("شناسه تکراری رد می‌شود", () => {
    const scenes = [SAMPLE_PROJECT.scenes[0], { ...SAMPLE_PROJECT.scenes[1], id: "scene-bg" }];
    expect(validateProject({ ...SAMPLE_PROJECT, scenes }).ok).toBe(false);
  });
  it("رنگ نامعتبر رد می‌شود", () => {
    expect(validateProject({ ...SAMPLE_PROJECT, palette: { ...SAMPLE_PROJECT.palette, primary: "blue" } }).ok).toBe(false);
  });
});
