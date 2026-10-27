/**
 * کتابخانه داخلی شکل‌های Paper Cut.
 * همه شکل‌ها با SVG و به‌صورت قطعی (seed ثابت) ساخته می‌شوند تا
 * هر بار رندر دقیقاً یکسان باشد و هر لایه مستقل متحرک شود.
 */
import React from "react";
import { random } from "remotion";
import type { PaperShape } from "@ams/project-schema";
import { darken, lighten } from "./color";

export interface ShapeProps {
  w: number;
  h: number;
  depth: number;
  color: string;
  accent: string;
  seed: string;
  /** فاز متحرک برای موج و ... (رادیان) */
  phase: number;
}

/** عرض اضافه برای اینکه پارالاکس لبه خالی نشان ندهد */
export const BLEED = 0.18;

function smoothPath(points: [number, number][], bottom: number): string {
  // منحنی Catmull-Rom به Bezier برای لبه‌های نرم کاغذی
  let d = `M ${points[0][0]} ${bottom} L ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d + ` L ${points[points.length - 1][0]} ${bottom} Z`;
}

/** خط افق هر لایه: لایه‌های نزدیک‌تر پایین‌تر و کوتاه‌ترند */
function baseline(h: number, depth: number) {
  return h * (0.5 + depth * 0.38);
}

const Hills: React.FC<ShapeProps> = ({ w, h, depth, color, seed }) => {
  const x0 = -w * BLEED;
  const x1 = w * (1 + BLEED);
  const n = 7;
  const base = baseline(h, depth);
  const amp = h * (0.04 + (1 - depth) * 0.06);
  const pts: [number, number][] = Array.from({ length: n + 1 }, (_, i) => [
    x0 + ((x1 - x0) * i) / n,
    base - amp * (0.3 + random(`${seed}-h${i}`) * 0.9),
  ]);
  return (
    <>
      <path d={smoothPath(pts, h + 40)} fill={color} />
      {/* نوار روشن لبه برای حس برش کاغذ */}
      <path d={smoothPath(pts.map(([x, y]) => [x, y + 6]), h + 40)} fill={darken(color, 0.06)} opacity={0.35} />
    </>
  );
};

const Mountains: React.FC<ShapeProps> = ({ w, h, depth, color, seed }) => {
  const x0 = -w * BLEED;
  const x1 = w * (1 + BLEED);
  const base = baseline(h, depth) + h * 0.05;
  const peaks = 5;
  const step = (x1 - x0) / peaks;
  let d = `M ${x0} ${h + 40} L ${x0} ${base}`;
  const caps: string[] = [];
  for (let i = 0; i < peaks; i++) {
    const px = x0 + step * (i + 0.5) + (random(`${seed}-mx${i}`) - 0.5) * step * 0.3;
    const py = base - h * (0.18 + random(`${seed}-my${i}`) * 0.2);
    const vx = x0 + step * (i + 1);
    const vy = base - h * 0.04 * random(`${seed}-mv${i}`);
    d += ` L ${px} ${py} L ${vx} ${vy}`;
    // کلاهک برفی
    const cw = step * 0.16;
    const ch = (base - py) * 0.22;
    caps.push(`M ${px} ${py} L ${px + cw} ${py + ch} L ${px + cw * 0.3} ${py + ch * 0.75} L ${px - cw * 0.2} ${py + ch * 1.05} L ${px - cw} ${py + ch} Z`);
  }
  d += ` L ${x1} ${h + 40} Z`;
  return (
    <>
      <path d={d} fill={color} />
      {caps.map((c, i) => (
        <path key={i} d={c} fill={lighten(color, 0.85)} />
      ))}
    </>
  );
};

const Waves: React.FC<ShapeProps> = ({ w, h, depth, color, phase, seed }) => {
  const x0 = -w * BLEED;
  const x1 = w * (1 + BLEED);
  const base = baseline(h, depth);
  const amp = h * (0.018 + depth * 0.02);
  const k = (Math.PI * 2) / (w * (0.35 + random(seed) * 0.2));
  const pts: [number, number][] = [];
  for (let x = x0; x <= x1 + 1; x += (x1 - x0) / 40) pts.push([x, base + Math.sin(x * k + phase) * amp]);
  return <path d={smoothPath(pts, h + 40)} fill={color} />;
};

const Clouds: React.FC<ShapeProps> = ({ w, h, seed }) => {
  const clouds = [0, 1, 2, 3].map((i) => ({
    x: w * (0.08 + i * 0.27 + (random(`${seed}-cx${i}`) - 0.5) * 0.1),
    y: h * (0.12 + random(`${seed}-cy${i}`) * 0.16),
    s: 0.7 + random(`${seed}-cs${i}`) * 0.6,
  }));
  return (
    <>
      {clouds.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
          <ellipse cx={0} cy={18} rx={95} ry={26} fill="#ffffff" />
          <circle cx={-40} cy={6} r={34} fill="#ffffff" />
          <circle cx={8} cy={-8} r={46} fill="#ffffff" />
          <circle cx={52} cy={8} r={30} fill="#ffffff" />
        </g>
      ))}
    </>
  );
};

const Sun: React.FC<ShapeProps> = ({ w, h, accent, phase }) => {
  const cx = w * 0.78;
  const cy = h * 0.26;
  const r = Math.min(w, h) * 0.09;
  const rays = 12;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g transform={`rotate(${(phase * 180) / Math.PI})`}>
        {Array.from({ length: rays }, (_, i) => (
          <path
            key={i}
            transform={`rotate(${(360 / rays) * i})`}
            d={`M ${-r * 0.16} ${-r * 1.15} L 0 ${-r * 1.65} L ${r * 0.16} ${-r * 1.15} Z`}
            fill={lighten(accent, 0.2)}
          />
        ))}
      </g>
      <circle r={r * 1.08} fill={lighten(accent, 0.45)} />
      <circle r={r * 0.86} fill={accent} />
      <circle r={r * 0.6} fill={lighten(accent, 0.25)} />
    </g>
  );
};

const Trees: React.FC<ShapeProps> = ({ w, h, depth, color, seed }) => {
  const base = baseline(h, depth) + h * 0.015;
  const count = 11;
  const trees = Array.from({ length: count }, (_, i) => {
    const x = -w * 0.05 + (w * 1.1 * (i + random(`${seed}-tx${i}`) * 0.6)) / count;
    const s = 0.7 + random(`${seed}-ts${i}`) * 0.6;
    return { x, s, pine: random(`${seed}-tp${i}`) > 0.45 };
  });
  return (
    <>
      {trees.map((t, i) => {
        const th = h * 0.2 * t.s;
        const tw = th * 0.48;
        const c = i % 2 ? color : darken(color, 0.12);
        return (
          <g key={i} transform={`translate(${t.x} ${base})`}>
            <rect x={-tw * 0.06} y={-th * 0.25} width={tw * 0.12} height={th * 0.3} fill={darken(color, 0.4)} />
            {t.pine ? (
              <>
                <path d={`M ${-tw / 2} ${-th * 0.2} L 0 ${-th * 0.75} L ${tw / 2} ${-th * 0.2} Z`} fill={c} />
                <path d={`M ${-tw * 0.4} ${-th * 0.5} L 0 ${-th} L ${tw * 0.4} ${-th * 0.5} Z`} fill={lighten(c, 0.08)} />
              </>
            ) : (
              <circle cx={0} cy={-th * 0.55} r={tw * 0.5} fill={c} />
            )}
          </g>
        );
      })}
    </>
  );
};

const City: React.FC<ShapeProps> = ({ w, h, depth, color, seed, accent }) => {
  const base = baseline(h, depth) + h * 0.06;
  const x0 = -w * BLEED;
  const x1 = w * (1 + BLEED);
  const blocks: React.ReactNode[] = [];
  let x = x0;
  let i = 0;
  while (x < x1) {
    const bw = w * (0.04 + random(`${seed}-bw${i}`) * 0.05);
    const bh = h * (0.1 + random(`${seed}-bh${i}`) * 0.22) * (1.1 - depth * 0.4);
    blocks.push(<rect key={`b${i}`} x={x} y={base - bh} width={bw + 1} height={bh + h} fill={i % 2 ? color : darken(color, 0.07)} />);
    for (let wy = base - bh + 14; wy < base - 14; wy += 26) {
      for (let wx = x + 8; wx < x + bw - 12; wx += 18) {
        if (random(`${seed}-w${i}-${wx}-${wy}`) > 0.55) {
          blocks.push(<rect key={`w${i}-${wx}-${wy}`} x={wx} y={wy} width={8} height={12} fill={lighten(accent, 0.5)} opacity={0.8} />);
        }
      }
    }
    x += bw;
    i++;
  }
  return <>{blocks}</>;
};

export const SHAPES: Record<PaperShape, React.FC<ShapeProps>> = {
  hills: Hills,
  mountains: Mountains,
  waves: Waves,
  clouds: Clouds,
  sun: Sun,
  trees: Trees,
  city: City,
};
