/**
 * دسترسی رابط کاربری به فرایند اصلی.
 * اگر بیرون از Electron (مرورگر) باز شود، یک نسخه آفلاین داخل مرورگر اجرا می‌شود
 * تا طراحی رابط بدون Electron هم قابل تست باشد.
 */
import type { Project } from "@ams/project-schema";
import type { AgentStep } from "@ams/ai-agent";

export interface Snapshot {
  project: Project | null;
  canUndo: boolean;
  canRedo: boolean;
  file: string | null;
}
export interface SendResult extends Snapshot {
  ok: boolean;
  reply: string;
  steps: AgentStep[];
  mode?: "llm" | "offline";
  exportRequested?: { fileName?: string } | null;
}
export interface Settings {
  provider: "claude" | "avalai" | "offline";
  model: string;
  hasKey: { claude: boolean; avalai: boolean };
  secureStorage: boolean;
  active: "claude" | "avalai" | "offline";
}
export interface AmsApi {
  send(text: string): Promise<SendResult>;
  undo(): Promise<Snapshot>;
  redo(): Promise<Snapshot>;
  state(): Promise<Snapshot>;
  getSettings(): Promise<Settings>;
  setSettings(p: { provider?: Settings["provider"]; model?: string; apiKey?: string }): Promise<boolean>;
  save(saveAs?: boolean): Promise<Snapshot>;
  open(): Promise<Snapshot>;
  render(): Promise<string | null>;
  showInFolder(p: string): Promise<void>;
  onRenderProgress(cb: (p: { stage: string; progress: number }) => void): () => void;
}

declare global {
  interface Window {
    ams?: AmsApi;
  }
}

async function browserFallback(): Promise<AmsApi> {
  const { AgentSession } = await import("@ams/ai-agent");
  const s = new AgentSession();
  const snap = (): Snapshot => ({ project: s.project, canUndo: s.canUndo, canRedo: s.canRedo, file: null });
  return {
    async send(text) {
      const r = await s.send(text);
      return { ok: true, reply: r.reply, steps: r.steps, mode: r.mode, exportRequested: r.exportRequested, ...snap() };
    },
    async undo() { s.undo(); return snap(); },
    async redo() { s.redo(); return snap(); },
    async state() { return snap(); },
    async getSettings() {
      return { provider: "offline", model: "", hasKey: { claude: false, avalai: false }, secureStorage: false, active: "offline" };
    },
    async setSettings() { return true; },
    async save() { return snap(); },
    async open() { return snap(); },
    async render() { alert("رندر MP4 فقط در نسخه دسکتاپ فعال است"); return null; },
    async showInFolder() {},
    onRenderProgress() { return () => {}; },
  };
}

export const apiPromise: Promise<AmsApi> = window.ams ? Promise.resolve(window.ams) : browserFallback();
