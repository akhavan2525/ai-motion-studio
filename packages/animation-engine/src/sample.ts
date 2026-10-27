import type { Project } from "@ams/project-schema";
import { PALETTES } from "@ams/project-schema";

/** پروژه نمونه برای Remotion Studio و تست‌ها */
export const SAMPLE_PROJECT: Project = {
  schemaVersion: 1,
  project: "آموزش هوش مصنوعی با دکتر اخوان",
  fps: 30,
  durationFrames: 300,
  aspect: "16:9",
  style: "paper-cut",
  palette: PALETTES.sky,
  scenes: [
    {
      id: "scene-bg",
      action: "paper_layers_reveal",
      startFrame: 0,
      durationFrames: 300,
      camera: "push-in",
      layers: [
        { id: "sun-1", shape: "sun", depth: 0.05, motions: ["rise", "spin"], delayFrames: 0 },
        { id: "clouds-2", shape: "clouds", depth: 0.2, motions: ["drop", "float"], delayFrames: 6 },
        { id: "mountains-3", shape: "mountains", depth: 0.35, motions: ["rise", "parallax"], delayFrames: 10 },
        { id: "hills-4", shape: "hills", depth: 0.55, motions: ["rise", "parallax"], delayFrames: 15 },
        { id: "hills-5", shape: "hills", depth: 0.75, motions: ["rise", "parallax"], delayFrames: 20 },
        { id: "trees-6", shape: "trees", depth: 0.9, motions: ["rise", "sway"], delayFrames: 26 },
        { id: "hills-7", shape: "hills", depth: 1, motions: ["rise", "parallax"], delayFrames: 30 },
      ],
    },
    { id: "logo", action: "logo_assemble", startFrame: 36, durationFrames: 120, monogram: "AI" },
    {
      id: "title",
      action: "title_reveal",
      startFrame: 150,
      durationFrames: 150,
      text: "آموزش هوش مصنوعی با دکتر اخوان",
      animation: "word-by-word",
    },
  ],
};
