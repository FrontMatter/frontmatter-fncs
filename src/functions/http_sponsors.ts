import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { GitHubService } from "../services/GithubService";

export async function http_sponsors(
  _: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  let sponsors = [];

  const gitHubSponsors = await GitHubService.getSponsors();
  sponsors = [...gitHubSponsors];

  const ocResponse = await fetch(
    `https://opencollective.com/frontmatter/members.json`
  );
  if (ocResponse && ocResponse.ok) {
    const data = await ocResponse.json();
    sponsors = [
      ...sponsors,
      ...data
        .filter((s: any) => s.role === "BACKER" && s.isActive)
        .map((s: any) => ({
          id: s.MemberId,
          name: s.name,
          url: s.website,
          avatarUrl: s.image,
        })),
    ];
  }

  if (sponsors && sponsors.length > 0) {
    return {
      jsonBody: sponsors,
    };
  }

  return {
    jsonBody: null,
  };
}

app.http("sponsors", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: http_sponsors,
});
