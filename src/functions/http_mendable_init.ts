import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { NewConversationResponse } from "../models/NewConversationResponse";

export async function http_mendable_init(
  _: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  const aiKey = process.env.MENDABLE_ANON_KEY;
  const aiUrl = process.env.MENDABLE_ANON_URL;

  if (!aiKey || !aiUrl) {
    return {
      status: 500,
      jsonBody: {
        error: "No AI configured",
      },
    };
  }

  const newChatResponse = await fetch(`${aiUrl}/newConversation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: aiKey,
    }),
  });

  if (!newChatResponse.ok) {
    return {
      status: 500,
      jsonBody: {
        error: "AI failed to initialize chat",
      },
    };
  }

  const newChat: NewConversationResponse = await newChatResponse.json();

  return {
    status: 200,
    jsonBody: {
      company: "frontmatter",
      chatId: newChat.conversation_id,
    },
  };
}

app.http("ai-init", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: http_mendable_init,
});
