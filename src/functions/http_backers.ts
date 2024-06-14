import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

export async function http_backers(
  request: HttpRequest,
  __: InvocationContext
): Promise<HttpResponseInit> {
  const backers = process.env.BACKERS;
  const { query } = request;

  if (!query.has(`backer`)) {
    return {
      status: 400,
      body: "Missing backer parameter",
    };
  }

  if (!backers) {
    return {
      status: 500,
      body: "No backers configured",
    };
  }

  const allBackers = backers.split(",");
  const backer = query.get(`backer`);
  if (!allBackers.includes(backer)) {
    return {
      status: 400,
      body: `Sorry, it seems you haven't supported the project yet.`,
    };
  }

  return {
    status: 200,
    body: `Thanks for your support ${backer}! 🎉👏🏼`,
  };
}

app.http("backers", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: http_backers,
});
