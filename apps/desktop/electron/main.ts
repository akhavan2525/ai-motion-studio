/**
 * فرایند اصلی Electron: agent، ذخیره پروژه، تنظیمات امن کلید و رندر MP4
 * همه اینجا (سمت Node) اجرا می‌شوند؛ رابط کاربری فقط از طریق IPC درخواست می‌دهد.
 */
import { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { AgentSession, createChatClient, type ProviderConfig, type ProviderName } from "@ams/ai-agent";
import { validateProject, type Project } from "@ams/project-schema";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
process.env.AMS_ENTRY_POINT ??= path.join(repoRoot, "packages/animation-engine/src/entry.ts");

let win: BrowserWindow | null = null;
let currentFile: string | null = null;

// ---------- تنظیمات و کلید API (رمزنگاری با فضای امن سیستم‌عامل) ----------
interface StoredSettings {
  provider: ProviderName;
  model?: string;
  /** کلید رمزشده با safeStorage (DPAPI در ویندوز) به base64 */
  encryptedKeys: Partial<Record<ProviderName, string>>;
}

const settingsPath = () => path.join(app.getPath("userData"), "settings.json");

function readSettings(): StoredSettings {
  try {
    return JSON.parse(fs.readFileSync(settingsPath(), "utf8"));
  } catch {
    return { provider: "claude", encryptedKeys: {} };
  }
}

function writeSettings(s: StoredSettings) {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(s, null, 2));
}

function decryptKey(s: StoredSettings, p: ProviderName): string | undefined {
  const enc = s.encryptedKeys[p];
  if (!enc || !safeStorage.isEncryptionAvailable()) return undefined;
  try {
    return safeStorage.decryptString(Buffer.from(enc, "base64"));
  } catch {
    return undefined;
  }
}

function providerConfig(): ProviderConfig {
  const s = readSettings();
  const apiKey = decryptKey(s, s.provider) ?? (s.provider === "claude" ? process.env.ANTHROPIC_API_KEY : process.env.AVALAI_API_KEY);
  if (s.provider !== "offline" && !apiKey) return { provider: "offline" };
  return { provider: s.provider, apiKey, model: s.model };
}

// ---------- Agent ----------
const session = new AgentSession({ client: createChatClient(providerConfig()) });

function snapshot() {
  return { project: session.project, canUndo: session.canUndo, canRedo: session.canRedo, file: currentFile };
}

ipcMain.handle("agent:send", async (_e, text: string) => {
  session.setClient(createChatClient(providerConfig()));
  try {
    const r = await session.send(text);
    return { ok: true, reply: r.reply, steps: r.steps, mode: r.mode, exportRequested: r.exportRequested, ...snapshot() };
  } catch (e) {
    return { ok: false, reply: (e as Error).message, steps: [], ...snapshot() };
  }
});
ipcMain.handle("agent:undo", () => (session.undo(), snapshot()));
ipcMain.handle("agent:redo", () => (session.redo(), snapshot()));
ipcMain.handle("agent:state", () => snapshot());

// ---------- تنظیمات ----------
ipcMain.handle("settings:get", () => {
  const s = readSettings();
  return {
    provider: s.provider,
    model: s.model ?? "",
    hasKey: { claude: !!s.encryptedKeys.claude || !!process.env.ANTHROPIC_API_KEY, avalai: !!s.encryptedKeys.avalai },
    secureStorage: safeStorage.isEncryptionAvailable(),
    active: providerConfig().provider,
  };
});
ipcMain.handle("settings:set", (_e, patch: { provider?: ProviderName; model?: string; apiKey?: string }) => {
  const s = readSettings();
  if (patch.provider) s.provider = patch.provider;
  if (patch.model !== undefined) s.model = patch.model || undefined;
  if (patch.apiKey && s.provider !== "offline") {
    if (!safeStorage.isEncryptionAvailable()) throw new Error("فضای امن سیستم‌عامل در دسترس نیست؛ کلید ذخیره نشد");
    s.encryptedKeys[s.provider] = safeStorage.encryptString(patch.apiKey).toString("base64");
  }
  writeSettings(s);
  return true;
});

// ---------- فایل پروژه ----------
ipcMain.handle("project:save", async (_e, saveAs: boolean) => {
  if (!session.project) return snapshot();
  if (!currentFile || saveAs) {
    const r = await dialog.showSaveDialog(win!, { defaultPath: `${session.project.project}.amsproj.json`, filters: [{ name: "AI Motion Studio", extensions: ["json"] }] });
    if (r.canceled || !r.filePath) return snapshot();
    currentFile = r.filePath;
  }
  fs.writeFileSync(currentFile, JSON.stringify(session.project, null, 2));
  return snapshot();
});
ipcMain.handle("project:open", async () => {
  const r = await dialog.showOpenDialog(win!, { filters: [{ name: "AI Motion Studio", extensions: ["json"] }], properties: ["openFile"] });
  if (r.canceled || !r.filePaths[0]) return snapshot();
  const v = validateProject(JSON.parse(fs.readFileSync(r.filePaths[0], "utf8")));
  if (!v.ok) throw new Error(`فایل پروژه معتبر نیست:\n${v.errors.join("\n")}`);
  session.load(v.project);
  currentFile = r.filePaths[0];
  return snapshot();
});

// ---------- رندر ----------
let rendering = false;
ipcMain.handle("render:start", async (e) => {
  const project: Project | null = session.project;
  if (!project) throw new Error("پروژه‌ای برای رندر وجود ندارد");
  if (rendering) throw new Error("یک رندر در حال اجراست");
  // AMS_AUTO_OUTPUT فقط برای تست خودکار است و پنجره ذخیره را رد می‌کند
  const r = process.env.AMS_AUTO_OUTPUT
    ? { canceled: false, filePath: process.env.AMS_AUTO_OUTPUT }
    : await dialog.showSaveDialog(win!, { defaultPath: `${project.project}.mp4`, filters: [{ name: "MP4", extensions: ["mp4"] }] });
  if (r.canceled || !r.filePath) return null;
  rendering = true;
  try {
    // بارگذاری تنبل: موتور رندر سنگین است و فقط هنگام نیاز لود می‌شود
    const { renderProject } = await import("@ams/render-engine");
    await renderProject(project, {
      outputPath: r.filePath,
      onProgress: (p) => e.sender.send("render:progress", p),
    });
    return r.filePath;
  } finally {
    rendering = false;
  }
});
ipcMain.handle("shell:show", (_e, p: string) => shell.showItemInFolder(p));

// ---------- پنجره ----------
function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#11151c",
    title: "AI Motion Studio",
    webPreferences: {
      preload: path.join(here, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(here, "../dist/index.html"));
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
