"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/preload.ts
var preload_exports = {};
module.exports = __toCommonJS(preload_exports);
var import_electron = require("electron");
var api = {
  send: (text) => import_electron.ipcRenderer.invoke("agent:send", text),
  undo: () => import_electron.ipcRenderer.invoke("agent:undo"),
  redo: () => import_electron.ipcRenderer.invoke("agent:redo"),
  state: () => import_electron.ipcRenderer.invoke("agent:state"),
  getSettings: () => import_electron.ipcRenderer.invoke("settings:get"),
  setSettings: (patch) => import_electron.ipcRenderer.invoke("settings:set", patch),
  save: (saveAs = false) => import_electron.ipcRenderer.invoke("project:save", saveAs),
  open: () => import_electron.ipcRenderer.invoke("project:open"),
  render: () => import_electron.ipcRenderer.invoke("render:start"),
  showInFolder: (p) => import_electron.ipcRenderer.invoke("shell:show", p),
  onRenderProgress: (cb) => {
    const h = (_e, p) => cb(p);
    import_electron.ipcRenderer.on("render:progress", h);
    return () => import_electron.ipcRenderer.removeListener("render:progress", h);
  }
};
import_electron.contextBridge.exposeInMainWorld("ams", api);
