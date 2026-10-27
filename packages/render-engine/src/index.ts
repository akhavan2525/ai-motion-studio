/**
 * Render Engine: پروژه معتبر ← فریم‌ها با Chromium ← MP4 (H.264 + AAC) با FFmpeg داخلی Remotion.
 * کاملاً محلی و آفلاین اجرا می‌شود.
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition, ensureBrowser } from "@remotion/renderer";
import { validateProject, type Project } from "@ams/project-schema";

/** مسیر ورودی موتور انیمیشن؛ در برنامه دسکتاپ با AMS_ENTRY_POINT تعیین می‌شود */
export function entryPoint(): string {
  if (process.env.AMS_ENTRY_POINT) return process.env.AMS_ENTRY_POINT;
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../animation-engine/src/entry.ts");
}
const COMPOSITION_ID = "MotionProject";

export interface RenderOptions {
  outputPath: string;
  /** کیفیت H.264: عدد کمتر = کیفیت بیشتر (۱۸ تا ۲۸) */
  crf?: number;
  concurrency?: number;
  /** مسیر Chromium دلخواه؛ اگر نباشد از AMS_BROWSER یا مرورگر خود Remotion استفاده می‌شود */
  browserExecutable?: string;
  /** پوشه فایل‌های ثابت (لوگوی کاربر و ...) */
  publicDir?: string;
  onProgress?: (p: { stage: "bundling" | "rendering" | "encoding" | "done"; progress: number }) => void;
}

let bundleCache: Promise<string> | null = null;

/** باندل webpack یک‌بار ساخته می‌شود و برای رندرهای بعدی استفاده می‌شود */
export function getBundle(publicDir?: string, onProgress?: (p: number) => void): Promise<string> {
  if (!bundleCache) {
    bundleCache = bundle({
      entryPoint: entryPoint(),
      publicDir,
      onProgress: (p) => onProgress?.(p / 100),
    }).catch((e) => {
      bundleCache = null;
      throw e;
    });
  }
  return bundleCache;
}

const KNOWN_BROWSERS = [
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-linux/headless_shell",
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
];

async function resolveBrowser(explicit?: string): Promise<string | undefined> {
  const candidate = explicit ?? process.env.AMS_BROWSER;
  if (candidate && fs.existsSync(candidate)) return candidate;
  for (const p of KNOWN_BROWSERS) if (fs.existsSync(p)) return p;
  // در ویندوز: مرورگر headless خود Remotion دانلود/استفاده می‌شود
  await ensureBrowser();
  return undefined;
}

function assertValid(project: unknown): Project {
  const v = validateProject(project);
  if (!v.ok) throw new Error(`پروژه نامعتبر است و رندر نمی‌شود:\n${v.errors.join("\n")}`);
  return v.project;
}

export async function renderProject(projectInput: unknown, opts: RenderOptions): Promise<string> {
  const project = assertValid(projectInput);
  const browserExecutable = await resolveBrowser(opts.browserExecutable);
  const serveUrl = await getBundle(opts.publicDir, (p) => opts.onProgress?.({ stage: "bundling", progress: p }));
  const inputProps = { project };

  const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps, browserExecutable });
  fs.mkdirSync(path.dirname(opts.outputPath), { recursive: true });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: opts.outputPath,
    inputProps,
    crf: opts.crf ?? 20,
    pixelFormat: "yuv420p",
    concurrency: opts.concurrency ?? null,
    browserExecutable,
    chromiumOptions: { gl: (process.env.AMS_GL as "angle" | "swangle" | undefined) ?? "angle" },
    onProgress: ({ progress, stitchStage }) =>
      opts.onProgress?.({ stage: stitchStage === "muxing" ? "encoding" : "rendering", progress }),
  });
  opts.onProgress?.({ stage: "done", progress: 1 });
  return opts.outputPath;
}

/** یک فریم ثابت (برای بندانگشتی یا بررسی سریع) */
export async function renderFrame(projectInput: unknown, frame: number, outputPath: string, publicDir?: string): Promise<string> {
  const project = assertValid(projectInput);
  const browserExecutable = await resolveBrowser();
  const serveUrl = await getBundle(publicDir);
  const inputProps = { project };
  const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps, browserExecutable });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await renderStill({ composition, serveUrl, output: outputPath, frame, inputProps, browserExecutable, chromiumOptions: { gl: (process.env.AMS_GL as "angle" | "swangle" | undefined) ?? "angle" } });
  return outputPath;
}
