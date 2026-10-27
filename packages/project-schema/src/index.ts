/**
 * قرارداد مرکزی پروژه: هر چیزی که AI می‌سازد، موتور انیمیشن رندر می‌کند
 * یا کاربر ذخیره می‌کند، باید با این اسکیما معتبر باشد.
 */
import { z } from "zod";

export const SCHEMA_VERSION = 1;

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "رنگ باید به شکل #RRGGBB باشد");

export const StyleSchema = z.enum(["paper-cut", "minimal"]);
export type Style = z.infer<typeof StyleSchema>;

export const AspectSchema = z.enum(["16:9", "9:16", "1:1"]);
export type Aspect = z.infer<typeof AspectSchema>;

export const ASPECT_SIZES: Record<Aspect, [number, number]> = {
  "16:9": [1920, 1080],
  "9:16": [1080, 1920],
  "1:1": [1080, 1080],
};

export const PaletteSchema = z.object({
  background: hexColor,
  /** رنگ‌های لایه‌های کاغذی از دور به نزدیک */
  layers: z.array(hexColor).min(2).max(6),
  primary: hexColor,
  accent: hexColor,
  text: hexColor,
});
export type Palette = z.infer<typeof PaletteSchema>;

/** شکل‌های کتابخانه داخلی Paper Cut (Asset Finder اول از این‌ها استفاده می‌کند) */
export const PaperShapeSchema = z.enum([
  "hills",
  "mountains",
  "waves",
  "clouds",
  "sun",
  "trees",
  "city",
]);
export type PaperShape = z.infer<typeof PaperShapeSchema>;

/** انواع حرکتی که موتور برای هر لایه پشتیبانی می‌کند */
export const LayerMotionSchema = z.enum([
  "rise", // از پایین بالا می‌آید
  "drop", // از بالا پایین می‌افتد
  "parallax", // حرکت افقی آرام وابسته به عمق
  "sway", // تاب خوردن
  "float", // شناور بالا و پایین
  "spin", // چرخش آرام (برای خورشید)
]);
export type LayerMotion = z.infer<typeof LayerMotionSchema>;

export const PaperLayerSchema = z.object({
  id: z.string().min(1),
  shape: PaperShapeSchema,
  /** ۰ = دورترین، ۱ = نزدیک‌ترین؛ روی سایه، سرعت پارالاکس و ترتیب ورود اثر دارد */
  depth: z.number().min(0).max(1),
  color: hexColor.optional(),
  motions: z.array(LayerMotionSchema).min(1).max(3),
  /** تأخیر ورود به فریم نسبت به شروع صحنه */
  delayFrames: z.number().int().min(0).default(0),
});
export type PaperLayer = z.infer<typeof PaperLayerSchema>;

const sceneBase = {
  id: z.string().min(1),
  startFrame: z.number().int().min(0),
  durationFrames: z.number().int().min(1),
};

export const PaperLayersRevealSceneSchema = z.object({
  ...sceneBase,
  action: z.literal("paper_layers_reveal"),
  layers: z.array(PaperLayerSchema).min(1).max(12),
  camera: z.enum(["none", "push-in", "pan"]).default("push-in"),
});

export const LogoAssembleSceneSchema = z.object({
  ...sceneBase,
  action: z.literal("logo_assemble"),
  /** متن کوتاه داخل نشان (مثلاً حروف اول) */
  monogram: z.string().min(1).max(4),
  /** مسیر فایل لوگوی کاربر (PNG/SVG)؛ اگر نباشد نشان کاغذی ساخته می‌شود */
  logoSrc: z.string().optional(),
});

export const TitleRevealSceneSchema = z.object({
  ...sceneBase,
  action: z.literal("title_reveal"),
  text: z.string().min(1).max(120),
  subtitle: z.string().max(160).optional(),
  animation: z.enum(["word-by-word", "fade-up", "paper-strip"]).default("word-by-word"),
  /** صحنه‌ای که متن رویش نمایش داده می‌شود (لایه‌ها پشت متن می‌مانند) */
  overScene: z.string().optional(),
});

export const SceneSchema = z.discriminatedUnion("action", [
  PaperLayersRevealSceneSchema,
  LogoAssembleSceneSchema,
  TitleRevealSceneSchema,
]);
export type Scene = z.infer<typeof SceneSchema>;
export type SceneAction = Scene["action"];

export const ProjectSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
    project: z.string().min(1).max(120),
    fps: z.number().int().min(12).max(60),
    durationFrames: z.number().int().min(1).max(60 * 60 * 10),
    aspect: AspectSchema.default("16:9"),
    style: StyleSchema,
    palette: PaletteSchema,
    scenes: z.array(SceneSchema).min(1).max(40),
  })
  .superRefine((p, ctx) => {
    const ids = new Set<string>();
    p.scenes.forEach((s, i) => {
      if (ids.has(s.id)) {
        ctx.addIssue({ code: "custom", path: ["scenes", i, "id"], message: `شناسه تکراری صحنه: ${s.id}` });
      }
      ids.add(s.id);
      if (s.startFrame + s.durationFrames > p.durationFrames) {
        ctx.addIssue({
          code: "custom",
          path: ["scenes", i],
          message: `صحنه «${s.id}» از انتهای پروژه (${p.durationFrames} فریم) بیرون می‌زند`,
        });
      }
    });
    p.scenes.forEach((s, i) => {
      if (s.action === "title_reveal" && s.overScene && !ids.has(s.overScene)) {
        ctx.addIssue({ code: "custom", path: ["scenes", i, "overScene"], message: `صحنه پایه «${s.overScene}» وجود ندارد` });
      }
    });
  });
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectInput = z.input<typeof ProjectSchema>;

export type ValidationResult =
  | { ok: true; project: Project }
  | { ok: false; errors: string[] };

export function validateProject(input: unknown): ValidationResult {
  const r = ProjectSchema.safeParse(input);
  if (r.success) return { ok: true, project: r.data };
  return {
    ok: false,
    errors: r.error.issues.map((i) => `${i.path.join(".") || "(ریشه)"}: ${i.message}`),
  };
}

export function sizeOf(p: Pick<Project, "aspect">): { width: number; height: number } {
  const [width, height] = ASPECT_SIZES[p.aspect];
  return { width, height };
}

export const PALETTES: Record<string, Palette> = {
  /** پیش‌فرض: آسمان آبی و تپه‌های سبز/فیروزه‌ای */
  sky: {
    background: "#cfe8f3",
    layers: ["#9fd3c7", "#6fb7a8", "#3f8f84", "#24665f"],
    primary: "#1f5f8b",
    accent: "#f4a259",
    text: "#163042",
  },
  gold: {
    background: "#fbf3df",
    layers: ["#f1d9a0", "#e3b85c", "#c9922f", "#8d6418"],
    primary: "#b8860b",
    accent: "#d4762c",
    text: "#3b2a07",
  },
  sunset: {
    background: "#ffe3d1",
    layers: ["#ffb4a2", "#e5989b", "#b5838d", "#6d6875"],
    primary: "#c44569",
    accent: "#f8b500",
    text: "#2d1e2f",
  },
  night: {
    background: "#1b2440",
    layers: ["#2e3a66", "#3f4f86", "#5468a8", "#7b8fd1"],
    primary: "#9fb4ff",
    accent: "#ffd166",
    text: "#f5f7ff",
  },
};
