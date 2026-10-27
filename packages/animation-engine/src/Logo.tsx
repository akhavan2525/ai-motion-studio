/**
 * لوگوموشن کاغذی: قطعات حلقه از جهت‌های مختلف می‌آیند،
 * کنار هم قرار می‌گیرند، دایره داخلی باز می‌شود و حروف ظاهر می‌شوند.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palette, Scene, Style } from "@ams/project-schema";
import { FONT_FAMILY } from "./fonts";
import { darken, lighten } from "./color";

type LogoScene = Extract<Scene, { action: "logo_assemble" }>;

function wedge(r0: number, r1: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => `${r * Math.cos(a)} ${r * Math.sin(a)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}

export const LogoAssemble: React.FC<{ scene: LogoScene; palette: Palette; style: Style; isLast: boolean }> = ({
  scene,
  palette,
  style,
  isLast,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const R = Math.min(width, height) * 0.2;
  const pieces = 8;
  const d = scene.durationFrames;
  const paper = style === "paper-cut";
  const exit = isLast ? 0 : interpolate(frame, [d - 15, d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const inner = spring({ frame: frame - 26, fps, config: { damping: 12, stiffness: 110 } });
  const mono = spring({ frame: frame - 36, fps, config: { damping: 13, stiffness: 120 } });
  const glow = interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shadow = paper ? "drop-shadow(0 10px 16px rgba(20,25,35,0.3))" : "none";
  const gap = 0.04;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: 1 - exit,
        transform: `scale(${1 - exit * 0.25})`,
      }}
    >
      <svg width={R * 3} height={R * 3} viewBox={`${-R * 1.5} ${-R * 1.5} ${R * 3} ${R * 3}`} style={{ overflow: "visible", filter: shadow }}>
        {/* قطعات حلقه */}
        {Array.from({ length: pieces }, (_, i) => {
          const a0 = (Math.PI * 2 * i) / pieces + gap;
          const a1 = (Math.PI * 2 * (i + 1)) / pieces - gap;
          const s = spring({ frame: frame - i * 2.5, fps, config: { damping: 13, stiffness: 95 } });
          const dir = random(`${scene.id}-d${i}`) * Math.PI * 2;
          const dist = R * 4 * (1 - s);
          const rot = (1 - s) * (random(`${scene.id}-r${i}`) - 0.5) * 240;
          const ring = [palette.primary, palette.accent, palette.layers[palette.layers.length - 1], lighten(palette.accent, 0.3)];
          const color = ring[i % ring.length];
          return (
            <g key={i} transform={`translate(${Math.cos(dir) * dist} ${Math.sin(dir) * dist}) rotate(${rot})`} opacity={Math.min(1, s * 2)}>
              <path d={wedge(R * 0.72, R, a0, a1)} fill={color} />
              <path d={wedge(R * 0.72, R * 0.8, a0, a1)} fill={darken(color, 0.15)} opacity={0.5} />
            </g>
          );
        })}
        {/* دایره داخلی */}
        <circle r={R * 0.66 * inner} fill={lighten(palette.background, 0.8)} />
        <circle r={R * 0.66 * inner} fill="none" stroke={palette.accent} strokeWidth={R * 0.03} strokeDasharray={`${glow * R * 4.2} ${R * 5}`} />
      </svg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {scene.logoSrc ? (
          <Img
            src={scene.logoSrc.startsWith("http") || scene.logoSrc.startsWith("file:") ? scene.logoSrc : staticFile(scene.logoSrc)}
            style={{ width: R * 0.95, height: R * 0.95, objectFit: "contain", transform: `scale(${mono})`, opacity: mono }}
          />
        ) : (
          <div
            dir="rtl"
            style={{
              fontFamily: FONT_FAMILY,
              fontWeight: 900,
              fontSize: R * (scene.monogram.length > 2 ? 0.42 : 0.6),
              color: palette.primary,
              transform: `scale(${mono}) rotate(${(1 - mono) * -20}deg)`,
              opacity: Math.min(1, mono * 1.5),
              lineHeight: 1,
              marginTop: R * 0.06,
            }}
          >
            {scene.monogram}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
