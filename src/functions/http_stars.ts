import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

export async function http_stars(
  _: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  if (!process.env.GITHUB_AUTH) {
    return {
      status: 401,
      body: "Unauthorized",
    };
  }

  let headers = {
    Authorization: `token ${process.env.GITHUB_AUTH}`,
    "user-agent": "frontmatter",
  };

  const response = await fetch(
    `https://api.github.com/repos/estruyf/vscode-front-matter`,
    {
      headers,
    }
  );

  if (response && response.ok) {
    const data = await response.json();

    return {
      status: 200,
      jsonBody: { stars: data?.stargazers_count },
    };
  }

  return {
    status: 200,
    jsonBody: {
      stars: null,
    },
  };
}

app.http("http_stars", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: http_stars,
});
