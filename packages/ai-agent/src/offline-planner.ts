/**
 * برنامه‌ریز آفلاین: وقتی کلید AvalAI نیست یا اینترنت قطع است،
 * دستورهای رایج فارسی را با قاعده به همان ابزارهای مدل زبانی تبدیل می‌کند.
 * خروجی دقیقاً همان ToolInvocationهایی است که مدل تولید می‌کند،
 * پس مسیر اجرا و اعتبارسنجی برای هر دو یکی است.
 */
import type { Project } from "@ams/project-schema";
import type { ToolInvocation } from "./tools";
import { extractSeconds, monogramFrom, normalizeText } from "./persian";

const COLOR_TO_PRESET: [RegExp, string][] = [
  [/طلایی|طلا|زرد|gold/i, "gold"],
  [/غروب|نارنجی|صورتی|sunset/i, "sunset"],
  [/شب|تیره|سرمه|مشکی|night|dark/i, "night"],
  [/آبی|آسمان|سبز|sky|blue/i, "sky"],
];

function presetFor(text: string): string | undefined {
  return COLOR_TO_PRESET.find(([re]) => re.test(text))?.[1];
}

/** متن بین «» یا "" یا بعد از کلمه «عنوان/متن» */
export function extractTitle(text: string): string | undefined {
  const t = normalizeText(text);
  const quoted = t.match(/[«"“]([^»"”]+)[»"”]/);
  if (quoted) return quoted[1].trim();
  const m = t.match(
    /(?:با\s+)?(?:عنوان|تیتر|متن|نوشته)\s*(?:ی\s+)?(?::\s*)?(.+?)\s*(?:بساز|درست کن|بنویس|ایجاد کن|تولید کن|بذار|بگذار|[.!؟?]|$)/,
  );
  if (m) {
    return m[1]
      .replace(/\s*(برام|برای من|لطفا|لطفاً)\s*$/, "")
      .replace(/\s+(رو|را)$/, "")
      .trim();
  }
  return undefined;
}

function detectStyle(t: string): "paper-cut" | "minimal" {
  if (/مینیمال|minimal|ساده|هندسی/i.test(t)) return "minimal";
  return "paper-cut";
}

function detectAspect(t: string): "16:9" | "9:16" | "1:1" {
  if (/9:16|عمودی|استوری|ریلز|reels|story|شورتز|shorts/i.test(t)) return "9:16";
  if (/1:1|مربع|پست اینستا/i.test(t)) return "1:1";
  return "16:9";
}

function detectTheme(t: string): "landscape" | "sea" | "city" | "night" {
  if (/دریا|اقیانوس|موج|ساحل/.test(t)) return "sea";
  if (/شهر|ساختمان|برج/.test(t)) return "city";
  if (/شب|ستاره|ماه/.test(t)) return "night";
  return "landscape";
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** یک دستور جدید (پروژه از صفر) */
function planNew(text: string): ToolInvocation[] {
  const t = normalizeText(text);
  const seconds = Math.min(600, Math.max(3, extractSeconds(t) ?? 10));
  const style = detectStyle(t);
  const aspect = detectAspect(t);
  const theme = detectTheme(t);
  const title = extractTitle(t) ?? "موشن‌گرافیک من";
  const wantsLogo = /لوگو|logo|نشان/i.test(t);
  const palette = presetFor(t.replace(/آبی|سبز/g, "")) ?? (theme === "night" ? "night" : style === "minimal" ? "night" : "sky");

  const calls: ToolInvocation[] = [
    { name: "createProject", args: { name: title, durationSeconds: seconds, style, aspect, palette } },
    { name: "addPaperCutScene", args: { id: "scene-bg", startSeconds: 0, durationSeconds: seconds, theme, camera: "push-in" } },
  ];

  if (wantsLogo) {
    // لوگو در وسط، سپس عنوان
    calls.push({
      name: "animateLogo",
      args: { id: "logo", startSeconds: r1(seconds * 0.12), durationSeconds: r1(seconds * 0.45), monogram: monogramFrom(title) },
    });
    calls.push({
      name: "addAnimatedText",
      args: { id: "title", text: title, startSeconds: r1(seconds * 0.5), durationSeconds: r1(seconds * 0.5), animation: "word-by-word" },
    });
  } else {
    calls.push({
      name: "addAnimatedText",
      args: { id: "title", text: title, startSeconds: r1(seconds * 0.22), durationSeconds: r1(seconds * 0.78), animation: "word-by-word" },
    });
  }
  calls.push({ name: "exportVideo", args: {} });
  return calls;
}

/** ویرایش پروژه موجود: فقط بخش مرتبط عوض می‌شود */
function planEdit(text: string, project: Project): ToolInvocation[] | null {
  const t = normalizeText(text);
  const calls: ToolInvocation[] = [];
  const title = project.scenes.find((s) => s.action === "title_reveal");

  // «رنگ آبی رو طلایی کن» ← فقط پالت
  const colorChange = t.match(/رنگ\s*(?:\S+\s+)?(?:رو|را)?\s*(.+?)\s*(?:کن|بکن|بشه|بزن)/);
  if (colorChange || /رنگ/.test(t)) {
    const target = colorChange?.[1] ?? t;
    const preset = presetFor(target.split(/\s+(?:رو|را)\s+/).pop() ?? target);
    if (preset) calls.push({ name: "setPalette", args: { preset } });
  }

  // «عنوان رو به ... تغییر بده» / «متن رو ... کن»
  const newTitle = t.match(/(?:عنوان|متن|تیتر)\s*(?:رو|را)\s*(?:به\s*)?[«"]?(.+?)[»"]?\s*(?:تغییر بده|عوض کن|کن)$/);
  if (newTitle && title) calls.push({ name: "updateScene", args: { id: title.id, text: newTitle[1].trim() } });

  // «انیمیشن متن رو محو شونده کن»
  if (title && /محو|fade/i.test(t) && /متن|عنوان/.test(t)) calls.push({ name: "updateScene", args: { id: title.id, animation: "fade-up" } });
  if (title && /نوار|کاغذ/.test(t) && /متن|عنوان/.test(t) && !newTitle) calls.push({ name: "updateScene", args: { id: title.id, animation: "paper-strip" } });

  // «لوگو رو حذف کن»
  const logo = project.scenes.find((s) => s.action === "logo_assemble");
  if (logo && /لوگو/.test(t) && /حذف|بردار/.test(t)) calls.push({ name: "removeScene", args: { id: logo.id } });

  // «یه لوگو هم اضافه کن»
  if (!logo && /لوگو/.test(t) && /اضافه|بذار|بگذار|بساز/.test(t)) {
    const secs = project.durationFrames / project.fps;
    calls.push({
      name: "animateLogo",
      args: { id: "logo", startSeconds: r1(secs * 0.05), durationSeconds: r1(secs * 0.4), monogram: monogramFrom(title?.text ?? project.project) },
    });
  }

  if (/رندر|خروجی|export|mp4/i.test(t)) calls.push({ name: "exportVideo", args: {} });
  return calls.length ? calls : null;
}

export interface OfflinePlan {
  calls: ToolInvocation[];
  /** توضیح کوتاه برای نمایش در چت */
  summary: string;
}

export function planOffline(text: string, project: Project | null): OfflinePlan {
  const t = normalizeText(text);
  const isNew = !project || /بساز|درست کن|تولید کن|ایجاد کن/.test(t) && !/رنگ|عوض|تغییر|حذف/.test(t);
  if (!isNew && project) {
    const edit = planEdit(t, project);
    if (edit) return { calls: edit, summary: "ویرایش بخش مرتبط پروژه" };
    return { calls: [], summary: "این دستور را در حالت آفلاین متوجه نشدم. برای دستورهای آزادتر کلید AvalAI را وارد کنید." };
  }
  return { calls: planNew(t), summary: "ساخت پروژه جدید" };
}
