/**
 * کامپوزیشن اصلی: JSON پروژه را مستقیم به صحنه‌های Remotion تبدیل می‌کند.
 * هم در رندر MP4 و هم در پیش‌نمایش زنده (Player) همین کامپوننت استفاده می‌شود.
 */
import React, { useState } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { Project, Scene } from "@ams/project-schema";
import { PaperLayersReveal } from "./PaperScene";
import { TitleReveal } from "./Title";
import { LogoAssemble } from "./Logo";
import { ensureFontsLoaded } from "./fonts";

/** ترتیب لایه‌بندی: پس‌زمینه کاغذی زیر، لوگو وسط، متن رو */
const Z: Record<Scene["action"], number> = { paper_layers_reveal: 0, logo_assemble: 1, title_reveal: 2 };

export type MotionProjectProps = { project: Project };

export const MotionProject: React.FC<MotionProjectProps> = ({ project }) => {
  useState(() => ensureFontsLoaded());
  const scenes = project.scenes
    .map((s, i) => ({ s, i }))
    .sort((a, b) => Z[a.s.action] - Z[b.s.action] || a.i - b.i)
    .map(({ s }) => s);

  return (
    <AbsoluteFill style={{ background: project.palette.background, overflow: "hidden" }}>
      {scenes.map((scene) => {
        const isLast = scene.startFrame + scene.durationFrames >= project.durationFrames;
        return (
          <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames} name={`${scene.action}:${scene.id}`}>
            {scene.action === "paper_layers_reveal" && (
              <PaperLayersReveal scene={scene} palette={project.palette} style={project.style} />
            )}
            {scene.action === "logo_assemble" && (
              <LogoAssemble scene={scene} palette={project.palette} style={project.style} isLast={isLast} />
            )}
            {scene.action === "title_reveal" && (
              <TitleReveal scene={scene} palette={project.palette} style={project.style} isLast={isLast} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
