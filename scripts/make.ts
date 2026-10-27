/**
 * خط فرمان: دستور فارسی ← AI Agent ← project.json ← MP4
 *
 *   npm run make -- "یک موشن ۱۰ ثانیه‌ای Paper Cut با عنوان آموزش هوش مصنوعی با دکتر اخوان بساز"
 *   npm run make -- --project output/project.json "رنگ آبی رو طلایی کن"
 *   npm run make -- --stills "..."      (فقط چند فریم PNG برای بررسی سریع)
 *
 * مغز AI: با ANTHROPIC_API_KEY از Claude، با AVALAI_API_KEY از AvalAI، وگرنه آفلاین.
 */
import fs from "node:fs";
import path from "node:path";
import { AgentSession, createChatClient, providerFromEnv } from "@ams/ai-agent";
import { validateProject } from "@ams/project-schema";
import { renderFrame, renderProject } from "@ams/render-engine";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const projectPath = flag("--project");
const outDir = flag("--out") ?? "output";
const stillsOnly = args.includes("--stills") && args.splice(args.indexOf("--stills"), 1);
const prompt = args.join(" ").trim() || "یک موشن ۱۰ ثانیه‌ای Paper Cut با عنوان آموزش هوش مصنوعی با دکتر اخوان بساز";

let initial = null;
if (projectPath && fs.existsSync(projectPath)) {
  const v = validateProject(JSON.parse(fs.readFileSync(projectPath, "utf8")));
  if (!v.ok) throw new Error(v.errors.join("\n"));
  initial = v.project;
}

const provider = providerFromEnv();
const session = new AgentSession(
  { client: createChatClient(provider), onStep: (s) => console.log(`  ${s.ok ? "✓" : "✗"} ${s.tool}: ${s.message}`) },
  initial,
);

console.log(`🧠 مغز AI: ${provider.provider}`);
console.log(`💬 ${prompt}`);
const result = await session.send(prompt);
console.log(`🤖 ${result.reply}`);
if (!result.project) {
  console.error("پروژه‌ای ساخته نشد.");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const jsonOut = projectPath ?? path.join(outDir, "project.json");
fs.writeFileSync(jsonOut, JSON.stringify(result.project, null, 2));
console.log(`📄 ${jsonOut}`);

const t0 = Date.now();
if (stillsOnly) {
  const d = result.project.durationFrames;
  for (const f of [Math.round(d * 0.1), Math.round(d * 0.35), Math.round(d * 0.6), d - 1]) {
    const p = await renderFrame(result.project, f, path.join(outDir, `frame-${f}.png`));
    console.log(`🖼  ${p}`);
  }
} else {
  const name = (result.exportRequested?.fileName ?? "motion").replace(/[^\w؀-ۿ-]+/g, "-");
  const mp4 = path.join(outDir, `${name}.mp4`);
  let last = -1;
  await renderProject(result.project, {
    outputPath: mp4,
    onProgress: ({ stage, progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last || stage === "done") {
        last = pct;
        process.stdout.write(`\r🎬 ${stage} ${pct}%   `);
      }
    },
  });
  console.log(`\n✅ ${mp4} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
