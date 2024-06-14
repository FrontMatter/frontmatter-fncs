import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { GitHubService } from "../services/GithubService";
import { OpenAiService } from "../services/OpenAiService";

export async function http_ai_taxonomy(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const body = (await request.json()) as {
    token: string;
    title: string;
    description: string;
    taxonomy: string | string[];
    type: string;
  };

  const { token, title, description, taxonomy, type } = body;

  if (!token || !title) {
    return {
      status: 403,
      jsonBody: {},
    };
  }

  if ((!title && !description) || !taxonomy) {
    return {
      status: 403,
      jsonBody: {},
    };
  }

  const username = await GitHubService.verifyUser(token);
  if (!username) {
    return {
      status: 403,
      jsonBody: {},
    };
  }

  const instruction = `Pick the best matching ${type} from the comma separated list of ${type} for the provided content.
      
    ${title ? `The title of the blog post is: ${title}.` : ""}
    
    ${description ? `The description of the blog post is: ${description}.` : ""}
    
    The list of ${type}: ${
    typeof taxonomy === "string" ? taxonomy : taxonomy.join(", ")
  }
    
    You are allowed to suggest new ${type} if you think they are relevant. 
    
    The result should be a comma separated list of ${type}.`;

  const choices = await OpenAiService.getCompletion(instruction, 1, 0.5, 500);

  const result: string = choices
    .map((choice: any) => {
      let title = choice.text.trim();
      if (title.startsWith("1. ")) {
        title = title.substring(2, title.length);
      }
      return title.replace(/^"(.*)"$/, "$1").trim() || "";
    })
    .pop();

  const values = result.split(",").map((t) => t.trim());
  // Return the first 5 values
  return {
    status: 200,
    jsonBody: values.slice(0, 5),
  };
}

app.http("http_ai_taxonomy", {
  route: "ai/taxonomy",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: http_ai_taxonomy,
});
