import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { createClient } from "@supabase/supabase-js";
import { MendableChatResponse } from "../models/MendableChatResponse";

export async function http_mendable_chat(
  request: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  const aiKey = process.env.MENDABLE_ANON_KEY;
  const aiUrl = process.env.MENDABLE_ANON_URL;

  if (request.method === "OPTIONS") {
    return {
      status: 200,
    };
  }

  if (!aiKey || !aiUrl) {
    return {
      status: 500,
      jsonBody: {
        error: "Missing API data",
      },
    };
  }

  const chatData = (await request.json()) as {
    chatId: string;
    question: string;
  };

  if (!chatData.chatId || !chatData.question) {
    return {
      status: 400,
      jsonBody: {
        error: "Missing chat data",
      },
    };
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    await supabase.from("frontmatter_ai_qa").insert([
      {
        question: chatData.question,
      },
    ]);
  }

  const response = await fetch(`${aiUrl}/mendableChat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "*",
    },
    body: JSON.stringify({
      api_key: aiKey,
      question: chatData.question,
      history: [{ prompt: "", response: "", sources: [] }],
      conversation_id: chatData.chatId,
      shouldStream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`unexpected response ${response.statusText}`);
  }

  const data = {
    sources: [],
    answer: "",
    answerId: undefined,
  };

  try {
    const responseData: MendableChatResponse = await response.json();

    data.answer = responseData.answer.text;
    data.answerId = responseData.message_id;
    data.sources = responseData.sources.map((s) => s.link);
  } catch (err) {
    console.log(err.message);
    // noop
  }

  return {
    status: 200,
    jsonBody: data,
  };
}

app.http("ai-chat", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: http_mendable_chat,
});
