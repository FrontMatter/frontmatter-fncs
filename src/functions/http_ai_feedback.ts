import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

export async function http_ai_feedback(
  request: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  const aiUrl = process.env.MENDABLE_ANON_URL;

  if (!aiUrl) {
    return {
      status: 500,
      jsonBody: {
        error: "No AI configured",
      },
    };
  }

  const chatData = (await request.json()) as { vote: number; answerId: string };

  await fetch(`${aiUrl}/updateMessageRating/${chatData.answerId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ratingValue: chatData.vote,
    }),
  });

  return {
    status: 201,
    jsonBody: {},
  };
}

app.http("ai-feedback", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: http_ai_feedback,
});
