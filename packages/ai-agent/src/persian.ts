/** ابزارهای کمکی متن فارسی */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeDigits(s: string): string {
  return s.replace(/[۰-۹٠-٩]/g, (d) => {
    const i = FA_DIGITS.indexOf(d);
    return String(i >= 0 ? i : AR_DIGITS.indexOf(d));
  });
}

/** یکسان‌سازی ی/ک عربی و فاصله‌ها */
export function normalizeText(s: string): string {
  return normalizeDigits(s)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/‌+/g, "‌")
    .replace(/\s+/g, " ")
    .trim();
}

const NUMBER_WORDS: Record<string, number> = {
  یک: 1, دو: 2, سه: 3, چهار: 4, پنج: 5, شش: 6, هفت: 7, هشت: 8, نه: 9, ده: 10,
  یازده: 11, دوازده: 12, سیزده: 13, چهارده: 14, پانزده: 15, پونزده: 15, شانزده: 16,
  هفده: 17, هجده: 18, نوزده: 19, بیست: 20, سی: 30, چهل: 40, پنجاه: 50, شصت: 60,
};

/** «۱۰ ثانیه»، «ده ثانیه‌ای»، «بیست و پنج ثانیه» یا «یک دقیقه» را به ثانیه برمی‌گرداند */
export function extractSeconds(text: string): number | undefined {
  const t = normalizeText(text);
  const num = t.match(/(\d+(?:\.\d+)?)\s*(ثانیه|ثانیه‌ای|s\b|sec)/i);
  if (num) return parseFloat(num[1]);
  const min = t.match(/(\d+(?:\.\d+)?)\s*دقیقه/);
  if (min) return parseFloat(min[1]) * 60;

  const words = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length).join("|");
  const re = new RegExp(`((?:${words})(?:\\s*و\\s*(?:${words}))*)\\s*(ثانیه|دقیقه)`);
  const m = t.match(re);
  if (m) {
    const value = m[1]
      .split(/\s*و\s*/)
      .reduce((sum, w) => sum + (NUMBER_WORDS[w.trim()] ?? 0), 0);
    return m[2] === "دقیقه" ? value * 60 : value;
  }
  return undefined;
}

/** حروف اول دو کلمه آخر (برای نشان لوگو)، مثلاً «دکتر اخوان» ← «دا» */
export function monogramFrom(text: string): string {
  const words = normalizeText(text)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  if (words.length === 0) return "AI";
  const pick = words.slice(-2);
  return pick.map((w) => w[0]).join("‌");
}

const STOP_WORDS = new Set(["با", "و", "در", "به", "از", "برای", "که", "را"]);
