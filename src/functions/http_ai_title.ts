import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  app,
} from "@azure/functions";
import { GitHubService } from "../services/GithubService";
import { OpenAiService } from "../services/OpenAiService";

export async function http_ai_title(
  request: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  const body = (await request.json()) as {
    token: string;
    title: string;
    nrOfCharacters: number;
  };

  if (!body.token || !body.title) {
    return {
      status: 403,
      jsonBody: {},
    };
  }

  const { token, title, nrOfCharacters } = body;

  const username = await GitHubService.getUser(token);
  if (!username) {
    return {
      status: 403,
      jsonBody: {},
    };
  }

  const sponsors = await GitHubService.getSponsors();
  const backers = (process.env.BACKERS || "").split(",");

  const sponsor = sponsors.find((s: any) => s.login === username);

  if (!backers?.includes(username) && !sponsor) {
    return {
      status: 403,
      jsonBody: {},
    };
  }

  const instruction = `Come up with a better title for my blog post that has the working title "${title}". It should not be more than ${
    nrOfCharacters || 60
  } characters in total. The desired format should be just a string, e.g. "My first blog post"`;

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

app.http("ai-title", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: http_ai_title,
});
