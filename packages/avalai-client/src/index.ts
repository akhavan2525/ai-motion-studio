/**
 * کلاینت AvalAI (سازگار با OpenAI Chat Completions + Tool Calling).
 * کلید API از بیرون تزریق می‌شود؛ این پکیج هیچ کلیدی را ذخیره نمی‌کند.
 *
 * ChatClient قرارداد مشترک همه ارائه‌دهنده‌هاست (AvalAI، Claude و ...)
 * تا ai-agent به هیچ ارائه‌دهنده خاصی وابسته نباشد.
 */

export const AVALAI_BASE_URL = "https://api.avalai.ir/v1";
export const DEFAULT_MODEL = "gpt-4.1-mini";

export type Role = "system" | "user" | "assistant" | "tool";

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: Role;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
  /** محتوای خام پاسخ ارائه‌دهنده (مثلاً بلوک‌های thinking در Claude) تا بدون تغییر برگردانده شود */
  providerRaw?: unknown;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatRequest {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
}

export interface ChatResponse {
  message: ChatMessage;
  finishReason: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface ChatClient {
  chat(req: ChatRequest): Promise<ChatResponse>;
}

export class AvalAIError extends Error {
  constructor(message: string, public status?: number, public body?: string) {
    super(message);
    this.name = "AvalAIError";
  }
}

export interface AvalAIOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  /** حداکثر زمان هر درخواست (میلی‌ثانیه) */
  timeoutMs?: number;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
}

export class AvalAIClient implements ChatClient {
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;
  private maxRetries: number;
  private fetchImpl: typeof fetch;

  constructor(private opts: AvalAIOptions) {
    if (!opts.apiKey) throw new AvalAIError("کلید API برای AvalAI تنظیم نشده است");
    this.baseUrl = (opts.baseUrl ?? AVALAI_BASE_URL).replace(/\/$/, "");
    this.model = opts.model ?? DEFAULT_MODEL;
    this.timeoutMs = opts.timeoutMs ?? 60_000;
    this.maxRetries = opts.maxRetries ?? 2;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const body = JSON.stringify({
      model: req.model ?? this.model,
      messages: req.messages.map(({ providerRaw: _raw, ...m }) => m),
      tools: req.tools?.length ? req.tools : undefined,
      tool_choice: req.tools?.length ? "auto" : undefined,
      temperature: req.temperature ?? 0.3,
    });

    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      req.signal?.addEventListener("abort", () => ctrl.abort());
      try {
        const res = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.opts.apiKey}`,
          },
          body,
          signal: ctrl.signal,
        });
        const text = await res.text();
        if (!res.ok) {
          const err = new AvalAIError(describeStatus(res.status), res.status, text);
          // فقط خطاهای موقت را دوباره امتحان می‌کنیم
          if (res.status === 429 || res.status >= 500) {
            lastErr = err;
            await sleep(500 * 2 ** attempt);
            continue;
          }
          throw err;
        }
        const json = JSON.parse(text);
        const choice = json.choices?.[0];
        if (!choice?.message) throw new AvalAIError("پاسخ نامعتبر از AvalAI", res.status, text);
        return { message: choice.message, finishReason: choice.finish_reason, usage: json.usage };
      } catch (e) {
        if (e instanceof AvalAIError) throw e;
        lastErr = e;
        if (req.signal?.aborted) throw new AvalAIError("درخواست لغو شد");
        await sleep(500 * 2 ** attempt);
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr instanceof Error
      ? new AvalAIError(`ارتباط با AvalAI برقرار نشد: ${lastErr.message}`)
      : new AvalAIError("ارتباط با AvalAI برقرار نشد");
  }
}

function describeStatus(status: number): string {
  if (status === 401) return "کلید API نامعتبر است (401)";
  if (status === 402) return "اعتبار حساب AvalAI کافی نیست (402)";
  if (status === 429) return "محدودیت تعداد درخواست AvalAI (429)";
  return `خطای AvalAI با کد ${status}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
