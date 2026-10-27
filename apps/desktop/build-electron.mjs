// باندل فرایند اصلی و preload با esbuild (پکیج‌های @ams به‌صورت سورس TS داخل باندل می‌روند)
import { build } from "esbuild";

const external = ["electron", "@remotion/bundler", "@remotion/renderer", "@anthropic-ai/sdk"];

await build({
  entryPoints: ["electron/main.ts"],
  outfile: "dist-electron/main.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  external,
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
});
await build({
  entryPoints: ["electron/preload.ts"],
  outfile: "dist-electron/preload.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron"],
});
console.log("electron bundle ready");
