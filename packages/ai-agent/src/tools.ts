/**
 * Tool Executor: تنها راهی که AI می‌تواند پروژه را تغییر دهد.
 * هر ابزار یک تغییر کوچک و مشخص می‌سازد، نتیجه اعتبارسنجی می‌شود
 * و اگر نامعتبر بود، پروژه دست‌نخورده می‌ماند و خطا به مدل برمی‌گردد.
 */
import {
  PALETTES,
  type Palette,
  type PaperLayer,
  type PaperShape,
  type LayerMotion,
  type Project,
  type ProjectInput,
  type Scene,
  validateProject,
} from "@ams/project-schema";
import type { ToolDefinition } from "@ams/avalai-client";

export type ToolName =
  | "createProject"
  | "addPaperCutScene"
  | "animateLogo"
  | "addAnimatedText"
  | "setPalette"
  | "updateScene"
  | "removeScene"
  | "exportVideo";

export interface ToolInvocation {
  name: ToolName;
  args: Record<string, any>;
}

export type ToolResult =
  | { ok: true; project: Project | null; message: string; exportRequested?: { fileName?: string } }
  | { ok: false; error: string };

const SHAPES: PaperShape[] = ["hills", "mountains", "waves", "clouds", "sun", "trees", "city"];
const MOTIONS: LayerMotion[] = ["rise", "drop", "parallax", "sway", "float", "spin"];
const THEMES = ["landscape", "sea", "city", "night"] as const;
type Theme = (typeof THEMES)[number];

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "createProject",
      description: "یک پروژه خالی جدید می‌سازد. همیشه اولین ابزار برای پروژه جدید است.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "نام پروژه" },
          durationSeconds: { type: "number", minimum: 1, maximum: 600 },
          style: { type: "string", enum: ["paper-cut", "minimal"] },
          aspect: { type: "string", enum: ["16:9", "9:16", "1:1"] },
          palette: { type: "string", enum: Object.keys(PALETTES) },
        },
        required: ["name", "durationSeconds", "style"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "addPaperCutScene",
      description:
        "صحنه کاغذی چندلایه اضافه می‌کند. اگر layers داده نشود، Layer Composer براساس theme لایه‌ها را خودکار می‌چیند.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          startSeconds: { type: "number", minimum: 0 },
          durationSeconds: { type: "number", minimum: 0.5 },
          theme: { type: "string", enum: [...THEMES] },
          camera: { type: "string", enum: ["none", "push-in", "pan"] },
          layers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                shape: { type: "string", enum: SHAPES },
                depth: { type: "number", minimum: 0, maximum: 1 },
                motions: { type: "array", items: { type: "string", enum: MOTIONS } },
              },
              required: ["shape", "depth", "motions"],
            },
          },
        },
        required: ["startSeconds", "durationSeconds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "animateLogo",
      description: "لوگوموشن: قطعات کاغذی کنار هم قرار می‌گیرند و نشان ساخته می‌شود.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          startSeconds: { type: "number", minimum: 0 },
          durationSeconds: { type: "number", minimum: 1 },
          monogram: { type: "string", description: "۱ تا ۴ حرف داخل نشان" },
          logoSrc: { type: "string", description: "مسیر فایل لوگوی کاربر در صورت وجود" },
        },
        required: ["startSeconds", "durationSeconds", "monogram"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "addAnimatedText",
      description: "متن متحرک فارسی (راست‌به‌چپ) اضافه می‌کند.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          subtitle: { type: "string" },
          startSeconds: { type: "number", minimum: 0 },
          durationSeconds: { type: "number", minimum: 0.5 },
          animation: { type: "string", enum: ["word-by-word", "fade-up", "paper-strip"] },
        },
        required: ["text", "startSeconds", "durationSeconds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "setPalette",
      description: "فقط رنگ‌های پروژه را عوض می‌کند. یا یک preset بده یا رنگ‌های تکی را.",
      parameters: {
        type: "object",
        properties: {
          preset: { type: "string", enum: Object.keys(PALETTES) },
          background: { type: "string" },
          primary: { type: "string" },
          accent: { type: "string" },
          text: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateScene",
      description: "فقط یک صحنه را ویرایش می‌کند (متن، زمان، انیمیشن). بقیه پروژه دست نمی‌خورد.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          subtitle: { type: "string" },
          monogram: { type: "string" },
          animation: { type: "string", enum: ["word-by-word", "fade-up", "paper-strip"] },
          startSeconds: { type: "number" },
          durationSeconds: { type: "number" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "removeScene",
      description: "یک صحنه را حذف می‌کند.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "exportVideo",
      description: "درخواست رندر خروجی MP4. فقط وقتی پروژه آماده است صدا بزن.",
      parameters: { type: "object", properties: { fileName: { type: "string" } } },
    },
  },
];

/** چیدمان خودکار لایه‌ها براساس موضوع (کتابخانه داخلی، بدون نیاز به تصویرساز) */
export function composeLayers(theme: Theme): Omit<PaperLayer, "id">[] {
  const L = (shape: PaperShape, depth: number, motions: LayerMotion[], delayFrames: number) => ({
    shape,
    depth,
    motions,
    delayFrames,
  });
  switch (theme) {
    case "sea":
      return [
        L("sun", 0.05, ["rise", "spin"], 0),
        L("clouds", 0.2, ["drop", "float"], 6),
        L("waves", 0.45, ["rise", "parallax"], 10),
        L("waves", 0.7, ["rise", "parallax"], 16),
        L("waves", 0.95, ["rise", "parallax"], 22),
      ];
    case "city":
      return [
        L("sun", 0.05, ["rise", "spin"], 0),
        L("clouds", 0.2, ["drop", "float"], 6),
        L("city", 0.45, ["rise", "parallax"], 10),
        L("city", 0.7, ["rise", "parallax"], 16),
        L("hills", 0.95, ["rise", "parallax"], 22),
      ];
    case "night":
    case "landscape":
    default:
      return [
        L("sun", 0.05, ["rise", "spin"], 0),
        L("clouds", 0.2, ["drop", "float"], 6),
        L("mountains", 0.35, ["rise", "parallax"], 10),
        L("hills", 0.55, ["rise", "parallax"], 15),
        L("hills", 0.75, ["rise", "parallax"], 20),
        L("trees", 0.85, ["rise", "sway"], 26),
        L("hills", 1, ["rise", "parallax"], 30),
      ];
  }
}

function sec(project: Pick<Project, "fps">, s: unknown, name: string): number {
  if (typeof s !== "number" || !Number.isFinite(s) || s < 0) throw new Error(`${name} باید عدد مثبت باشد`);
  return Math.round(s * project.fps);
}

function nextId(project: Project, prefix: string): string {
  let i = 1;
  while (project.scenes.some((s) => s.id === `${prefix}-${i}`)) i++;
  return `${prefix}-${i}`;
}

/** چون صحنه اول در createProject هنوز وجود ندارد، پروژه خالی موقت نگه داشته می‌شود */
export interface DraftState {
  project: Project | null;
  draft: Omit<ProjectInput, "scenes"> | null;
}

function current(state: DraftState): Project {
  if (state.project) return state.project;
  if (state.draft) return { ...(state.draft as Project), scenes: [] };
  throw new Error("هنوز پروژه‌ای ساخته نشده؛ اول createProject را صدا بزن");
}

function commit(state: DraftState, next: ProjectInput): ToolResult & { state?: DraftState } {
  const v = validateProject(next);
  if (!v.ok) return { ok: false, error: `پروژه نامعتبر شد:\n${v.errors.join("\n")}` };
  state.project = v.project;
  return { ok: true, project: v.project, message: "" };
}

/** اجرای یک ابزار روی state. در صورت خطا state تغییر نمی‌کند. */
export function executeTool(state: DraftState, call: ToolInvocation): ToolResult {
  try {
    const a = call.args ?? {};
    switch (call.name) {
      case "createProject": {
        const preset = PALETTES[a.palette as string] ?? (a.style === "minimal" ? PALETTES.night : PALETTES.sky);
        const fps = 30;
        const durationFrames = sec({ fps }, a.durationSeconds, "durationSeconds");
        if (durationFrames < fps) throw new Error("مدت پروژه حداقل ۱ ثانیه است");
        state.draft = {
          project: String(a.name || "پروژه بدون نام"),
          fps,
          durationFrames,
          aspect: a.aspect ?? "16:9",
          style: a.style === "minimal" ? "minimal" : "paper-cut",
          palette: preset,
        };
        state.project = null;
        return { ok: true, project: null, message: `پروژه «${state.draft.project}» با ${a.durationSeconds} ثانیه ساخته شد` };
      }

      case "addPaperCutScene": {
        const p = current(state);
        const theme: Theme = THEMES.includes(a.theme) ? a.theme : "landscape";
        const raw: Omit<PaperLayer, "id">[] = Array.isArray(a.layers) && a.layers.length
          ? a.layers.map((l: any, i: number) => ({ shape: l.shape, depth: l.depth, motions: l.motions, delayFrames: i * 5 }))
          : composeLayers(theme);
        const scene: Scene = {
          id: a.id || nextId(p, "paper"),
          action: "paper_layers_reveal",
          startFrame: sec(p, a.startSeconds, "startSeconds"),
          durationFrames: clampToEnd(p, sec(p, a.startSeconds, "startSeconds"), sec(p, a.durationSeconds, "durationSeconds")),
          camera: a.camera ?? "push-in",
          layers: raw.map((l, i) => ({ ...l, id: `${l.shape}-${i + 1}` })),
        };
        const r = commit(state, { ...p, scenes: [...p.scenes, scene] });
        return r.ok ? { ...r, message: `صحنه کاغذی «${scene.id}» با ${scene.layers.length} لایه اضافه شد` } : r;
      }

      case "animateLogo": {
        const p = current(state);
        const start = sec(p, a.startSeconds, "startSeconds");
        const scene: Scene = {
          id: a.id || nextId(p, "logo"),
          action: "logo_assemble",
          startFrame: start,
          durationFrames: clampToEnd(p, start, sec(p, a.durationSeconds, "durationSeconds")),
          monogram: String(a.monogram ?? "AI").slice(0, 4),
          ...(a.logoSrc ? { logoSrc: String(a.logoSrc) } : {}),
        };
        const r = commit(state, { ...p, scenes: [...p.scenes, scene] });
        return r.ok ? { ...r, message: `لوگوموشن «${scene.id}» اضافه شد` } : r;
      }

      case "addAnimatedText": {
        const p = current(state);
        const start = sec(p, a.startSeconds, "startSeconds");
        const scene: Scene = {
          id: a.id || nextId(p, "title"),
          action: "title_reveal",
          startFrame: start,
          durationFrames: clampToEnd(p, start, sec(p, a.durationSeconds, "durationSeconds")),
          text: String(a.text),
          ...(a.subtitle ? { subtitle: String(a.subtitle) } : {}),
          animation: a.animation ?? "word-by-word",
        };
        const r = commit(state, { ...p, scenes: [...p.scenes, scene] });
        return r.ok ? { ...r, message: `متن «${scene.text}» اضافه شد` } : r;
      }

      case "setPalette": {
        const p = current(state);
        const base: Palette = PALETTES[a.preset as string] ?? p.palette;
        const palette: Palette = {
          ...base,
          ...(a.background ? { background: a.background } : {}),
          ...(a.primary ? { primary: a.primary } : {}),
          ...(a.accent ? { accent: a.accent } : {}),
          ...(a.text ? { text: a.text } : {}),
        };
        if (!state.project) {
          state.draft = { ...state.draft!, palette };
          return { ok: true, project: null, message: "رنگ‌ها تنظیم شد" };
        }
        const r = commit(state, { ...p, palette });
        return r.ok ? { ...r, message: "فقط رنگ‌های پروژه عوض شد" } : r;
      }

      case "updateScene": {
        const p = current(state);
        const idx = p.scenes.findIndex((s) => s.id === a.id);
        if (idx < 0) throw new Error(`صحنه «${a.id}» پیدا نشد. صحنه‌ها: ${p.scenes.map((s) => s.id).join("، ")}`);
        const old = p.scenes[idx];
        const updated: any = { ...old };
        if (a.startSeconds !== undefined) updated.startFrame = sec(p, a.startSeconds, "startSeconds");
        if (a.durationSeconds !== undefined) updated.durationFrames = sec(p, a.durationSeconds, "durationSeconds");
        if (old.action === "title_reveal") {
          if (a.text) updated.text = String(a.text);
          if (a.subtitle !== undefined) updated.subtitle = String(a.subtitle);
          if (a.animation) updated.animation = a.animation;
        }
        if (old.action === "logo_assemble" && a.monogram) updated.monogram = String(a.monogram).slice(0, 4);
        const scenes = [...p.scenes];
        scenes[idx] = updated;
        const r = commit(state, { ...p, scenes });
        return r.ok ? { ...r, message: `فقط صحنه «${a.id}» ویرایش شد` } : r;
      }

      case "removeScene": {
        const p = current(state);
        if (!p.scenes.some((s) => s.id === a.id)) throw new Error(`صحنه «${a.id}» پیدا نشد`);
        const r = commit(state, { ...p, scenes: p.scenes.filter((s) => s.id !== a.id) });
        return r.ok ? { ...r, message: `صحنه «${a.id}» حذف شد` } : r;
      }

      case "exportVideo": {
        if (!state.project) throw new Error("پروژه هنوز صحنه‌ای ندارد و قابل رندر نیست");
        return {
          ok: true,
          project: state.project,
          message: "درخواست رندر ثبت شد",
          exportRequested: { fileName: a.fileName },
        };
      }

      default:
        return { ok: false, error: `ابزار ناشناخته: ${(call as any).name}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** اگر صحنه از انتهای پروژه بیرون بزند، کوتاهش می‌کنیم تا مدل در حلقه گیر نکند */
function clampToEnd(p: Project, start: number, duration: number): number {
  return Math.max(1, Math.min(duration, p.durationFrames - start));
}
