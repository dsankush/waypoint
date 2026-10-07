import { after } from "next/server";
import type OpenAI from "openai";
import { errorResponse, HttpError, requireUser } from "@/lib/auth";
import { addChat, countRuns, logRun, recentChat } from "@/lib/db";
import { buildCandidateContext } from "@/lib/context";
import { ADVISOR_TOOL, advisorSystemPrompt, sanitizeToolFields } from "@/lib/advisor-prompt";
import { ai, MODEL } from "@/lib/openai";
import { sanitizeForm } from "@/lib/sanitize";
import { maybeSummarise } from "@/lib/summary";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const body = await req.json().catch(() => ({}));
    const message = String(body?.message ?? "").trim();
    if (!message) throw new HttpError(400, "Please write a message.");
    if (message.length > 2000) throw new HttpError(400, "That message is a little long. Please shorten it.");
    if ((await countRuns(u.id, ["chat"], 60 * 60 * 1000)) >= 120) {
      throw new HttpError(429, "You have sent a lot of messages this hour. Please try again a little later.");
    }
    await logRun(u.id, "chat", undefined, message.length);

    const form = sanitizeForm(body?.profile);
    const [ctx, history] = await Promise.all([
      buildCandidateContext(u.id, { liveForm: form, includeMessages: false }),
      recentChat(u.id, 20),
    ]);
    await addChat(u.id, "user", message);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: advisorSystemPrompt(ctx.text, ctx.form.currency || "INR") },
      ...history.map((m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.ChatCompletionMessageParam),
      { role: "user", content: message },
    ];

    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
        let reply = "";
        try {
          for (let round = 0; round < 3; round++) {
            const s = await ai().chat.completions.create({
              model: MODEL(),
              stream: true,
              temperature: 0.6,
              max_tokens: 400,
              tools: [ADVISOR_TOOL],
              messages,
            });
            let text = "";
            const calls: Record<number, { id: string; name: string; args: string }> = {};
            for await (const chunk of s) {
              const d = chunk.choices[0]?.delta;
              if (!d) continue;
              if (d.content) {
                text += d.content;
                send({ type: "token", text: d.content });
              }
              for (const tc of d.tool_calls ?? []) {
                const c = (calls[tc.index] ??= { id: "", name: "", args: "" });
                if (tc.id) c.id = tc.id;
                if (tc.function?.name) c.name = tc.function.name;
                if (tc.function?.arguments) c.args += tc.function.arguments;
              }
            }
            reply += text;
            const list = Object.values(calls).filter((c) => c.name === "update_profile_fields");
            if (!list.length) break;

            messages.push({
              role: "assistant",
              content: text || null,
              tool_calls: list.map((c) => ({
                id: c.id, type: "function" as const,
                function: { name: c.name, arguments: c.args || "{}" },
              })),
            });
            for (const c of list) {
              let fields: Record<string, unknown> = {};
              try { fields = sanitizeToolFields(JSON.parse(c.args || "{}")); } catch { /* ignore bad JSON */ }
              if (Object.keys(fields).length) send({ type: "fields", data: fields });
              messages.push({ role: "tool", tool_call_id: c.id, content: "Saved to the form." });
            }
          }
          if (reply.trim()) await addChat(u.id, "assistant", reply.trim());
          send({ type: "done" });
        } catch {
          send({ type: "error", message: "Sorry, I could not reply just now. Please try again." });
        } finally {
          controller.close();
        }
      },
    });
    after(async () => {
      try { await maybeSummarise(u.id); } catch { /* best effort */ }
    });
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
