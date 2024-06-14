import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { createClient } from "@supabase/supabase-js";

export async function http_ai_chat(
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
    // TODO: Fix the chunking
    const body = await response.text();
    for await (const chunk of body) {
      try {
        let chunkString = chunk.toString();
        if (chunkString.startsWith("data: ")) {
          chunkString = chunkString.substring(6);
        }
        const chunkData = JSON.parse(chunkString);

        if (chunkData.chunk === "<|source|>" && chunkData.metadata) {
          const metadata =
            chunkData.metadata.map((m: any) => m.link) || ([] as string[]);
          data.sources = metadata;
        } else if (chunkData.chunk === "<|message_id|>" && chunkData.metadata) {
          data.answerId = chunkData.metadata;
        } else {
          data.answer += chunkData.chunk;
        }
      } catch (e) {
        // noop
      }
    }
  } catch (err) {}

  return {
    status: 200,
    jsonBody: data,
  };
}

app.http("ai-chat", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: http_ai_chat,
});
