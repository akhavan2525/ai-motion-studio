import { describe, expect, it } from "vitest";
import { AgentSession, executeTool, extractSeconds, extractTitle, normalizeDigits, planOffline } from "@ams/ai-agent";
import type { ChatClient, ChatRequest, ChatResponse } from "@ams/avalai-client";

const PROMPT = "یک موشن ۱۰ ثانیه‌ای Paper Cut با عنوان آموزش هوش مصنوعی با دکتر اخوان بساز";

describe("متن فارسی", () => {
  it("اعداد فارسی", () => expect(normalizeDigits("۱۰ و ٢٥")).toBe("10 و 25"));
  it("مدت زمان", () => {
    expect(extractSeconds(PROMPT)).toBe(10);
    expect(extractSeconds("یه موشن بیست و پنج ثانیه‌ای")).toBe(25);
    expect(extractSeconds("ویدئوی یک دقیقه‌ای")).toBe(60);
  });
  it("عنوان", () => {
    expect(extractTitle(PROMPT)).toBe("آموزش هوش مصنوعی با دکتر اخوان");
    expect(extractTitle("یه لوگوموشن با متن «سلام دنیا» بساز")).toBe("سلام دنیا");
  });
});

describe("برنامه‌ریز آفلاین", () => {
  it("دستور نمونه ← پروژه ۱۰ ثانیه‌ای Paper Cut با متن", async () => {
    const s = new AgentSession();
    const r = await s.send(PROMPT);
    expect(r.mode).toBe("offline");
    expect(r.steps.every((x) => x.ok)).toBe(true);
    const p = r.project!;
    expect(p.durationFrames).toBe(300);
    expect(p.style).toBe("paper-cut");
    const paper = p.scenes.find((x) => x.action === "paper_layers_reveal")!;
    expect(paper.action === "paper_layers_reveal" && paper.layers.length).toBeGreaterThanOrEqual(5);
    // حداقل سه نوع حرکت متفاوت (معیار پذیرش نقشه)
    const motions = new Set(paper.action === "paper_layers_reveal" ? paper.layers.flatMap((l) => l.motions) : []);
    expect(motions.size).toBeGreaterThanOrEqual(3);
    const title = p.scenes.find((x) => x.action === "title_reveal");
    expect(title && title.action === "title_reveal" && title.text).toBe("آموزش هوش مصنوعی با دکتر اخوان");
    expect(r.exportRequested).not.toBeNull();
  });

  it("«رنگ آبی رو طلایی کن» فقط پالت را عوض می‌کند", async () => {
    const s = new AgentSession();
    const before = (await s.send(PROMPT)).project!;
    const after = (await s.send("رنگ آبی رو طلایی کن")).project!;
    expect(after.palette.primary).not.toBe(before.palette.primary);
    expect(after.scenes).toEqual(before.scenes);
    expect(after.durationFrames).toBe(before.durationFrames);
  });

  it("تغییر متن فقط صحنه متن را عوض می‌کند", async () => {
    const s = new AgentSession();
    const before = (await s.send(PROMPT)).project!;
    const after = (await s.send("عنوان رو به «دوره پایتون» تغییر بده")).project!;
    const t = after.scenes.find((x) => x.action === "title_reveal");
    expect(t && t.action === "title_reveal" && t.text).toBe("دوره پایتون");
    expect(after.palette).toEqual(before.palette);
    expect(after.scenes[0]).toEqual(before.scenes[0]);
  });

  it("Undo / Redo", async () => {
    const s = new AgentSession();
    const a = (await s.send(PROMPT)).project!;
    const b = (await s.send("رنگ رو طلایی کن")).project!;
    expect(s.undo()).toEqual(a);
    expect(s.redo()).toEqual(b);
  });

  it("دستور عمودی و لوگو", () => {
    const plan = planOffline("یه ریلز عمودی ۸ ثانیه‌ای با لوگو و عنوان «آکادمی من» بساز", null);
    expect(plan.calls.find((c) => c.name === "createProject")!.args.aspect).toBe("9:16");
    expect(plan.calls.some((c) => c.name === "animateLogo")).toBe(true);
  });
});

describe("Tool Executor", () => {
  it("ابزار نامعتبر پروژه را خراب نمی‌کند", async () => {
    const s = new AgentSession();
    await s.send(PROMPT);
    const state = { project: s.project, draft: null };
    const r = executeTool(state, { name: "updateScene", args: { id: "وجود-ندارد", text: "x" } });
    expect(r.ok).toBe(false);
    expect(state.project).toBe(s.project);
  });
});

/** مدل زبانی ساختگی که مثل Claude/AvalAI ابزار صدا می‌زند */
class FakeLLM implements ChatClient {
  calls = 0;
  async chat(req: ChatRequest): Promise<ChatResponse> {
    this.calls++;
    const hasToolResults = req.messages.some((m) => m.role === "tool");
    if (!hasToolResults) {
      const tc = (id: string, name: string, args: object) => ({ id, type: "function" as const, function: { name, arguments: JSON.stringify(args) } });
      return {
        finishReason: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            tc("1", "createProject", { name: "تست", durationSeconds: 8, style: "paper-cut" }),
            tc("2", "addPaperCutScene", { startSeconds: 0, durationSeconds: 8, theme: "sea" }),
            tc("3", "addAnimatedText", { text: "سلام", startSeconds: 2, durationSeconds: 6 }),
          ],
        },
      };
    }
    return { finishReason: "stop", message: { role: "assistant", content: "ساختم." } };
  }
}

describe("حلقه LLM (مستقل از ارائه‌دهنده)", () => {
  it("فراخوانی ابزارها و ساخت پروژه", async () => {
    const llm = new FakeLLM();
    const s = new AgentSession({ client: llm });
    const r = await s.send("یه موشن دریایی بساز");
    expect(r.mode).toBe("llm");
    expect(r.reply).toBe("ساختم.");
    expect(r.project!.durationFrames).toBe(240);
    expect(llm.calls).toBe(2);
  });
});
