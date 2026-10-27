/**
 * AI Orchestrator: دستور فارسی کاربر ← فراخوانی ابزارها ← پروژه معتبر.
 * با کلید AvalAI از مدل زبانی و Tool Calling استفاده می‌کند؛
 * بدون کلید یا اینترنت، به برنامه‌ریز آفلاین برمی‌گردد.
 */
import type { ChatClient, ChatMessage } from "@ams/avalai-client";
import type { Project } from "@ams/project-schema";
import { PALETTES } from "@ams/project-schema";
import { TOOL_DEFINITIONS, executeTool, type DraftState, type ToolInvocation, type ToolName } from "./tools";
import { planOffline } from "./offline-planner";

export interface AgentStep {
  tool: ToolName;
  args: Record<string, unknown>;
  ok: boolean;
  message: string;
}

export interface AgentResult {
  project: Project | null;
  steps: AgentStep[];
  reply: string;
  exportRequested: { fileName?: string } | null;
  mode: "llm" | "offline";
}

export interface AgentOptions {
  client?: ChatClient | null;
  model?: string;
  maxSteps?: number;
  onStep?: (step: AgentStep) => void;
}

export const SYSTEM_PROMPT = `تو دستیار ساخت موشن‌گرافیک در نرم‌افزار AI Motion Studio هستی.
کاربر فارسی می‌نویسد. تو فقط از طریق ابزارها پروژه را می‌سازی یا ویرایش می‌کنی و هرگز کد اجرا نمی‌کنی.

قواعد:
- پروژه جدید: createProject، بعد addPaperCutScene برای پس‌زمینه کامل (از ثانیه ۰ تا انتها)، بعد در صورت نیاز animateLogo، بعد addAnimatedText، و در آخر exportVideo.
- پس‌زمینه کاغذی باید کل مدت پروژه را بپوشاند؛ لوگو و متن روی آن می‌آیند.
- لوگو و متن نباید بیش از ۰.۵ ثانیه هم‌پوشانی داشته باشند.
- ویرایش: فقط ابزار مربوط به همان بخش را صدا بزن (مثلاً برای رنگ فقط setPalette). کل پروژه را از نو نساز.
- متن فارسی کاربر را دقیقاً همان‌طور که نوشته استفاده کن.
- زمان‌ها را به ثانیه بده. پالت‌های موجود: ${Object.keys(PALETTES).join("، ")}.
- اگر ابزاری خطا داد، علت را بخوان و اصلاح کن.
- در پایان یک جمله کوتاه فارسی درباره کاری که کردی بنویس.`;

function describeProject(p: Project | null): string {
  if (!p) return "هنوز پروژه‌ای وجود ندارد.";
  return `پروژه فعلی (JSON):\n${JSON.stringify(p)}`;
}

export class AgentSession {
  private state: DraftState = { project: null, draft: null };
  private undoStack: (Project | null)[] = [];
  private redoStack: (Project | null)[] = [];
  private history: ChatMessage[] = [];

  constructor(private opts: AgentOptions = {}, initial?: Project | null) {
    if (initial) this.state.project = initial;
  }

  get project(): Project | null {
    return this.state.project;
  }

  setClient(client: ChatClient | null) {
    this.opts.client = client;
  }

  load(project: Project | null) {
    this.pushUndo();
    this.state = { project, draft: null };
  }

  undo(): Project | null {
    if (!this.undoStack.length) return this.state.project;
    this.redoStack.push(this.state.project);
    this.state = { project: this.undoStack.pop()!, draft: null };
    return this.state.project;
  }

  redo(): Project | null {
    if (!this.redoStack.length) return this.state.project;
    this.undoStack.push(this.state.project);
    this.state = { project: this.redoStack.pop()!, draft: null };
    return this.state.project;
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }
  get canRedo() {
    return this.redoStack.length > 0;
  }

  private pushUndo() {
    this.undoStack.push(this.state.project);
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  }

  async send(userText: string): Promise<AgentResult> {
    const before = this.state.project;
    const result = this.opts.client ? await this.runLLM(userText) : this.runOffline(userText);
    if (result.project !== before) {
      this.undoStack.push(before);
      this.redoStack = [];
    }
    return result;
  }

  private apply(call: ToolInvocation, steps: AgentStep[]) {
    const r = executeTool(this.state, call);
    const step: AgentStep = { tool: call.name, args: call.args, ok: r.ok, message: r.ok ? r.message : r.error };
    steps.push(step);
    this.opts.onStep?.(step);
    return r;
  }

  private runOffline(text: string): AgentResult {
    const plan = planOffline(text, this.state.project);
    const steps: AgentStep[] = [];
    let exportRequested: AgentResult["exportRequested"] = null;
    for (const call of plan.calls) {
      const r = this.apply(call, steps);
      if (r.ok && r.exportRequested) exportRequested = r.exportRequested;
    }
    const failed = steps.filter((s) => !s.ok);
    const reply = plan.calls.length === 0
      ? plan.summary
      : failed.length
        ? `بخشی از دستور اجرا نشد: ${failed.map((f) => f.message).join(" | ")}`
        : `${plan.summary} انجام شد (${steps.length} مرحله، حالت آفلاین).`;
    return { project: this.state.project, steps, reply, exportRequested, mode: "offline" };
  }

  private async runLLM(text: string): Promise<AgentResult> {
    const client = this.opts.client!;
    const steps: AgentStep[] = [];
    let exportRequested: AgentResult["exportRequested"] = null;
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...this.history.slice(-8),
      { role: "user", content: `${describeProject(this.state.project)}\n\nدستور کاربر: ${text}` },
    ];
    let reply = "";
    const maxSteps = this.opts.maxSteps ?? 10;

    for (let i = 0; i < maxSteps; i++) {
      const res = await client.chat({ messages, tools: TOOL_DEFINITIONS, model: this.opts.model });
      messages.push(res.message);
      const calls = res.message.tool_calls ?? [];
      if (!calls.length) {
        reply = res.message.content ?? "";
        break;
      }
      for (const tc of calls) {
        let args: Record<string, unknown> = {};
        let result: string;
        try {
          args = JSON.parse(tc.function.arguments || "{}");
          const r = this.apply({ name: tc.function.name as ToolName, args }, steps);
          if (r.ok && r.exportRequested) exportRequested = r.exportRequested;
          result = r.ok ? `OK: ${r.message}` : `ERROR: ${r.error}`;
        } catch (e) {
          result = `ERROR: آرگومان‌های JSON نامعتبر (${(e as Error).message})`;
        }
        messages.push({ role: "tool", tool_call_id: tc.id, content: result });
      }
    }

    this.history.push({ role: "user", content: text }, { role: "assistant", content: reply || "انجام شد." });
    return {
      project: this.state.project,
      steps,
      reply: reply || "انجام شد.",
      exportRequested,
      mode: "llm",
    };
  }
}
