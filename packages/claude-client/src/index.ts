/**
 * مغز AI نسخه اول: Claude از طریق Anthropic SDK.
 * همان قرارداد ChatClient را پیاده می‌کند که AvalAI پیاده می‌کند،
 * پس عوض کردن ارائه‌دهنده فقط یک خط در تنظیمات است.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { ChatClient, ChatMessage, ChatRequest, ChatResponse, ToolCall } from "@ams/avalai-client";

export const DEFAULT_CLAUDE_MODEL = "claude-opus-5-5";

export interface ClaudeOptions {
  /** اگر خالی باشد، SDK از ANTHROPIC_API_KEY یا پروفایل ant استفاده می‌کند */
  apiKey?: string;
  model?: string;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens?: number;
}

export class ClaudeError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ClaudeError";
  }
}

type BetaParam = Anthropic.Beta.BetaMessageParam;

/** تبدیل تاریخچه سبک OpenAI به پیام‌های Anthropic */
export function toAnthropic(messages: ChatMessage[]): { system: string; messages: BetaParam[] } {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content ?? "").join("\n\n");
  const out: BetaParam[] = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    if (m.role === "user") {
      out.push({ role: "user", content: m.content ?? "" });
    } else if (m.role === "assistant") {
      // بلوک‌های خام (شامل thinking) را دست‌نخورده برمی‌گردانیم
      if (m.providerRaw) {
        out.push({ role: "assistant", content: m.providerRaw as Anthropic.Beta.BetaContentBlockParam[] });
      } else {
        const content: Anthropic.Beta.BetaContentBlockParam[] = [];
        if (m.content) content.push({ type: "text", text: m.content });
        for (const tc of m.tool_calls ?? []) {
          content.push({ type: "tool_use", id: tc.id, name: tc.function.name, input: safeJson(tc.function.arguments) });
        }
        out.push({ role: "assistant", content: content.length ? content : "..." });
      }
    } else if (m.role === "tool") {
      const block: Anthropic.Beta.BetaToolResultBlockParam = {
        type: "tool_result",
        tool_use_id: m.tool_call_id!,
        content: m.content ?? "",
        ...(m.content?.startsWith("ERROR") ? { is_error: true } : {}),
      };
      // همه نتایج ابزارهای یک نوبت باید در یک پیام user بیایند
      const last = out[out.length - 1];
      if (last?.role === "user" && Array.isArray(last.content) && last.content.every((b) => b.type === "tool_result")) {
        (last.content as Anthropic.Beta.BetaContentBlockParam[]).push(block);
      } else {
        out.push({ role: "user", content: [block] });
      }
    }
  }
  return { system, messages: out };
}

function safeJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}

export class ClaudeClient implements ChatClient {
  private client: Anthropic;
  private model: string;

  constructor(private opts: ClaudeOptions = {}) {
    this.client = new Anthropic(opts.apiKey ? { apiKey: opts.apiKey } : {});
    this.model = opts.model ?? DEFAULT_CLAUDE_MODEL;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const { system, messages } = toAnthropic(req.messages);
    const tools: Anthropic.Beta.BetaTool[] = (req.tools ?? []).map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters as Anthropic.Beta.BetaTool.InputSchema,
    }));

    try {
      const response = await this.client.beta.messages.create(
        {
          model: req.model ?? this.model,
          max_tokens: this.opts.maxTokens ?? 16000,
          system,
          messages,
          tools: tools.length ? tools : undefined,
          output_config: { effort: this.opts.effort ?? "medium" },
          // اگر درخواستی به‌اشتباه رد شود، سرور خودش با مدل جایگزین ادامه می‌دهد
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        },
        { signal: req.signal },
      );

      if (response.stop_reason === "refusal") {
        throw new ClaudeError("Claude این درخواست را رد کرد. دستور را به شکل دیگری بنویسید.");
      }

      const text = response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const toolCalls: ToolCall[] = response.content
        .filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use")
        .map((b) => ({ id: b.id, type: "function", function: { name: b.name, arguments: JSON.stringify(b.input) } }));

      return {
        message: {
          role: "assistant",
          content: text || null,
          tool_calls: toolCalls.length ? toolCalls : undefined,
          providerRaw: response.content,
        },
        finishReason: response.stop_reason ?? "end_turn",
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (e) {
      if (e instanceof ClaudeError) throw e;
      if (e instanceof Anthropic.AuthenticationError) throw new ClaudeError("کلید API برای Claude نامعتبر است", 401);
      if (e instanceof Anthropic.RateLimitError) throw new ClaudeError("محدودیت تعداد درخواست Claude؛ کمی بعد دوباره امتحان کنید", 429);
      if (e instanceof Anthropic.APIConnectionError) throw new ClaudeError("ارتباط با Claude برقرار نشد (اینترنت را بررسی کنید)");
      if (e instanceof Anthropic.APIError) throw new ClaudeError(`خطای Claude با کد ${e.status}: ${e.message}`, e.status);
      throw e;
    }
  }
}
