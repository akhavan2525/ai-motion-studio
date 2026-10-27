/**
 * فونت فارسی (وزیرمتن، مجوز OFL) داخل باندل قرار می‌گیرد تا رندر آفلاین هم درست باشد.
 */
import "@fontsource/vazirmatn/arabic-400.css";
import "@fontsource/vazirmatn/arabic-500.css";
import "@fontsource/vazirmatn/arabic-800.css";
import "@fontsource/vazirmatn/arabic-900.css";
import "@fontsource/vazirmatn/latin-800.css";
import { continueRender, delayRender } from "remotion";

export const FONT_FAMILY = "'Vazirmatn', 'Tahoma', sans-serif";

let started = false;
/** تا وقتی فونت‌ها بارگذاری نشده‌اند، فریم گرفته نمی‌شود */
export function ensureFontsLoaded() {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("Loading Vazirmatn");
  Promise.all(
    ["400", "500", "800", "900"].map((w) => document.fonts.load(`${w} 48px Vazirmatn`, "آزمایش فارسی")),
  )
    .catch(() => undefined)
    .finally(() => continueRender(handle));
}
