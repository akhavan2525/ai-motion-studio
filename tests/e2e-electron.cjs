// تست سرتاسری برنامه دسکتاپ: اجرا ← دستور فارسی در چت ← پیش‌نمایش ← رندر MP4
// اجرا: xvfb-run -a node tests/e2e-electron.cjs  (بعد از npm run desktop:build)
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const out = path.resolve(__dirname, "../output/e2e/desktop.mp4");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const app = await electron.launch({
    args: [path.resolve(__dirname, "../apps/desktop"), "--no-sandbox"],
    executablePath: require(require.resolve("electron", { paths: [path.join(__dirname, "../apps/desktop")] })),
    env: { ...process.env, AMS_AUTO_OUTPUT: out, AMS_PROVIDER: "offline" },
  });
  const win = await app.firstWindow();
  win.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  await win.waitForSelector(".examples button");
  await win.fill(".composer textarea", "یک موشن ۵ ثانیه‌ای Paper Cut با لوگو و عنوان «سلام هنرجوها» بساز");
  await win.click(".composer button.primary");
  await win.waitForSelector(".tl-clip.title_reveal", { timeout: 20000 });
  console.log("✓ پروژه ساخته شد و تایم‌لاین پر شد");
  await win.waitForTimeout(1500);
  await win.screenshot({ path: path.resolve(__dirname, "../output/e2e/desktop.png") });
  await win.click("button.primary >> text=خروجی MP4");
  await win.waitForSelector(".render-bar.done", { timeout: 240000 });
  const size = fs.statSync(out).size;
  console.log(`✓ MP4 ساخته شد: ${out} (${(size / 1024).toFixed(0)} KB)`);
  await app.close();
  process.exit(size > 10000 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
