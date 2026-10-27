/**
 * انتخاب مغز AI. نسخه اول: Claude. مرحله بعد: AvalAI.
 * بدون کلید، agent به برنامه‌ریز آفلاین برمی‌گردد.
 */
import { AvalAIClient, type ChatClient } from "@ams/avalai-client";
import { ClaudeClient } from "@ams/claude-client";

export type ProviderName = "claude" | "avalai" | "offline";

export interface ProviderConfig {
  provider: ProviderName;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export function createChatClient(cfg: ProviderConfig): ChatClient | null {
  switch (cfg.provider) {
    case "claude":
      return new ClaudeClient({ apiKey: cfg.apiKey, model: cfg.model });
    case "avalai":
      if (!cfg.apiKey) return null;
      return new AvalAIClient({ apiKey: cfg.apiKey, model: cfg.model, baseUrl: cfg.baseUrl });
    default:
      return null;
  }
}

/** از متغیرهای محیطی: AMS_PROVIDER، ANTHROPIC_API_KEY، AVALAI_API_KEY */
export function providerFromEnv(env: Record<string, string | undefined> = process.env): ProviderConfig {
  const forced = env.AMS_PROVIDER as ProviderName | undefined;
  if (forced === "offline") return { provider: "offline" };
  if (forced === "avalai" || (!forced && !env.ANTHROPIC_API_KEY && env.AVALAI_API_KEY)) {
    return env.AVALAI_API_KEY ? { provider: "avalai", apiKey: env.AVALAI_API_KEY, model: env.AVALAI_MODEL } : { provider: "offline" };
  }
  if (forced === "claude" || env.ANTHROPIC_API_KEY) {
    return { provider: "claude", apiKey: env.ANTHROPIC_API_KEY, model: env.CLAUDE_MODEL };
  }
  return { provider: "offline" };
}
