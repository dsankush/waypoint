import { errorResponse, requireUser } from "@/lib/auth";
import { addChat, recentChat } from "@/lib/db";

export async function GET() {
  try {
    const u = await requireUser();
    let messages = await recentChat(u.id, 200);
    if (messages.length === 0) {
      const greeting =
        `Hello ${u.name}, I am your Career Advisor. I will help you capture your job preferences and your expected pay. ` +
        `To begin: which kinds of roles interest you most?`;
      await addChat(u.id, "assistant", greeting);
      messages = [{ role: "assistant", content: greeting }];
    }
    return Response.json({ messages });
  } catch (e) {
    return errorResponse(e);
  }
}
