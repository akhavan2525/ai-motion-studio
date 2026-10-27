import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { sizeOf } from "@ams/project-schema";
import { MotionProject, type MotionProjectProps } from "./MotionProject";
import { SAMPLE_PROJECT } from "./sample";

export const COMPOSITION_ID = "MotionProject";

/** ابعاد، fps و طول ویدئو مستقیم از JSON پروژه خوانده می‌شود */
const calculateMetadata: CalculateMetadataFunction<MotionProjectProps> = ({ props }) => {
  const { width, height } = sizeOf(props.project);
  return { durationInFrames: props.project.durationFrames, fps: props.project.fps, width, height };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id={COMPOSITION_ID}
    component={MotionProject}
    defaultProps={{ project: SAMPLE_PROJECT }}
    calculateMetadata={calculateMetadata}
    durationInFrames={SAMPLE_PROJECT.durationFrames}
    fps={30}
    width={1920}
    height={1080}
  />
);
