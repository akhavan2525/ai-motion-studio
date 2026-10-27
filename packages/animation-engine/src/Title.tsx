/**
 * متن متحرک فارسی.
 * نکته RTL: حروف فارسی به هم چسبیده‌اند، پس هرگز حرف‌به‌حرف جدا نمی‌کنیم؛
 * واحد انیمیشن «کلمه» است و جهت کل بلوک rtl است تا ترتیب کلمات درست بماند.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import type { Palette, Scene, Style } from "@ams/project-schema";
import { FONT_FAMILY } from "./fonts";
import { darken, lighten, luminance } from "./color";

type TitleScene = Extract<Scene, { action: "title_reveal" }>;

export const TitleReveal: React.FC<{ scene: TitleScene; palette: Palette; style: Style; isLast: boolean }> = ({
  scene,
  palette,
  style,
  isLast,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const words = scene.text.split(/\s+/).filter(Boolean);
  const portrait = height > width;
  const fontSize = Math.round(Math.min(width, height) * (words.length > 5 ? 0.075 : 0.09));
  const d = scene.durationFrames;

  // کارت کاغذی پشت متن که از راست باز می‌شود
  const card = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const exit = isLast ? 0 : interpolate(frame, [d - 12, d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const paper = style === "paper-cut";
  const wordDelay = Math.max(3, Math.min(8, Math.floor((d * 0.35) / Math.max(1, words.length))));

  const renderWord = (w: string, i: number) => {
    const local = frame - 6 - i * wordDelay;
    const s = spring({ frame: local, fps, config: { damping: 14, stiffness: 140, mass: 0.7 } });
    const common: React.CSSProperties = { display: "inline-block", whiteSpace: "nowrap" };

    if (scene.animation === "paper-strip") {
      return (
        <span
          key={i}
          style={{
            ...common,
            padding: "0.05em 0.35em 0.15em",
            margin: "0.12em",
            background: i % 2 ? palette.accent : palette.primary,
            color: "#fff",
            transform: `translateX(${(1 - s) * -120}px) rotate(${(1 - s) * -8 + (i % 2 ? 1.5 : -1.5)}deg)`,
            opacity: Math.min(1, s * 1.5),
            boxShadow: paper ? "0 8px 18px rgba(0,0,0,0.22)" : "none",
          }}
        >
          {w}
        </span>
      );
    }
    if (scene.animation === "fade-up") {
      const t = spring({ frame: frame - 6, fps, config: { damping: 20 } });
      return (
        <span key={i} style={{ ...common, margin: "0 0.14em", opacity: t, transform: `translateY(${(1 - t) * 40}px)` }}>
          {w}
        </span>
      );
    }
    // word-by-word
    return (
      <span
        key={i}
        style={{
          ...common,
          margin: "0 0.14em",
          opacity: Math.min(1, s * 1.4),
          transform: `translateY(${(1 - s) * 60}px) scale(${0.85 + 0.15 * s})`,
        }}
      >
        {w}
      </span>
    );
  };

  const subT = spring({ frame: frame - 10 - words.length * wordDelay, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: 1 - exit,
        transform: `translateY(${exit * -30}px)`,
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: portrait ? "88%" : "78%",
          padding: `${fontSize * 0.45}px ${fontSize * 0.8}px ${fontSize * 0.55}px`,
          marginTop: portrait ? -height * 0.12 : -height * 0.1,
        }}
      >
        {scene.animation !== "paper-strip" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: paper
                ? // متن روشن (پالت شب) روی کارت روشن خوانا نیست؛ آن‌وقت کارت تیره می‌شود
                  luminance(palette.text) > 0.5
                  ? darken(palette.background, 0.25)
                  : lighten(palette.background, 0.75)
                : `${darken(palette.background, 0.1)}cc`,
              borderRadius: paper ? 6 : fontSize * 0.25,
              transform: `scaleX(${card})`,
              transformOrigin: "100% 50%",
              boxShadow: paper ? "0 18px 40px rgba(20,25,35,0.28), 0 3px 6px rgba(20,25,35,0.18)" : "none",
              borderInlineStart: paper ? `${fontSize * 0.12}px solid ${palette.accent}` : "none",
            }}
          />
        )}
        <div
          dir="rtl"
          lang="fa"
          style={{
            position: "relative",
            fontFamily: FONT_FAMILY,
            fontWeight: 800,
            fontSize,
            lineHeight: 1.55,
            color: scene.animation === "paper-strip" ? "#fff" : palette.text,
            textAlign: "center",
            direction: "rtl",
            unicodeBidi: "isolate",
          }}
        >
          {words.map(renderWord)}
        </div>
        {scene.subtitle ? (
          <div
            dir="rtl"
            style={{
              position: "relative",
              fontFamily: FONT_FAMILY,
              fontWeight: 500,
              fontSize: fontSize * 0.42,
              color: palette.primary,
              textAlign: "center",
              marginTop: fontSize * 0.15,
              opacity: subT,
              transform: `translateY(${(1 - subT) * 20}px)`,
            }}
          >
            {scene.subtitle}
          </div>
        ) : null}
        {/* خط زیر عنوان که از راست به چپ کشیده می‌شود */}
        {scene.animation !== "paper-strip" && (
          <div
            style={{
              position: "relative",
              height: Math.max(4, fontSize * 0.07),
              marginTop: fontSize * 0.12,
              marginInline: "auto",
              width: `${interpolate(frame, [12 + words.length * wordDelay, 30 + words.length * wordDelay], [0, 45], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              })}%`,
              background: palette.accent,
              borderRadius: 4,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
