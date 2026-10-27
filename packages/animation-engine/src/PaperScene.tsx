import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import type { Palette, PaperLayer, Scene, Style } from "@ams/project-schema";
import { SHAPES } from "./shapes";
import { layerColor, lighten } from "./color";
import paperNoise from "../assets/paper-noise.png";

type PaperScene = Extract<Scene, { action: "paper_layers_reveal" }>;

/** بافت کاغذ: یک کاشی نویز ثابت (به‌جای فیلتر SVG که در هر فریم گران است) */
export const PaperTexture: React.FC<{ opacity?: number }> = ({ opacity = 0.11 }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `url(${paperNoise})`,
      backgroundSize: "384px 384px",
      mixBlendMode: "multiply",
      opacity,
      pointerEvents: "none",
    }}
  />
);

/** محاسبه transform هر لایه براساس فهرست حرکت‌هایش */
function useLayerMotion(layer: PaperLayer, durationInFrames: number) {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const f = frame - layer.delayFrames;
  const enter = spring({ frame: f, fps, config: { damping: 16, stiffness: 90, mass: 0.9 } });
  const seedPhase = (layer.id.length * 1.7) % (Math.PI * 2);

  let tx = 0;
  let ty = 0;
  let rot = 0;
  let opacity = 1;
  let phase = 0;

  for (const m of layer.motions) {
    switch (m) {
      case "rise":
        ty += (1 - enter) * height * (0.35 + layer.depth * 0.35);
        opacity = Math.min(opacity, interpolate(f, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        break;
      case "drop":
        ty -= (1 - enter) * height * 0.5;
        opacity = Math.min(opacity, interpolate(f, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        break;
      case "parallax":
        // نزدیک‌ترها سریع‌تر حرکت می‌کنند
        tx -= interpolate(frame, [0, durationInFrames], [0, width * 0.02 + width * 0.07 * layer.depth], {
          easing: Easing.inOut(Easing.sin),
          extrapolateRight: "clamp",
        });
        break;
      case "sway":
        rot += Math.sin(frame / 18 + seedPhase) * 1.2;
        break;
      case "float":
        ty += Math.sin(frame / 22 + seedPhase) * 10;
        tx += frame * 0.35;
        break;
      case "spin":
        phase += frame * 0.008;
        break;
    }
  }
  return { tx, ty, rot, opacity, phase: phase + frame * 0.06 };
}

const Layer: React.FC<{ layer: PaperLayer; palette: Palette; style: Style; durationInFrames: number }> = ({
  layer,
  palette,
  style,
  durationInFrames,
}) => {
  const { width, height } = useVideoConfig();
  const m = useLayerMotion(layer, durationInFrames);
  const Shape = SHAPES[layer.shape];
  const color = layer.color ?? layerColor(palette, layer.depth);
  const paper = style === "paper-cut";
  // سایه کاغذی ارزان: چند کپی سیاه‌شده با جابه‌جایی کم و شفافیت پایین (بدون blur که رندر را ~۶ برابر کند می‌کرد)
  const shadowSteps = paper ? [1, 0.66, 0.33] : [];
  const off = 3 + layer.depth * 9;
  const shapeProps = { w: width, h: height, depth: layer.depth, color, accent: palette.accent, seed: layer.id, phase: m.phase };

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${m.tx}px, ${m.ty}px) rotate(${m.rot}deg)`,
        transformOrigin: "50% 100%",
        opacity: m.opacity,
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        {shadowSteps.map((k) => (
          <g key={k} transform={`translate(${off * k * 0.35} ${off * k})`} className="ams-sil" style={{ ["--sil-a" as string]: 0.07 + layer.depth * 0.03 }}>
            <Shape {...shapeProps} />
          </g>
        ))}
        <Shape {...shapeProps} />
      </svg>
    </AbsoluteFill>
  );
};

/** قاعده CSS رنگ همه اجزای شکل را برای سایه یکدست می‌کند (ارزان‌تر از فیلتر SVG) */
const SilhouetteDefs: React.FC = () => <style>{`.ams-sil, .ams-sil * { fill: #141923 !important; fill-opacity: var(--sil-a, 0.08) !important; stroke: none !important; }`}</style>;

export const PaperLayersReveal: React.FC<{ scene: PaperScene; palette: Palette; style: Style }> = ({ scene, palette, style }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const d = scene.durationFrames;
  const scale = scene.camera === "push-in" ? interpolate(frame, [0, d], [1, 1.07], { easing: Easing.inOut(Easing.quad) }) : 1;
  const pan = scene.camera === "pan" ? interpolate(frame, [0, d], [0, -width * 0.04]) : 0;
  const layers = [...scene.layers].sort((a, b) => a.depth - b.depth);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 70% 20%, ${lighten(palette.background, 0.45)} 0%, ${palette.background} 60%)`,
      }}
    >
      <SilhouetteDefs />
      <AbsoluteFill style={{ transform: `translateX(${pan}px) scale(${scale})`, transformOrigin: "50% 60%" }}>
        {layers.map((l) => (
          <Layer key={l.id} layer={l} palette={palette} style={style} durationInFrames={d} />
        ))}
      </AbsoluteFill>
      {style === "paper-cut" ? <PaperTexture /> : null}
    </AbsoluteFill>
  );
};
