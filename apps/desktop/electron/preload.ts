import { contextBridge, ipcRenderer } from "electron";

/** تنها پلی که رابط کاربری به سیستم دارد؛ هیچ دسترسی مستقیم به Node یا فایل‌ها ندارد */
const api = {
  send: (text: string) => ipcRenderer.invoke("agent:send", text),
  undo: () => ipcRenderer.invoke("agent:undo"),
  redo: () => ipcRenderer.invoke("agent:redo"),
  state: () => ipcRenderer.invoke("agent:state"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: (patch: unknown) => ipcRenderer.invoke("settings:set", patch),
  save: (saveAs = false) => ipcRenderer.invoke("project:save", saveAs),
  open: () => ipcRenderer.invoke("project:open"),
  render: () => ipcRenderer.invoke("render:start"),
  showInFolder: (p: string) => ipcRenderer.invoke("shell:show", p),
  onRenderProgress: (cb: (p: { stage: string; progress: number }) => void) => {
    const h = (_e: unknown, p: { stage: string; progress: number }) => cb(p);
    ipcRenderer.on("render:progress", h);
    return () => ipcRenderer.removeListener("render:progress", h);
  },
};

contextBridge.exposeInMainWorld("ams", api);
export type AmsApi = typeof api;
