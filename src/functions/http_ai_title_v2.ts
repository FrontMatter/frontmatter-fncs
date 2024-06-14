import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  app,
} from "@azure/functions";
import { GitHubService } from "../services/GithubService";
import { OpenAiService } from "../services/OpenAiService";

export async function http_ai_title_v2(
  request: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  const body = (await request.json()) as {
    token: string;
    title: string;
    nrOfCharacters: number;
  };

  const { token, title, nrOfCharacters } = body;

  console.log("token", token);

  if (!token || !title) {
    return {
      status: 403,
      jsonBody: {},
    };
  }

  const username = await GitHubService.getUser(token);
  if (!username) {
    return {
      status: 403,
      jsonBody: {},
    };
  }

  const instruction = `Generate engaging blog post title, with a maximum of ${
    nrOfCharacters || 60
  } characters.
  
  The topic of the blog post is: ${title}.
  
  Desired format: just a string, e.g. "My first blog post"`;

  const choices = await OpenAiService.getCompletion(instruction);

  const results: string[] = choices.map((choice: any) => {
    let title = choice.text.trim();
    if (title.startsWith("1. ")) {
      title = title.substring(2, title.length);
    }
    return title.replace(/^"(.*)"$/, "$1").trim() || "";
  });

  return {
    status: 200,
    jsonBody: results,
  };
}

app.http("http_ai_title_v2", {
  route: "ai/title",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: http_ai_title_v2,
});
