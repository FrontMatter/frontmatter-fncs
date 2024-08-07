import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { GitHubService } from "../services/GithubService";

export async function http_backers_v2(
  request: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  const body = (await request.json()) as { token: string };

  if (!body.token) {
    return {
      status: 403,
      jsonBody: {},
    };
  }

  const username = await GitHubService.getUser(body.token);
  if (!username) {
    return {
      status: 403,
      jsonBody: {},
    };
  }

  const backers = process.env.BACKERS || "";
  const allBackers = backers.split(",");
  if (allBackers.includes(username)) {
    return {
      status: 200,
      body: `Thanks for your support ${username}! 🎉👏🏼`,
    };
  }

  const sponsors = await GitHubService.getSponsors();
  const sponsor = sponsors.find((s: any) => s.login === username);
  if (sponsor) {
    return {
      status: 200,
      body: `Thanks for your support ${username}! 🎉👏🏼`,
    };
  }

  return {
    status: 403,
    jsonBody: {},
  };
}

app.http("backers-v2", {
  route: "v2/backers",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: http_backers_v2,
});
