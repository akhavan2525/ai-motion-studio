/**
 * رندر مستقیم از فایل JSON، بدون مغز AI داخلی.
 * این همان دری است که اسکیل Claude از آن استفاده می‌کند: Claude خودش JSON را می‌نویسد
 * و این اسکریپت اعتبارسنجی و رندر می‌کند.
 *
 *   npm run render -- spec.json                      → output/<نام>.mp4
 *   npm run render -- spec.json --out out/logo.mp4
 *   npm run render -- spec.json --stills             (فقط ۴ فریم PNG برای بررسی سریع)
 *   npm run render -- spec.json --check              (فقط اعتبارسنجی، بدون رندر)
 *   npm run render -- edits.json --base output/project.json   (اعمال ops روی پروژه قبلی)
 *
 * spec.json یکی از این دو شکل است:
 *   ۱) پروژه کامل مطابق @ams/project-schema
 *   ۲) { "ops": [ { "name": "createProject", "args": {...} }, ... ] }
 *      همان ابزارهای AI داخلی (createProject, addPaperCutScene, animateLogo, ...)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { executeTool, type DraftState, type ToolInvocation } from "@ams/ai-agent";
import { validateProject, type Project } from "@ams/project-schema";
import { renderFrame, renderProject } from "@ams/render-engine";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const bool = (name: string) => {
  const i = args.indexOf(name);
  if (i < 0) return false;
  args.splice(i, 1);
  return true;
};

const outArg = flag("--out");
const basePath = flag("--base");
const stillsOnly = bool("--stills");
const checkOnly = bool("--check");
const specPath = args[0];

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!specPath) fail("مسیر فایل JSON را بدهید: npm run render -- spec.json");
if (!fs.existsSync(specPath)) fail(`فایل پیدا نشد: ${specPath}`);

let spec: any;
try {
  spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
} catch (e) {
  fail(`JSON نامعتبر: ${(e as Error).message}`);
}

function loadBase(): Project | null {
  if (!basePath) return null;
  if (!fs.existsSync(basePath)) fail(`پروژه پایه پیدا نشد: ${basePath}`);
  const v = validateProject(JSON.parse(fs.readFileSync(basePath, "utf8")));
  if (!v.ok) fail(`پروژه پایه نامعتبر است:\n${v.errors.join("\n")}`);
  return v.project;
}

let project: Project;
let fileName: string | undefined;

if (Array.isArray(spec?.ops)) {
  const state: DraftState = { project: loadBase(), draft: null };
  for (const [i, op] of (spec.ops as ToolInvocation[]).entries()) {
    const r = executeTool(state, op);
    if (!r.ok) fail(`op ${i + 1} (${op?.name}): ${r.error}`);
    console.log(`  ✓ ${op.name}: ${r.message}`);
    if (r.exportRequested?.fileName) fileName = r.exportRequested.fileName;
  }
  if (!state.project) fail("بعد از اجرای ops پروژه هنوز صحنه‌ای ندارد");
  project = state.project;
} else {
  const v = validateProject(spec);
  if (!v.ok) fail(`پروژه نامعتبر است:\n${v.errors.join("\n")}`);
  project = v.project;
}

const safe = (n: string) => n.replace(/[^\w؀-ۿ-]+/g, "-").replace(/^-+|-+$/g, "") || "motion";
const mp4 = outArg ?? path.join("output", `${safe(fileName ?? project.project)}.mp4`);
const outDir = path.dirname(mp4);
fs.mkdirSync(outDir, { recursive: true });
const jsonOut = mp4.replace(/\.mp4$/i, "") + ".project.json";
fs.writeFileSync(jsonOut, JSON.stringify(project, null, 2));

const secs = (project.durationFrames / project.fps).toFixed(1);
console.log(`✅ پروژه معتبر: «${project.project}» · ${secs}s · ${project.aspect} · ${project.scenes.length} صحنه`);
console.log(`📄 ${jsonOut}`);
/** لوگوی محلی کاربر را در یک پوشه public موقت کپی می‌کنیم تا موتور بتواند بخواندش */
const renderable: Project = structuredClone(project);
let publicDir: string | undefined;
const specDir = path.dirname(path.resolve(specPath));
for (const s of renderable.scenes) {
  if (s.action !== "logo_assemble" || !s.logoSrc || /^(https?|file):/.test(s.logoSrc)) continue;
  const candidates = [path.resolve(s.logoSrc), path.resolve(specDir, s.logoSrc)];
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) fail(`فایل لوگو پیدا نشد: ${s.logoSrc}`);
  publicDir ??= fs.mkdtempSync(path.join(os.tmpdir(), "ams-public-"));
  const name = `${s.id}${path.extname(found)}`;
  fs.copyFileSync(found, path.join(publicDir, name));
  s.logoSrc = name;
}

if (checkOnly) process.exit(0);

const t0 = Date.now();
if (stillsOnly) {
  const d = renderable.durationFrames;
  const base = mp4.replace(/\.mp4$/i, "");
  for (const f of [Math.round(d * 0.1), Math.round(d * 0.35), Math.round(d * 0.6), d - 1]) {
    console.log(`🖼  ${await renderFrame(renderable, f, `${base}-frame-${f}.png`, publicDir)}`);
  }
} else {
  let last = -1;
  await renderProject(renderable, {
    outputPath: mp4,
    publicDir,
    onProgress: ({ stage, progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last || stage === "done") {
        last = pct;
        process.stdout.write(`\r🎬 ${stage} ${pct}%   `);
      }
    },
  });
  console.log(`\n🎉 ${mp4} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
