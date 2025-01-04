import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

export async function http_stars(
  request: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  const { query } = request;

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

  let apiUrl = "https://api.github.com/repos/estruyf/vscode-front-matter";
  if (query.has(`repo`)) {
    const repo = query.get(`repo`);
    if (repo.includes("vscode-demo-time")) {
      apiUrl = `https://api.github.com/repos/${repo}`; 
    }
  }

  const response = await fetch(
    apiUrl,
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

app.http("stars", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: http_stars,
});
