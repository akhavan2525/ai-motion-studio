import { describe, expect, it } from "vitest";
import { toAnthropic } from "@ams/claude-client";

describe("تبدیل پیام‌ها برای Claude", () => {
  it("system جدا، نتایج ابزار در یک پیام user، بلوک‌های خام دست‌نخورده", () => {
    const raw = [{ type: "thinking", thinking: "", signature: "x" }, { type: "tool_use", id: "a", name: "createProject", input: {} }];
    const r = toAnthropic([
      { role: "system", content: "S" },
      { role: "user", content: "سلام" },
      { role: "assistant", content: null, providerRaw: raw, tool_calls: [{ id: "a", type: "function", function: { name: "createProject", arguments: "{}" } }] },
      { role: "tool", tool_call_id: "a", content: "OK" },
      { role: "tool", tool_call_id: "b", content: "ERROR: x" },
    ]);
    expect(r.system).toBe("S");
    expect(r.messages).toHaveLength(3);
    expect(r.messages[1].content).toBe(raw);
    const results = r.messages[2].content as any[];
    expect(results).toHaveLength(2);
    expect(results[1].is_error).toBe(true);
  });
});
