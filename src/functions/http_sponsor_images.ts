import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

export async function http_sponsor_images(
  _: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  const response = await fetch(`https://api.github.com/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `token ${process.env.GITHUB_AUTH}`,
    },
    body: JSON.stringify({
      query: `query SponsorQuery {
          viewer {
            login
            sponsors(first: 100) {
              edges {
                node {
                  ... on User {
                    id
                    name
                    url
                    avatarUrl
                  }
                  ... on Organization {
                    id
                    name
                    url
                    avatarUrl
                  }
                }
              }
            }
          }
        }`,
    }),
  });

  let sponsors = [];

  if (response && response.ok) {
    const data = await response.json();
    sponsors = data.data.viewer.sponsors.edges.map((edge: any) => edge.node);
  }

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
    const image = await generateImage(sponsors);

    return {
      status: 200,
      body: image,
      headers: {
        "Content-Type": "image/svg+xml",
      },
    };
  }

  return {
    status: 200,
    body: null,
    headers: {
      "Content-Type": "image/svg+xml",
    },
  };
}

app.http("img-sponsors", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: http_sponsor_images,
});
