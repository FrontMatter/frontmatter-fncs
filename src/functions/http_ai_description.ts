import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { GitHubService } from "../services/GithubService";
import { OpenAiService } from "../services/OpenAiService";

export async function http_ai_description(
  request: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  const body = (await request.json()) as {
    token: string;
    title: string;
    content: string;
    nrOfCharacters: number;
  };

  const { token, title, content, nrOfCharacters } = body;

  if (!token || !title) {
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

  // Use a maximum of 2000 characters for the content
  let articleContent = content;
  if (articleContent.length > 2000) {
    articleContent = articleContent.substring(0, 2000);
  }

  const instruction = `Generate an abstract for the following content which will be included in the webpage its meta description. The length of the text should not exceed ${
    nrOfCharacters || 160
  } characters.
  
  The topic of the blog post is: """
  ${title}
  """

  The contents of the blog post are: """
  ${articleContent}
  """.
  
  Desired format: just a string without any line breaks or other formatting. make sure it is a full sentence.`;

  const choices = await OpenAiService.getCompletion(instruction, 1);

  const results: string[] = choices.map((choice: any) => {
    let title = choice.text.trim();
    if (title.startsWith("1. ")) {
      title = title.substring(2, title.length);
    }
    return title.replace(/^"(.*)"$/, "$1").trim() || "";
  });

  if (results.length === 0) {
    return {
      status: 200,
      body: "",
    };
  }

  return {
    status: 200,
    body: results[0],
  };
}

app.http("http_ai_description", {
  route: "ai/description",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: http_ai_description,
});
