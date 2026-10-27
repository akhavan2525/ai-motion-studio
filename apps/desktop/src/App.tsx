import React, { useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { MotionProject } from "@ams/animation-engine";
import { sizeOf, type Project, type Scene } from "@ams/project-schema";
import type { AgentStep } from "@ams/ai-agent";
import { apiPromise, type AmsApi, type Settings, type Snapshot } from "./api";

interface ChatItem {
  role: "user" | "assistant" | "error";
  text: string;
  steps?: AgentStep[];
  mode?: string;
}

const EXAMPLES = [
  "یک موشن ۱۰ ثانیه‌ای Paper Cut با عنوان آموزش هوش مصنوعی با دکتر اخوان بساز",
  "رنگ آبی رو طلایی کن",
  "یه لوگو هم اضافه کن",
  "عنوان رو به «دوره پایتون مقدماتی» تغییر بده",
  "یه ریلز عمودی ۸ ثانیه‌ای با منظره دریا و عنوان «تابستان» بساز",
];

const TOOL_LABELS: Record<string, string> = {
  createProject: "ساخت پروژه",
  addPaperCutScene: "صحنه کاغذی",
  animateLogo: "لوگوموشن",
  addAnimatedText: "متن متحرک",
  setPalette: "رنگ‌ها",
  updateScene: "ویرایش صحنه",
  removeScene: "حذف صحنه",
  exportVideo: "درخواست خروجی",
};

const SCENE_LABELS: Record<Scene["action"], string> = {
  paper_layers_reveal: "Paper Cut",
  logo_assemble: "لوگو",
  title_reveal: "متن",
};

const PROVIDER_LABELS = { claude: "Claude", avalai: "AvalAI", offline: "آفلاین" } as const;

const fmt = (frames: number, fps: number) => {
  const s = frames / fps;
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};

export function App() {
  const [api, setApi] = useState<AmsApi | null>(null);
  const [snap, setSnap] = useState<Snapshot>({ project: null, canUndo: false, canRedo: false, file: null });
  const [chat, setChat] = useState<ChatItem[]>([
    { role: "assistant", text: "سلام! بگو چه موشنی می‌خوای بسازم. مثلاً یکی از پیشنهادهای پایین رو بزن." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [render, setRender] = useState<{ stage: string; progress: number } | null>(null);
  const [lastOutput, setLastOutput] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const playerRef = useRef<PlayerRef>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiPromise.then(async (a) => {
      setApi(a);
      setSnap(await a.state());
      setSettings(await a.getSettings());
      a.onRenderProgress((p) => setRender(p));
    });
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    const h = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    p.addEventListener("frameupdate", h);
    return () => p.removeEventListener("frameupdate", h);
  }, [snap.project]);

  const project = snap.project;
  const size = project ? sizeOf(project) : { width: 1920, height: 1080 };
  const inputProps = useMemo(() => (project ? { project } : null), [project]);

  async function send(text: string) {
    if (!api || !text.trim() || busy) return;
    setInput("");
    setChat((c) => [...c, { role: "user", text }]);
    setBusy(true);
    try {
      const r = await api.send(text);
      setSnap(r);
      setChat((c) => [...c, { role: r.ok ? "assistant" : "error", text: r.reply, steps: r.steps, mode: r.mode }]);
      playerRef.current?.seekTo(0);
      playerRef.current?.play();
    } catch (e) {
      setChat((c) => [...c, { role: "error", text: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  }

  async function doRender() {
    if (!api || !project) return;
    try {
      setRender({ stage: "bundling", progress: 0 });
      const out = await api.render();
      if (out) {
        setLastOutput(out);
        setChat((c) => [...c, { role: "assistant", text: `ویدئو آماده شد: ${out}` }]);
      }
    } catch (e) {
      setChat((c) => [...c, { role: "error", text: (e as Error).message }]);
    } finally {
      setRender(null);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo-dot" />
          AI Motion Studio
          <span className="project-name">{project ? project.project : "پروژه جدید"}</span>
        </div>
        <div className="actions">
          <button onClick={async () => api && setSnap(await api.open())}>باز کردن</button>
          <button disabled={!project} onClick={async () => api && setSnap(await api.save())}>ذخیره</button>
          <button disabled={!snap.canUndo} onClick={async () => api && setSnap(await api.undo())} title="Undo">↶</button>
          <button disabled={!snap.canRedo} onClick={async () => api && setSnap(await api.redo())} title="Redo">↷</button>
          <button className="ghost" onClick={() => setShowSettings(true)}>
            مغز AI: <b>{settings ? PROVIDER_LABELS[settings.active] : "..."}</b>
          </button>
          <button className="primary" disabled={!project || !!render} onClick={doRender}>
            خروجی MP4
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="chat">
          <div className="chat-title">دستیار هوشمند</div>
          <div className="messages">
            {chat.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="bubble">{m.text}</div>
                {m.steps && m.steps.length > 0 && (
                  <ul className="steps">
                    {m.steps.map((s, j) => (
                      <li key={j} className={s.ok ? "ok" : "fail"}>
                        <span>{s.ok ? "✓" : "✗"}</span> {TOOL_LABELS[s.tool] ?? s.tool}
                        <small>{s.message}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {busy && <div className="msg assistant"><div className="bubble typing">در حال ساخت صحنه‌ها…</div></div>}
            <div ref={chatEnd} />
          </div>
          <div className="examples">
            {EXAMPLES.map((e) => (
              <button key={e} onClick={() => send(e)} disabled={busy}>{e}</button>
            ))}
          </div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <textarea
              value={input}
              placeholder="مثلاً: یک لوگوموشن کاغذی هشت‌ثانیه‌ای بساز…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            />
            <button className="primary" disabled={busy || !input.trim()}>ارسال</button>
          </form>
        </aside>

        <section className="stage">
          <div className="preview" dir="ltr">
            {project && inputProps ? (
              <Player
                ref={playerRef}
                component={MotionProject}
                inputProps={inputProps}
                durationInFrames={project.durationFrames}
                fps={project.fps}
                compositionWidth={size.width}
                compositionHeight={size.height}
                style={{ width: "100%", height: "100%" }}
                controls
                loop
                autoPlay
                acknowledgeRemotionLicense
              />
            ) : (
              <div className="empty">
                <div className="empty-icon">✂︎</div>
                <p>پیش‌نمایش زنده اینجا نمایش داده می‌شود</p>
              </div>
            )}
          </div>
          <Timeline project={project} frame={frame} onSeek={(f) => playerRef.current?.seekTo(f)} />
        </section>
      </main>

      {render && (
        <div className="render-bar">
          <span>{render.stage === "bundling" ? "آماده‌سازی موتور…" : render.stage === "encoding" ? "ساخت فایل MP4…" : "رندر فریم‌ها…"}</span>
          <div className="bar"><div style={{ width: `${Math.round(render.progress * 100)}%` }} /></div>
          <b>{Math.round(render.progress * 100)}%</b>
        </div>
      )}
      {lastOutput && !render && (
        <div className="render-bar done" onClick={() => api?.showInFolder(lastOutput)}>
          ✅ خروجی آماده است — برای نمایش در پوشه کلیک کنید
        </div>
      )}
      {showSettings && settings && api && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={async (p) => {
            await api.setSettings(p);
            setSettings(await api.getSettings());
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}

function Timeline({ project, frame, onSeek }: { project: Project | null; frame: number; onSeek: (f: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!project) return <div className="timeline empty-tl">تایم‌لاین</div>;
  const d = project.durationFrames;
  const seek = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    // تایم‌لاین مثل ادیتورهای حرفه‌ای از چپ به راست است
    onSeek(Math.round(((e.clientX - r.left) / r.width) * (d - 1)));
  };
  return (
    <div className="timeline">
      <div className="tl-head">
        <span>Timeline</span>
        <span>{project.fps} FPS</span>
        <span className="tc">{fmt(frame, project.fps)} / {fmt(d, project.fps)}</span>
      </div>
      <div className="tl-body" dir="ltr" ref={ref} onClick={seek}>
        {project.scenes.map((s) => (
          <div className="tl-row" key={s.id}>
            <div
              className={`tl-clip ${s.action}`}
              style={{ left: `${(s.startFrame / d) * 100}%`, width: `${(s.durationFrames / d) * 100}%` }}
              title={s.id}
            >
              <span dir="rtl">{SCENE_LABELS[s.action]}{s.action === "title_reveal" ? `: ${s.text}` : ""}</span>
            </div>
          </div>
        ))}
        <div className="playhead" style={{ left: `${(frame / Math.max(1, d - 1)) * 100}%` }} />
      </div>
    </div>
  );
}

function SettingsModal({
  settings,
  onClose,
  onSave,
}: {
  settings: Settings;
  onClose: () => void;
  onSave: (p: { provider: Settings["provider"]; model: string; apiKey?: string }) => void;
}) {
  const [provider, setProvider] = useState(settings.provider);
  const [model, setModel] = useState(settings.model);
  const [key, setKey] = useState("");
  const has = provider !== "offline" && settings.hasKey[provider];
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>تنظیمات مغز AI</h3>
        <label>ارائه‌دهنده</label>
        <div className="seg">
          {(["claude", "avalai", "offline"] as const).map((p) => (
            <button key={p} className={p === provider ? "on" : ""} onClick={() => setProvider(p)}>
              {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>
        {provider !== "offline" && (
          <>
            <label>کلید API {has && <span className="badge">ذخیره شده</span>}</label>
            <input type="password" dir="ltr" value={key} onChange={(e) => setKey(e.target.value)} placeholder={has ? "••••••••  (برای تغییر، کلید جدید وارد کنید)" : provider === "claude" ? "sk-ant-..." : "aa-..."} />
            <label>مدل (اختیاری)</label>
            <input dir="ltr" value={model} onChange={(e) => setModel(e.target.value)} placeholder={provider === "claude" ? "claude-opus-5-5" : "gpt-4.1-mini"} />
            <p className="hint">
              {settings.secureStorage ? "کلید با فضای امن ویندوز رمزنگاری و ذخیره می‌شود." : "فضای امن سیستم‌عامل در دسترس نیست."}
            </p>
          </>
        )}
        {provider === "offline" && <p className="hint">در حالت آفلاین، دستورهای رایج فارسی بدون اینترنت اجرا می‌شوند.</p>}
        <div className="modal-actions">
          <button onClick={onClose}>انصراف</button>
          <button className="primary" onClick={() => onSave({ provider, model, apiKey: key || undefined })}>ذخیره</button>
        </div>
      </div>
    </div>
  );
}
