# AI Motion Studio — نسخه ۰.۱

ادیتور موشن‌گرافیک با چت فارسی. کاربر می‌نویسد، AI با **ابزارهای محدود و مشخص** پروژه را می‌سازد، موتور انیمیشن خودمان صحنه را متحرک می‌کند و خروجی **MP4 واقعی** تحویل می‌دهد. هیچ مدل ویدئوسازی استفاده نمی‌شود.

```
«یک موشن ۱۰ ثانیه‌ای Paper Cut با عنوان آموزش هوش مصنوعی با دکتر اخوان بساز»
        │
        ▼  ai-agent  (Claude / AvalAI / آفلاین)
   createProject → addPaperCutScene → addAnimatedText → exportVideo
        │
        ▼  project-schema  (اعتبارسنجی هر تغییر)
   project.json
        │
        ▼  animation-engine  (Remotion + SVG، لایه‌های کاغذی، متن RTL)
        ▼  render-engine     (Chromium + FFmpeg)
   motion.mp4   1920×1080 · 30fps · H.264
```

## آنچه در این نسخه کار می‌کند

- ساخت پروژه از دستور فارسی (مدت، سبک، نسبت تصویر، عنوان، لوگو، موضوع منظره/دریا/شهر/شب)
- صحنه Paper Cut با ۵ تا ۷ لایه مستقل و ۶ نوع حرکت: `rise`، `drop`، `parallax`، `sway`، `float`، `spin` + حرکت دوربین
- متن فارسی راست‌به‌چپ با فونت وزیرمتن و سه انیمیشن (کلمه‌به‌کلمه، محو از پایین، نوار کاغذی)
- لوگوموشن کاغذی (قطعات حلقه جمع می‌شوند) یا لوگوی PNG کاربر
- ویرایش جزئی با چت: «رنگ آبی رو طلایی کن» فقط پالت را عوض می‌کند، «عنوان رو به … تغییر بده» فقط همان صحنه را
- Undo / Redo، ذخیره و بازکردن پروژه
- برنامه دسکتاپ: چت، پیش‌نمایش زنده، تایم‌لاین، تنظیمات کلید API، خروجی MP4
- بدون اینترنت: برنامه‌ریز آفلاین دستورهای رایج را می‌فهمد و رندر کاملاً محلی است

## مغز AI

| حالت | چطور فعال می‌شود |
| --- | --- |
| **Claude** (پیش‌فرض نسخه اول) | کلید را در تنظیمات برنامه وارد کنید، یا `ANTHROPIC_API_KEY` |
| AvalAI (مرحله بعد) | انتخاب AvalAI در تنظیمات، یا `AVALAI_API_KEY` |
| آفلاین | بدون کلید، خودکار |

هر دو ارائه‌دهنده یک قرارداد مشترک (`ChatClient`) دارند، پس agent و ابزارها به ارائه‌دهنده وابسته نیستند. کلیدها با `safeStorage` (DPAPI ویندوز) رمز می‌شوند و هرگز در فایل پروژه یا رابط کاربری ذخیره نمی‌شوند.

## اجرا روی ویندوز

پیش‌نیاز: [Node.js 22](https://nodejs.org) (نصب FFmpeg جداگانه لازم نیست؛ Remotion نسخه داخلی خودش را دارد).

```powershell
npm install
npm test                       # تست‌های خودکار
npm run desktop:build
npx electron apps/desktop      # اجرای برنامه دسکتاپ
```

خط فرمان (بدون رابط کاربری):

```powershell
npm run make -- "یک موشن ۱۰ ثانیه‌ای Paper Cut با عنوان آموزش هوش مصنوعی با دکتر اخوان بساز"
npm run make -- --project output/project.json "رنگ آبی رو طلایی کن و خروجی بگیر"
npm run make -- --stills "..."   # فقط چند فریم PNG برای بررسی سریع
npm run studio                    # Remotion Studio برای طراحی صحنه‌ها
```

اولین رندر در ویندوز مرورگر headless خود Remotion را یک‌بار دانلود می‌کند.

## استفاده از داخل Claude (اسکیل)

اسکیل `skills/ai-motion-studio/SKILL.md` به Claude یاد می‌دهد خودش فایل JSON پروژه را بنویسد و با موتور همین ریپو MP4 بسازد؛ بدون کلید API جداگانه، چون مغز AI خود Claude است.

```powershell
npm run render -- examples/logo-motion.json                 # ops (همان ابزارهای AI) → MP4
npm run render -- examples/paper-cut-full.json --stills     # پروژه کامل → ۴ فریم PNG
npm run render -- spec.json --check                         # فقط اعتبارسنجی
npm run render -- edits.json --base output/x.project.json   # ویرایش جزئی پروژه قبلی
```

نصب اسکیل در Claude Code: پوشه `skills/ai-motion-studio` را در `~/.claude/skills/` (یا `.claude/skills/` همین ریپو) کپی کنید، یا از کارت پیشنهاد اسکیل در Claude ذخیره‌اش کنید.

## ساختار

```
apps/desktop/            Electron + React: چت، پیش‌نمایش، تایم‌لاین
packages/
  project-schema/        قرارداد JSON پروژه و اعتبارسنجی (zod)
  ai-agent/              Orchestrator، ابزارها، برنامه‌ریز آفلاین، Undo/Redo
  claude-client/         اتصال به Claude (Anthropic SDK)
  avalai-client/         اتصال به AvalAI (سازگار با OpenAI) + قرارداد ChatClient
  animation-engine/      کامپوزیشن Remotion، شکل‌های کاغذی، متن و لوگو
  render-engine/         رندر MP4 و فریم ثابت
scripts/make.ts          خط فرمان (با مغز AI داخلی)
scripts/render.ts        رندر مستقیم از JSON (برای اسکیل Claude)
skills/ai-motion-studio/ اسکیل Claude
examples/                نمونه‌های JSON
tests/                   تست‌های واحد و تست سرتاسری Electron
```

### ابزارهایی که AI در اختیار دارد

`createProject` · `addPaperCutScene` · `animateLogo` · `addAnimatedText` · `setPalette` · `updateScene` · `removeScene` · `exportVideo`

AI هیچ کدی اجرا نمی‌کند. خروجی هر ابزار قبل از اعمال با اسکیما بررسی می‌شود؛ اگر نامعتبر باشد پروژه دست نمی‌خورد و خطا به مدل برمی‌گردد تا خودش اصلاح کند.

## مجوزها (قبل از فروش بررسی شود)

- **Remotion**: برای افراد و تیم‌های تا ۳ نفر رایگان است. برای شرکت‌های بزرگ‌تر یا فروش محصولی که Remotion داخلش است، [مجوز شرکتی](https://www.remotion.pro/license) لازم است. در کد، `acknowledgeRemotionLicense` فقط پیام کنسول را خاموش می‌کند و مجوز نیست.
- **FFmpeg**: همراه Remotion توزیع می‌شود (LGPL). اگر FFmpeg جداگانه بسته‌بندی شود، نوع build (LGPL یا GPL) باید بررسی شود.
- **فونت وزیرمتن**: SIL Open Font License، برای استفاده تجاری آزاد.
- **Claude / AvalAI**: هزینه هر فراخوانی با کلید خود کاربر است.

## مرحله بعد (پیشنهادی)

1. اتصال AvalAI و انتخاب مدل در تنظیمات (کلاینتش آماده است)
2. واردکردن ویدئوی خام، `trimClip`، `addCallout`، `addAudio` و زیرنویس متحرک
3. تولید اجزای Paper Cut با تصویرساز + حذف پس‌زمینه وقتی در کتابخانه داخلی نیست
4. بسته‌بندی نصب‌کننده EXE (`npm run dist:win -w @ams/desktop`) با باندل از پیش ساخته‌شده Remotion
5. ریگ دوبعدی ساده برای شخصیت‌ها (اینجا Godot یا Spine هم قابل بررسی است)
