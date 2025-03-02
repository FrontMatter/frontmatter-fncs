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
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  
  if (ocResponse && ocResponse.ok) {
    const data = await ocResponse.json();
    sponsors = [
      ...sponsors,
      ...data
        .filter((s: any) => {
          // Check if the backer is active
          if (s.role === "BACKER" && s.isActive) {
            // Check if lastTransactionAt is within the last 2 months
            const lastTransaction = new Date(s.lastTransactionAt);
            return lastTransaction >= twoMonthsAgo;
          }
          return true;
        })
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
